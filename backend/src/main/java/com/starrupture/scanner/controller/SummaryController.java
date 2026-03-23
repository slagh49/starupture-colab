package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.SummaryDto;
import com.starrupture.scanner.service.EntityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/saves/{sessionId}/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final EntityService entityService;

    @GetMapping
    public ResponseEntity<SummaryDto> getSummary(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(entityService.getSummary(sessionId));
    }
}
