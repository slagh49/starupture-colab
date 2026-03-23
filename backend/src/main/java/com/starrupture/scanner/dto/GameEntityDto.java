package com.starrupture.scanner.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameEntityDto {

    private String id;
    private String gameId;
    private String name;
    private String category;
    private Double x;
    private Double y;
    private Double z;
    private String recipe;
    private Double infection;
    private Boolean foundable;
    private String status;
}
