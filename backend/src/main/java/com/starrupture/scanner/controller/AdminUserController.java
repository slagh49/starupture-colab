package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.AuthDtos.*;
import com.starrupture.scanner.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Admin-only user management (the ADMIN role is enforced by AuthFilter on /api/admin/**). */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AuthService authService;

    @GetMapping
    public List<UserDto> list() {
        return authService.listUsers();
    }

    @PostMapping
    public ResponseEntity<Object> create(@RequestBody CreateUserRequest req) {
        try {
            return ResponseEntity.ok(authService.createUser(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Object> setPassword(@PathVariable UUID id, @RequestBody SetPasswordRequest req) {
        try {
            authService.setPassword(id, req.password());
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable UUID id) {
        try {
            authService.deleteUser(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}
