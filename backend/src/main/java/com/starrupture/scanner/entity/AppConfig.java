package com.starrupture.scanner.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "app_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ftp_host")
    private String ftpHost;

    @Column(name = "ftp_port")
    @Builder.Default
    private Integer ftpPort = 21;

    @Column(name = "ftp_user")
    private String ftpUser;

    @Column(name = "ftp_password")
    @Convert(converter = com.starrupture.scanner.security.EncryptedStringConverter.class)
    private String ftpPassword;

    @Column(name = "ftp_path")
    private String ftpPath;

    // HTTP Web-FTP bridge URL (Monsta FTP handler). When set, the import
    // downloads over HTTP via the host instead of a direct passive FTP transfer.
    @Column(name = "bridge_url")
    @Builder.Default
    private String bridgeUrl = "https://ftp.4np.4players.de/bridges/php/handler.php";

    @Column(name = "auto_import_enabled")
    @Builder.Default
    private Boolean autoImportEnabled = false;

    @Column(name = "auto_import_interval_minutes")
    @Builder.Default
    private Integer autoImportIntervalMinutes = 30;

    @Column(name = "last_import_at")
    private LocalDateTime lastImportAt;

    // SHA-256 of the last imported .sav + the session it produced, to skip
    // re-importing an unchanged file (differential import).
    @Column(name = "last_import_hash")
    private String lastImportHash;

    @Column(name = "last_import_session_id")
    private UUID lastImportSessionId;

    /** Snapshot JSON de l'état avant le dernier import (pour calculer le diff). */
    @Column(name = "last_import_snapshot", columnDefinition = "text")
    private String lastImportSnapshot;
}
