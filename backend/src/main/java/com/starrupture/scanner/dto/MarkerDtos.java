package com.starrupture.scanner.dto;

import java.time.LocalDateTime;

public final class MarkerDtos {

    private MarkerDtos() {}

    public record MarkerDto(
            String id,
            double x,
            double y,
            String label,
            String color,
            String createdBy,
            LocalDateTime createdAt) {}

    public record MarkerInput(
            double x,
            double y,
            String label,
            String color) {}
}
