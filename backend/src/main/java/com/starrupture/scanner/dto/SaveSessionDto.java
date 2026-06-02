package com.starrupture.scanner.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveSessionDto {

    private String id;
    private String filename;
    private String sessionName;
    private Double playtime;
    private String timestamp;
    private LocalDateTime uploadAt;
    private Double worldTime;
    private int entityCount;
    /** Vrai si ce save est identique au précédent import (jeu non sauvegardé depuis). */
    private boolean sameAsPrevious;
}
