-- Configuration applicative (import FTP automatique du .sav)
CREATE TABLE app_config (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ftp_host                     VARCHAR(255),
    ftp_port                     INTEGER DEFAULT 21,
    ftp_user                     VARCHAR(255),
    ftp_password                 VARCHAR(255),
    ftp_path                     VARCHAR(512),
    auto_import_enabled          BOOLEAN DEFAULT FALSE,
    auto_import_interval_minutes INTEGER DEFAULT 30,
    last_import_at               TIMESTAMP
);
