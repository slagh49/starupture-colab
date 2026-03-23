package com.starrupture.scanner.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RailSplineDto {

    private String id;
    private String splineType;
    private String points;
}
