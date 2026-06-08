package com.starrupture.scanner.service;

import com.starrupture.scanner.dto.AppConfigDto;
import com.starrupture.scanner.dto.AppConfigInput;
import com.starrupture.scanner.entity.AppConfig;
import com.starrupture.scanner.entity.SaveSession;
import com.starrupture.scanner.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final AppConfigRepository configRepository;
    private final FtpService ftpService;
    private final HttpBridgeService httpBridgeService;
    private final SaveParserService saveParserService;

    /** Result of an import: the session and whether the file was unchanged (deduped). */
    public record ImportResult(SaveSession session, boolean unchanged) { }

    @Transactional
    public AppConfig getOrCreateConfig() {
        return configRepository.findAll().stream().findFirst()
                .orElseGet(() -> configRepository.save(AppConfig.builder().build()));
    }

    public AppConfigDto toDto(AppConfig c) {
        return AppConfigDto.builder()
                .ftpHost(c.getFtpHost())
                .ftpPort(c.getFtpPort())
                .ftpUser(c.getFtpUser())
                .hasPassword(c.getFtpPassword() != null && !c.getFtpPassword().isEmpty())
                .ftpPath(c.getFtpPath())
                .bridgeUrl(c.getBridgeUrl())
                .autoImportEnabled(c.getAutoImportEnabled())
                .autoImportIntervalMinutes(c.getAutoImportIntervalMinutes())
                .lastImportAt(c.getLastImportAt())
                .build();
    }

    @Transactional
    public AppConfig saveConfig(AppConfigInput in) {
        AppConfig c = getOrCreateConfig();
        c.setFtpHost(in.getFtpHost());
        c.setFtpPort(in.getFtpPort() != null ? in.getFtpPort() : 21);
        c.setFtpUser(in.getFtpUser());
        c.setFtpPath(in.getFtpPath());
        if (in.getBridgeUrl() != null) {
            c.setBridgeUrl(in.getBridgeUrl().isBlank() ? null : in.getBridgeUrl().strip());
        }
        c.setAutoImportEnabled(Boolean.TRUE.equals(in.getAutoImportEnabled()));
        c.setAutoImportIntervalMinutes(
                in.getAutoImportIntervalMinutes() != null ? in.getAutoImportIntervalMinutes() : 30);
        if (in.getFtpPassword() != null && !in.getFtpPassword().isBlank()) {
            c.setFtpPassword(in.getFtpPassword());
        }
        return configRepository.save(c);
    }

    /** Returns null on success, otherwise the error message. */
    public String testConnection() {
        AppConfig c = getOrCreateConfig();
        if (useBridge(c)) {
            if (c.getFtpPath() == null || c.getFtpPath().isBlank()) {
                return "Chemin du fichier manquant (requis pour la passerelle)";
            }
            return httpBridgeService.test(c.getBridgeUrl(), c.getFtpHost(),
                    c.getFtpUser(), c.getFtpPassword(), c.getFtpPath());
        }
        if (c.getFtpHost() == null || c.getFtpHost().isBlank()) {
            return "Hôte FTP manquant";
        }
        return ftpService.test(c.getFtpHost(), c.getFtpPort() != null ? c.getFtpPort() : 21,
                c.getFtpUser(), c.getFtpPassword());
    }

    private boolean useBridge(AppConfig c) {
        return c.getBridgeUrl() != null && !c.getBridgeUrl().isBlank();
    }

    /**
     * Si ftpPath finit par '/' ou ne contient pas '.sav', on traite comme un
     * dossier : le code liste les .sav et prend le plus récent (résout la
     * rotation des slots AutoSave0/1/2 du serveur de jeu).
     */
    private static boolean isDirectory(String path) {
        return path.endsWith("/") || !path.toLowerCase().endsWith(".sav");
    }

    @Transactional
    public ImportResult importNow() throws IOException {
        AppConfig c = getOrCreateConfig();
        if (c.getFtpPath() == null || c.getFtpPath().isBlank()) {
            throw new IOException("Chemin du fichier manquant");
        }

        byte[] bytes;
        String name;

        if (isDirectory(c.getFtpPath())) {
            // Mode dossier : lister et prendre le .sav le plus récent
            if (useBridge(c)) {
                var result = httpBridgeService.downloadMostRecent(c.getBridgeUrl(), c.getFtpHost(),
                        c.getFtpUser(), c.getFtpPassword(), c.getFtpPath());
                bytes = result.bytes();
                name = result.filename();
            } else {
                if (c.getFtpHost() == null || c.getFtpHost().isBlank()) {
                    throw new IOException("FTP non configuré (hôte manquant)");
                }
                var result = ftpService.downloadMostRecent(c.getFtpHost(),
                        c.getFtpPort() != null ? c.getFtpPort() : 21,
                        c.getFtpUser(), c.getFtpPassword(), c.getFtpPath());
                bytes = result.bytes();
                name = result.filename();
            }
            log.info("Import dossier : slot le plus récent = {}", name);
        } else {
            // Mode fichier fixe (rétro-compatible)
            if (useBridge(c)) {
                bytes = httpBridgeService.download(c.getBridgeUrl(), c.getFtpHost(),
                        c.getFtpUser(), c.getFtpPassword(), c.getFtpPath());
            } else {
                if (c.getFtpHost() == null || c.getFtpHost().isBlank()) {
                    throw new IOException("FTP non configuré (hôte manquant)");
                }
                bytes = ftpService.download(c.getFtpHost(), c.getFtpPort() != null ? c.getFtpPort() : 21,
                        c.getFtpUser(), c.getFtpPassword(), c.getFtpPath());
            }
            name = c.getFtpPath().substring(c.getFtpPath().lastIndexOf('/') + 1);
            if (name.isEmpty()) name = "ftp.sav";
        }

        // Le wipe-and-replace (efface les sessions existantes) est fait dans
        // parseSavBytes, commun à l'upload manuel et à l'import FTP.
        SaveSession session = saveParserService.parseSavBytes(bytes, name);
        c.setLastImportAt(LocalDateTime.now());
        c.setLastImportHash(null);
        c.setLastImportSessionId(session.getId());
        configRepository.save(c);
        log.info("Import réussi (wipe + rechargement) : session {} / fichier {}", session.getId(), name);
        return new ImportResult(session, false);
    }

    /** Polls every minute and imports when the configured interval has elapsed. */
    @Scheduled(fixedDelay = 60_000L)
    public void scheduledImport() {
        AppConfig c = getOrCreateConfig();
        if (!Boolean.TRUE.equals(c.getAutoImportEnabled())) {
            return;
        }
        int interval = c.getAutoImportIntervalMinutes() != null ? c.getAutoImportIntervalMinutes() : 30;
        if (c.getLastImportAt() != null
                && c.getLastImportAt().plusMinutes(interval).isAfter(LocalDateTime.now())) {
            return;
        }
        try {
            importNow();
        } catch (Exception e) {
            log.warn("Auto-import FTP échoué : {}", e.getMessage());
        }
    }
}
