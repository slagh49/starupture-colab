package com.starrupture.scanner.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** DTOs du tableau kanban (onglet TODO). */
public final class KanbanDtos {

    private KanbanDtos() {}

    /** Board complet : colonnes ordonnées, chacune avec ses tâches ordonnées. */
    public record BoardDto(List<ColumnDto> columns) {}

    public record ColumnDto(
            String id,
            String title,
            int position,
            List<TaskDto> tasks) {}

    public record TaskDto(
            String id,
            String columnId,
            String title,
            String description,
            String priority,
            String assignee,
            LocalDate dueDate,
            int position,
            String createdBy,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {}

    public record UserRef(String username) {}

    // ---- Entrées (corps de requête) ----

    public record ColumnInput(String title) {}

    public record TaskInput(
            String columnId,
            String title,
            String description,
            String priority,
            String assignee,
            LocalDate dueDate) {}

    public record TaskUpdateInput(
            String title,
            String description,
            String priority,
            String assignee,
            LocalDate dueDate) {}

    /** Déplacement d'une tâche (glisser-déposer) : colonne cible + index cible. */
    public record MoveInput(String columnId, int position) {}

    /** Déplacement d'une colonne (glisser-déposer) : index cible. */
    public record PositionInput(int position) {}
}
