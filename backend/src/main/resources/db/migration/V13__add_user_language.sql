-- Préférence de langue par utilisateur (i18n). Défaut : anglais.
ALTER TABLE app_user ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'en';
