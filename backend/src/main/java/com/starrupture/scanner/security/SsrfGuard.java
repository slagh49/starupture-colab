package com.starrupture.scanner.security;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Set;

/**
 * Garde anti-SSRF (Server-Side Request Forgery).
 *
 * <p>Les imports FTP/Web-FTP partent vers un hôte et une URL passerelle
 * <b>configurés par l'administrateur</b>. Sans contrôle, une valeur malveillante
 * pourrait pointer vers le réseau interne (ex. {@code http://localhost:8080},
 * {@code http://169.254.169.254/} métadonnées cloud, IP privées) et exfiltrer
 * des services internes via le serveur. Cette garde valide le schéma et refuse
 * toute résolution vers une adresse loopback / lien-local / privée / multicast.
 */
public final class SsrfGuard {

    private SsrfGuard() {}

    private static final Set<String> ALLOWED_SCHEMES = Set.of("http", "https");

    /** Valide une URL HTTP(S) absolue et l'innocuité de son hôte. */
    public static void checkUrl(String url) throws IOException {
        if (url == null || url.isBlank()) {
            throw new IOException("URL vide");
        }
        URI uri;
        try {
            uri = URI.create(url.strip());
        } catch (IllegalArgumentException e) {
            throw new IOException("URL invalide");
        }
        String scheme = uri.getScheme();
        if (scheme == null || !ALLOWED_SCHEMES.contains(scheme.toLowerCase())) {
            throw new IOException("Schéma d'URL non autorisé (http/https uniquement)");
        }
        if (uri.getHost() == null || uri.getHost().isBlank()) {
            throw new IOException("Hôte d'URL manquant");
        }
        checkHost(uri.getHost());
    }

    /** Résout un hôte et refuse toute adresse interne (SSRF). */
    public static void checkHost(String host) throws IOException {
        if (host == null || host.isBlank()) {
            throw new IOException("Hôte manquant");
        }
        String h = host.strip();
        if (h.startsWith("[") && h.endsWith("]")) {
            h = h.substring(1, h.length() - 1); // littéral IPv6
        }
        InetAddress[] addrs;
        try {
            addrs = InetAddress.getAllByName(h);
        } catch (UnknownHostException e) {
            throw new IOException("Hôte introuvable : " + host);
        }
        for (InetAddress addr : addrs) {
            if (isInternal(addr)) {
                throw new IOException("Accès à une adresse interne refusé : " + host
                        + " (" + addr.getHostAddress() + ")");
            }
        }
    }

    private static boolean isInternal(InetAddress a) {
        // Couvre 0.0.0.0, 127/8, ::1, 169.254/16 (métadonnées cloud), fe80::/10,
        // 10/8, 172.16/12, 192.168/16, fec0::/10, et le multicast.
        if (a.isAnyLocalAddress() || a.isLoopbackAddress() || a.isLinkLocalAddress()
                || a.isSiteLocalAddress() || a.isMulticastAddress()) {
            return true;
        }
        byte[] b = a.getAddress();
        if (b.length == 4) {
            int o0 = b[0] & 0xFF, o1 = b[1] & 0xFF;
            if (o0 == 100 && o1 >= 64 && o1 <= 127) return true; // 100.64/10 (CGNAT)
        } else if (b.length == 16) {
            if ((b[0] & 0xFE) == 0xFC) return true; // fc00::/7 (unique local)
        }
        return false;
    }
}
