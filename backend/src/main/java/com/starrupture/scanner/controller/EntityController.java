package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.GameEntityDto;
import com.starrupture.scanner.service.EntityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/saves/{sessionId}/entities")
@RequiredArgsConstructor
public class EntityController {

    private final EntityService entityService;

    @GetMapping
    public ResponseEntity<List<GameEntityDto>> getEntities(
            @PathVariable UUID sessionId,
            @RequestParam(name = "cat", required = false) String category) {
        List<GameEntityDto> entities = entityService.getEntities(sessionId, category);
        return ResponseEntity.ok(entities);
    }
}
