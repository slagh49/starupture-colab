package com.starrupture.scanner.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DroneLinkDto {

    private String id;
    private String fromEntityId;
    private String toEntityId;
    private String item;
    private Integer droneCount;
    private String state;
}
