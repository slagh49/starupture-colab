package com.starrupture.scanner.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaseZoneDto {

    private String id;
    private Double minX;
    private Double minY;
    private Double maxX;
    private Double maxY;
}
