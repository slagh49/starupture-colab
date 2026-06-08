package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.MarkerDtos.*;
import com.starrupture.scanner.entity.MapMarker;
import com.starrupture.scanner.repository.MapMarkerRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/markers")
@RequiredArgsConstructor
public class MarkerController {

    private final MapMarkerRepository repository;

    @GetMapping
    public List<MarkerDto> list() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @PostMapping
    public ResponseEntity<MarkerDto> create(@RequestBody MarkerInput input, HttpServletRequest request) {
        if (input.label() == null || input.label().isBlank()) {
            throw new IllegalArgumentException("Le libellé du marqueur est requis");
        }
        MapMarker m = repository.save(MapMarker.builder()
                .x(input.x())
                .y(input.y())
                .label(input.label().trim())
                .color(input.color() != null && !input.color().isBlank() ? input.color().trim() : "#00d4ff")
                .createdBy(String.valueOf(request.getAttribute("username")))
                .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(m));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        MapMarker m = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Marqueur introuvable : " + id));
        repository.delete(m);
        return ResponseEntity.noContent().build();
    }

    private MarkerDto toDto(MapMarker m) {
        return new MarkerDto(
                m.getId().toString(),
                m.getX(),
                m.getY(),
                m.getLabel(),
                m.getColor(),
                m.getCreatedBy(),
                m.getCreatedAt());
    }
}
