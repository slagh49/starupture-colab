package com.starrupture.scanner.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SummaryDto {

    private String sessionId;
    private String sessionName;
    private int totalEntities;
    private Map<String, Long> countByCategory;
    private int totalDroneLinks;
    private int totalRailSplines;
    private int totalBaseZones;
    private Double playtime;
    private Double worldTime;
}
