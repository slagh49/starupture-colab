package com.starrupture.scanner.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppConfigInput {

    private String ftpHost;
    private Integer ftpPort;
    private String ftpUser;
    // Optional: only updates the stored password when non-blank.
    private String ftpPassword;
    private String ftpPath;
    private String bridgeUrl;
    private Boolean autoImportEnabled;
    private Integer autoImportIntervalMinutes;
}
