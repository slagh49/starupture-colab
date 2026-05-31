package com.starrupture.scanner.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameEntityItemDto {

    private String side;
    private String item;
    private Integer count;
}
