package com.starrupture.scanner.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter JPA chiffrant une colonne texte au repos (AES-GCM via
 * {@link CryptoSupport}). Une valeur héritée en clair est lue telle quelle puis
 * ré-chiffrée au prochain enregistrement — aucune migration de données requise.
 */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        if (attribute.startsWith(CryptoSupport.PREFIX)) {
            return attribute; // déjà chiffré
        }
        return CryptoSupport.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }
        if (dbData.startsWith(CryptoSupport.PREFIX)) {
            return CryptoSupport.decrypt(dbData);
        }
        return dbData; // héritage en clair
    }
}
