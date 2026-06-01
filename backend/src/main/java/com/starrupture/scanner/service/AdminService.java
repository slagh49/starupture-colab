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
    private final SaveParserService saveParserService;

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
        c.setAutoImportEnabled(Boolean.TRUE.equals(in.getAutoImportEnabled()));
        c.setAutoImportIntervalMinutes(
                in.getAutoImportIntervalMinutes() != null ? in.getAutoImportIntervalMinutes() : 30);
        if (in.getFtpPassword() != null && !in.getFtpPassword().isBlank()) {
            c.setFtpPassword(in.getFtpPassword());
        }
        return configRepository.save(c);
    }

    public boolean testConnection() {
        AppConfig c = getOrCreateConfig();
        if (c.getFtpHost() == null || c.getFtpHost().isBlank()) {
            return false;
        }
        return ftpService.test(c.getFtpHost(), c.getFtpPort() != null ? c.getFtpPort() : 21,
                c.getFtpUser(), c.getFtpPassword());
    }

    @Transactional
    public SaveSession importNow() throws IOException {
        AppConfig c = getOrCreateConfig();
        if (c.getFtpHost() == null || c.getFtpHost().isBlank()
                || c.getFtpPath() == null || c.getFtpPath().isBlank()) {
            throw new IOException("FTP non configuré (hôte/chemin manquant)");
        }
        byte[] bytes = ftpService.download(c.getFtpHost(), c.getFtpPort() != null ? c.getFtpPort() : 21,
                c.getFtpUser(), c.getFtpPassword(), c.getFtpPath());
        String name = c.getFtpPath().substring(c.getFtpPath().lastIndexOf('/') + 1);
        SaveSession session = saveParserService.parseSavBytes(bytes, name.isEmpty() ? "ftp.sav" : name);
        c.setLastImportAt(LocalDateTime.now());
        configRepository.save(c);
        log.info("Auto-import FTP réussi : session {}", session.getId());
        return session;
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
