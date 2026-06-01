package com.starrupture.scanner.service;

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

/**
 * Downloads the .sav through the host's HTTP Web-FTP bridge (Monsta FTP handler):
 * the provider's server performs the FTP fetch over its LAN and streams the file
 * over HTTPS, bypassing the passive FTP data channel blocked on the client side.
 */
@Service
@Slf4j
public class HttpBridgeService {

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.NORMAL)
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

    /** Lightweight test: fetch only the first bytes, validate it's a binary file. */
    public String test(String bridgeUrl, String host, String user, String password, String path) {
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
