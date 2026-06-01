package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.SaveSessionDto;
import com.starrupture.scanner.entity.SaveSession;
import com.starrupture.scanner.service.EntityService;
import com.starrupture.scanner.service.SaveParserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/saves")
@RequiredArgsConstructor
@Slf4j
public class SaveController {

    private final SaveParserService saveParserService;
    private final EntityService entityService;

    @PostMapping
    public ResponseEntity<SaveSessionDto> uploadSave(@RequestParam("file") MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null ||
                (!filename.toLowerCase().endsWith(".sav") && !filename.toLowerCase().endsWith(".json"))) {
            return ResponseEntity.badRequest().build();
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        SaveSession session = saveParserService.parseSavFile(file);
        SaveSessionDto dto = entityService.toSessionDto(session, 0);

        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    public ResponseEntity<List<SaveSessionDto>> listSaves() {
        List<SaveSessionDto> sessions = entityService.getAllSessions();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping(value = "/{id}/progression", produces = "application/json")
    public ResponseEntity<String> getProgression(@PathVariable UUID id) {
        String progression = entityService.getProgression(id);
        return ResponseEntity.ok(progression != null ? progression : "{}");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSave(@PathVariable UUID id) {
        entityService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
}
