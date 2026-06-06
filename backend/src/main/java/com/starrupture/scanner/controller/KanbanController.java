package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.KanbanDtos.*;
import com.starrupture.scanner.service.KanbanService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Tableau kanban partagé (onglet TODO). Accessible à tout utilisateur
 * authentifié (pas sous /api/admin, donc pas de rôle ADMIN requis).
 */
@RestController
@RequestMapping("/api/kanban")
@RequiredArgsConstructor
public class KanbanController {

    private final KanbanService kanbanService;

    @GetMapping("/board")
    public BoardDto getBoard() {
        return kanbanService.getBoard();
    }

    @GetMapping("/users")
    public List<UserRef> listUsers() {
        return kanbanService.listUsers();
    }

    // ---- Colonnes ----

    @PostMapping("/columns")
    public ResponseEntity<ColumnDto> createColumn(@RequestBody ColumnInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kanbanService.createColumn(input));
    }

    @PutMapping("/columns/{id}")
    public ColumnDto renameColumn(@PathVariable UUID id, @RequestBody ColumnInput input) {
        return kanbanService.renameColumn(id, input);
    }

    @PutMapping("/columns/{id}/move")
    public ColumnDto moveColumn(@PathVariable UUID id, @RequestBody PositionInput input) {
        return kanbanService.moveColumn(id, input.position());
    }

    @DeleteMapping("/columns/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable UUID id) {
        kanbanService.deleteColumn(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Tâches ----

    @PostMapping("/tasks")
    public ResponseEntity<TaskDto> createTask(@RequestBody TaskInput input, HttpServletRequest request) {
        String username = String.valueOf(request.getAttribute("username"));
        return ResponseEntity.status(HttpStatus.CREATED).body(kanbanService.createTask(input, username));
    }

    @PutMapping("/tasks/{id}")
    public TaskDto updateTask(@PathVariable UUID id, @RequestBody TaskUpdateInput input) {
        return kanbanService.updateTask(id, input);
    }

    @PutMapping("/tasks/{id}/move")
    public TaskDto moveTask(@PathVariable UUID id, @RequestBody MoveInput input) {
        return kanbanService.moveTask(id, input);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        kanbanService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
