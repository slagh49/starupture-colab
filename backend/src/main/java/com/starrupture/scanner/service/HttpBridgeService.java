package com.starrupture.scanner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.starrupture.scanner.security.SsrfGuard;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Comparator;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.stream.StreamSupport;

/**
 * Downloads the .sav through the host's HTTP Web-FTP bridge (Monsta FTP handler):
 * the provider's server performs the FTP fetch over its LAN and streams the file
 * over HTTPS, bypassing the passive FTP data channel blocked on the client side.
 */
@Service
@Slf4j
public class HttpBridgeService {

    // Pas de suivi de redirection : une redirection vers une adresse interne
    // contournerait la garde anti-SSRF appliquée à l'URL passerelle d'origine.
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    private String buildUrl(String bridgeUrl, String host, String user, String password, String path) {
        return bridgeUrl + "?action=download"
                + "&h=" + enc(host)
                + "&u=" + enc(user)
                + "&p=" + enc(password)
                + "&path=" + enc(path);
    }

    private static String enc(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }

    /** Download the full .sav file via the bridge. */
    public byte[] download(String bridgeUrl, String host, String user, String password, String path) throws IOException {
        SsrfGuard.checkUrl(bridgeUrl);
        HttpRequest req = HttpRequest.newBuilder(URI.create(buildUrl(bridgeUrl, host, user, password, path)))
                .timeout(Duration.ofMinutes(4))
                .GET().build();
        try {
            HttpResponse<byte[]> resp = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (resp.statusCode() != 200) {
                throw new IOException("Passerelle HTTP : code " + resp.statusCode());
            }
            byte[] body = resp.body();
            // A valid .sav is large & binary; a bridge error is short JSON/HTML text.
            if (body.length < 64 || body[0] == '{' || body[0] == '<') {
                throw new IOException("Réponse passerelle invalide : "
                        + new String(body, StandardCharsets.UTF_8).strip());
            }
            log.info("Téléchargement passerelle OK : {} octets", body.length);
            return body;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Téléchargement passerelle interrompu");
        }
    }

    /** Résultat d'un téléchargement nommé (filename + contenu brut). */
    public record NamedDownload(String filename, byte[] bytes) {}

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Liste le dossier via la passerelle (action=list), prend le .sav le plus
     * récent, et le télécharge. Résout la rotation des slots AutoSave0/1/2.
     */
    public NamedDownload downloadMostRecent(String bridgeUrl, String host, String user, String password, String directory) throws IOException {
        SsrfGuard.checkUrl(bridgeUrl);
        // Lister le dossier
        String listUrl = bridgeUrl + "?action=list"
                + "&h=" + enc(host)
                + "&u=" + enc(user)
                + "&p=" + enc(password)
                + "&path=" + enc(directory);
        HttpRequest req = HttpRequest.newBuilder(URI.create(listUrl))
                .timeout(Duration.ofSeconds(30))
                .GET().build();
        try {
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                throw new IOException("Passerelle list : code " + resp.statusCode());
            }

            JsonNode root = objectMapper.readTree(resp.body());
            // Monsta FTP renvoie { data: [ {name, type, mtime, size}, ... ] } ou
            // directement un tableau. On gère les deux.
            JsonNode items = root.has("data") ? root.path("data") : root;
            if (!items.isArray()) {
                throw new IOException("Réponse de listing inattendue : " + resp.body().substring(0, Math.min(200, resp.body().length())));
            }

            record FileEntry(String name, long mtime) {}
            FileEntry best = StreamSupport.stream(
                            Spliterators.spliteratorUnknownSize(items.elements(), Spliterator.ORDERED), false)
                    .filter(n -> {
                        String name = n.path("name").asText("");
                        String type = n.has("type") ? n.path("type").asText("") : "";
                        return name.toLowerCase().endsWith(".sav") && !"dir".equalsIgnoreCase(type);
                    })
                    .map(n -> new FileEntry(n.path("name").asText(), n.path("mtime").asLong(0)))
                    .max(Comparator.comparingLong(e -> e.mtime))
                    .orElseThrow(() -> new IOException("Aucun fichier .sav trouvé dans " + directory));

            log.info("Slot le plus récent (passerelle) : {} (mtime={})", best.name, best.mtime);

            String filePath = directory.endsWith("/")
                    ? directory + best.name
                    : directory + "/" + best.name;
            return new NamedDownload(best.name, download(bridgeUrl, host, user, password, filePath));

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Listing passerelle interrompu");
        }
    }

    /** Lightweight test: fetch only the first bytes, validate it's a binary file. */
    public String test(String bridgeUrl, String host, String user, String password, String path) {
        try {
            SsrfGuard.checkUrl(bridgeUrl);
        } catch (IOException e) {
            return e.getMessage();
        }
        HttpRequest req = HttpRequest.newBuilder(URI.create(buildUrl(bridgeUrl, host, user, password, path)))
                .timeout(Duration.ofSeconds(25))
                .header("Range", "bytes=0-2047")
                .GET().build();
        try {
            HttpResponse<InputStream> resp = client.send(req, HttpResponse.BodyHandlers.ofInputStream());
            int code = resp.statusCode();
            try (InputStream in = resp.body()) {
                if (code != 200 && code != 206) {
                    return "Passerelle HTTP : code " + code;
                }
                byte[] head = in.readNBytes(2048);
                if (head.length < 8) {
                    return "Réponse passerelle vide : " + new String(head, StandardCharsets.UTF_8).strip();
                }
                if (head[0] == '{' || head[0] == '<') {
                    String msg = new String(head, StandardCharsets.UTF_8).strip();
                    return "Passerelle a renvoyé une erreur : " + msg.substring(0, Math.min(msg.length(), 160));
                }
                return null;
            }
        } catch (Exception e) {
            return e.getMessage();
        }
    }
}
