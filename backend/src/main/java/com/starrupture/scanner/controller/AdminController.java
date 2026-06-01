package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.AppConfigDto;
import com.starrupture.scanner.dto.AppConfigInput;
import com.starrupture.scanner.entity.SaveSession;
import com.starrupture.scanner.service.AdminService;
import com.starrupture.scanner.service.EntityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final EntityService entityService;

    @GetMapping("/config")
    public AppConfigDto getConfig() {
        return adminService.toDto(adminService.getOrCreateConfig());
    }

    @PutMapping("/config")
    public AppConfigDto saveConfig(@RequestBody AppConfigInput input) {
        return adminService.toDto(adminService.saveConfig(input));
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        String err = adminService.testConnection();
        return ResponseEntity.ok(Map.of("ok", err == null, "message", err != null ? err : "Connexion OK"));
    }

    @PostMapping("/import")
    public ResponseEntity<Object> importNow() {
        try {
            SaveSession session = adminService.importNow();
            return ResponseEntity.ok(entityService.toSessionDto(session, 0));
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Échec de l'import FTP";
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", msg));
        }
    }
}
