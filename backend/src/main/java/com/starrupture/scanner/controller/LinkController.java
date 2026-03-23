package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.BaseZoneDto;
import com.starrupture.scanner.dto.DroneLinkDto;
import com.starrupture.scanner.dto.RailSplineDto;
import com.starrupture.scanner.service.EntityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/saves/{sessionId}")
@RequiredArgsConstructor
public class LinkController {

    private final EntityService entityService;

    @GetMapping("/links")
    public ResponseEntity<List<DroneLinkDto>> getDroneLinks(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(entityService.getDroneLinks(sessionId));
    }

    @GetMapping("/splines")
    public ResponseEntity<List<RailSplineDto>> getRailSplines(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(entityService.getRailSplines(sessionId));
    }

    @GetMapping("/zones")
    public ResponseEntity<List<BaseZoneDto>> getBaseZones(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(entityService.getBaseZones(sessionId));
    }
}
