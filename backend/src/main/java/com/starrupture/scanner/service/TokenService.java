package com.starrupture.scanner.service;

import com.starrupture.scanner.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

/**
 * Stateless signed auth tokens: {@code base64url(payload).base64url(hmacSHA256(payload))}
 * where payload is {@code userId:username:role:expiryEpochMillis}. No DB/Redis storage —
 * validity is verified by recomputing the HMAC and checking the expiry.
 */
@Service
@Slf4j
public class TokenService {

    private final byte[] secret;
    private final long ttlMillis;

    public TokenService(
            @Value("${app.auth.secret}") String secret,
            @Value("${app.auth.token-ttl-hours:168}") long ttlHours) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttlMillis = ttlHours * 3600_000L;
    }

    public record TokenInfo(String userId, String username, String role) {
    }

    public String issue(User user) {
        long expiry = System.currentTimeMillis() + ttlMillis;
        String payload = user.getId() + ":" + user.getUsername() + ":" + user.getRole() + ":" + expiry;
        return enc(payload) + "." + enc(sign(payload));
    }

    public Optional<TokenInfo> validate(String token) {
        if (token == null) {
            return Optional.empty();
        }
        int dot = token.indexOf('.');
        if (dot <= 0) {
            return Optional.empty();
        }
        String payloadB64 = token.substring(0, dot);
        String sigB64 = token.substring(dot + 1);
        String payload = new String(dec(payloadB64), StandardCharsets.UTF_8);
        if (!constantTimeEquals(sign(payload), dec(sigB64))) {
            return Optional.empty();
        }
        String[] parts = payload.split(":");
        if (parts.length != 4) {
            return Optional.empty();
        }
        long expiry;
        try {
            expiry = Long.parseLong(parts[3]);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
        if (System.currentTimeMillis() > expiry) {
            return Optional.empty();
        }
        return Optional.of(new TokenInfo(parts[0], parts[1], parts[2]));
    }

    private byte[] sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC indisponible", e);
        }
    }

    private static boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a.length != b.length) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < a.length; i++) {
            diff |= a[i] ^ b[i];
        }
        return diff == 0;
    }

    private static String enc(String s) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(s.getBytes(StandardCharsets.UTF_8));
    }

    private static String enc(byte[] b) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static byte[] dec(String s) {
        return Base64.getUrlDecoder().decode(s);
    }
}
