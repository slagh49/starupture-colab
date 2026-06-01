package com.starrupture.scanner.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppConfigDto {

    private String ftpHost;
    private Integer ftpPort;
    private String ftpUser;
    // Whether a password is stored (the password itself is never returned).
    private Boolean hasPassword;
    private String ftpPath;
    private Boolean autoImportEnabled;
    private Integer autoImportIntervalMinutes;
    private LocalDateTime lastImportAt;
}
