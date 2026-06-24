package com.starrupture.scanner.security;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Chiffrement AES-256-GCM des secrets stockés en base (ex. mot de passe FTP).
 *
 * <p>La clé est <b>dérivée de {@code APP_AUTH_SECRET}</b> (déjà obligatoire au
 * démarrage) via SHA-256 avec une étiquette de séparation de domaine, afin de ne
 * pas réutiliser tel quel le secret de signature des jetons. Le résultat est
 * préfixé par {@link #PREFIX} pour distinguer une valeur chiffrée d'un éventuel
 * héritage en clair (migration transparente : le clair est ré-chiffré au prochain
 * enregistrement).
 */
public final class CryptoSupport {

    private CryptoSupport() {}

    public static final String PREFIX = "enc:v1:";
    private static final int IV_LEN = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RNG = new SecureRandom();
    private static volatile SecretKeySpec KEY;

    private static SecretKeySpec key() {
        SecretKeySpec k = KEY;
        if (k == null) {
            synchronized (CryptoSupport.class) {
                k = KEY;
                if (k == null) {
                    String secret = System.getenv("APP_AUTH_SECRET");
                    if (secret == null || secret.isBlank()) {
                        secret = System.getProperty("APP_AUTH_SECRET", "");
                    }
                    if (secret == null || secret.isBlank()) {
                        throw new IllegalStateException(
                                "APP_AUTH_SECRET requis pour chiffrer les secrets en base");
                    }
                    try {
                        byte[] digest = MessageDigest.getInstance("SHA-256")
                                .digest(("config-encryption:" + secret).getBytes(StandardCharsets.UTF_8));
                        k = new SecretKeySpec(digest, "AES");
                        KEY = k;
                    } catch (Exception e) {
                        throw new IllegalStateException("Dérivation de clé impossible", e);
                    }
                }
            }
        }
        return k;
    }

    public static String encrypt(String plain) {
        try {
            byte[] iv = new byte[IV_LEN];
            RNG.nextBytes(iv);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            return PREFIX + Base64.getEncoder().encodeToString(out);
        } catch (Exception e) {
            throw new IllegalStateException("Chiffrement impossible", e);
        }
    }

    public static String decrypt(String stored) {
        try {
            byte[] all = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            byte[] iv = Arrays.copyOfRange(all, 0, IV_LEN);
            byte[] ct = Arrays.copyOfRange(all, IV_LEN, all.length);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            return new String(c.doFinal(ct), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Déchiffrement impossible", e);
        }
    }
}
