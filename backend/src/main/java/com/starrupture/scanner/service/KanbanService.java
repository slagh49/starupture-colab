package com.starrupture.scanner.service;

import com.starrupture.scanner.dto.KanbanDtos.*;
import com.starrupture.scanner.entity.KanbanColumn;
import com.starrupture.scanner.entity.KanbanTask;
import com.starrupture.scanner.repository.KanbanColumnRepository;
import com.starrupture.scanner.repository.KanbanTaskRepository;
import com.starrupture.scanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KanbanService {

    private static final Set<String> PRIORITIES = Set.of("LOW", "NORMAL", "HIGH");

    private final KanbanColumnRepository columnRepository;
    private final KanbanTaskRepository taskRepository;
    private final UserRepository userRepository;

    // ---- Board ----

    @Transactional(readOnly = true)
    public BoardDto getBoard() {
        List<ColumnDto> columns = columnRepository.findAllByOrderByPositionAsc().stream()
                .map(col -> new ColumnDto(
                        col.getId().toString(),
                        col.getTitle(),
                        col.getPosition(),
                        taskRepository.findByColumnIdOrderByPositionAsc(col.getId()).stream()
                                .map(this::toTaskDto)
                                .toList()))
                .toList();
        return new BoardDto(columns);
    }

    @Transactional(readOnly = true)
    public List<UserRef> listUsers() {
        return userRepository.findAllByOrderByUsernameAsc().stream()
                .map(u -> new UserRef(u.getUsername()))
                .toList();
    }

    // ---- Colonnes ----

    @Transactional
    public ColumnDto createColumn(ColumnInput input) {
        String title = requireText(input.title(), "Le titre de la colonne est requis");
        int position = (int) columnRepository.count();
        KanbanColumn col = columnRepository.save(KanbanColumn.builder()
                .title(title)
                .position(position)
                .build());
        return new ColumnDto(col.getId().toString(), col.getTitle(), col.getPosition(), List.of());
    }

    @Transactional
    public ColumnDto renameColumn(UUID id, ColumnInput input) {
        KanbanColumn col = column(id);
        col.setTitle(requireText(input.title(), "Le titre de la colonne est requis"));
        columnRepository.save(col);
        return new ColumnDto(
                col.getId().toString(),
                col.getTitle(),
                col.getPosition(),
                taskRepository.findByColumnIdOrderByPositionAsc(col.getId()).stream()
                        .map(this::toTaskDto)
                        .toList());
    }

    /** Déplace une colonne à un index donné (glisser-déposer). */
    @Transactional
    public ColumnDto moveColumn(UUID id, int position) {
        KanbanColumn col = column(id);
        List<KanbanColumn> cols = columnRepository.findAllByOrderByPositionAsc();
        cols.removeIf(c -> c.getId().equals(id));
        int index = Math.max(0, Math.min(position, cols.size()));
        cols.add(index, col);
        for (int i = 0; i < cols.size(); i++) {
            cols.get(i).setPosition(i);
        }
        columnRepository.saveAll(cols);
        return new ColumnDto(
                col.getId().toString(),
                col.getTitle(),
                col.getPosition(),
                taskRepository.findByColumnIdOrderByPositionAsc(col.getId()).stream()
                        .map(this::toTaskDto)
                        .toList());
    }

    @Transactional
    public void deleteColumn(UUID id) {
        KanbanColumn col = column(id);
        columnRepository.delete(col); // cascade DB supprime les tâches
        // Renumérote les colonnes restantes pour garder des positions contiguës.
        List<KanbanColumn> remaining = columnRepository.findAllByOrderByPositionAsc();
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setPosition(i);
        }
        columnRepository.saveAll(remaining);
    }

    // ---- Tâches ----

    @Transactional
    public TaskDto createTask(TaskInput input, String createdBy) {
        UUID columnId = parseId(input.columnId(), "colonne");
        column(columnId); // valide l'existence
        String title = requireText(input.title(), "Le titre de la tâche est requis");
        int position = (int) taskRepository.countByColumnId(columnId);
        KanbanTask task = taskRepository.save(KanbanTask.builder()
                .columnId(columnId)
                .title(title)
                .description(blankToNull(input.description()))
                .priority(normalizePriority(input.priority()))
                .assignee(blankToNull(input.assignee()))
                .dueDate(input.dueDate())
                .position(position)
                .createdBy(createdBy)
                .build());
        return toTaskDto(task);
    }

    @Transactional
    public TaskDto updateTask(UUID id, TaskUpdateInput input) {
        KanbanTask task = task(id);
        task.setTitle(requireText(input.title(), "Le titre de la tâche est requis"));
        task.setDescription(blankToNull(input.description()));
        task.setPriority(normalizePriority(input.priority()));
        task.setAssignee(blankToNull(input.assignee()));
        task.setDueDate(input.dueDate());
        task.setUpdatedAt(LocalDateTime.now());
        return toTaskDto(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UUID id) {
        KanbanTask task = task(id);
        UUID columnId = task.getColumnId();
        taskRepository.delete(task);
        renumber(columnId);
    }

    /** Déplace une tâche vers une colonne cible à un index donné (glisser-déposer). */
    @Transactional
    public TaskDto moveTask(UUID id, MoveInput input) {
        KanbanTask task = task(id);
        UUID targetColumn = parseId(input.columnId(), "colonne");
        column(targetColumn); // valide l'existence
        UUID sourceColumn = task.getColumnId();

        task.setColumnId(targetColumn);
        taskRepository.save(task);

        // Réordonne la colonne cible en insérant la tâche à l'index demandé.
        List<KanbanTask> target = taskRepository.findByColumnIdOrderByPositionAsc(targetColumn);
        target.removeIf(t -> t.getId().equals(id));
        int index = Math.max(0, Math.min(input.position(), target.size()));
        target.add(index, task);
        for (int i = 0; i < target.size(); i++) {
            target.get(i).setPosition(i);
        }
        taskRepository.saveAll(target);

        if (!sourceColumn.equals(targetColumn)) {
            renumber(sourceColumn);
        }
        return toTaskDto(task);
    }

    // ---- Helpers ----

    private void renumber(UUID columnId) {
        List<KanbanTask> tasks = taskRepository.findByColumnIdOrderByPositionAsc(columnId);
        for (int i = 0; i < tasks.size(); i++) {
            tasks.get(i).setPosition(i);
        }
        taskRepository.saveAll(tasks);
    }

    private KanbanColumn column(UUID id) {
        return columnRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Colonne introuvable : " + id));
    }

    private KanbanTask task(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tâche introuvable : " + id));
    }

    private TaskDto toTaskDto(KanbanTask t) {
        return new TaskDto(
                t.getId().toString(),
                t.getColumnId().toString(),
                t.getTitle(),
                t.getDescription(),
                t.getPriority(),
                t.getAssignee(),
                t.getDueDate(),
                t.getPosition(),
                t.getCreatedBy(),
                t.getCreatedAt(),
                t.getUpdatedAt());
    }

    private static String normalizePriority(String raw) {
        if (raw == null || raw.isBlank()) return "NORMAL";
        String p = raw.trim().toUpperCase();
        if (!PRIORITIES.contains(p)) {
            throw new IllegalArgumentException("Priorité invalide : " + raw);
        }
        return p;
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private static UUID parseId(String value, String label) {
        try {
            return UUID.fromString(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("Identifiant de " + label + " invalide : " + value);
        }
    }
}
