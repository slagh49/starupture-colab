package com.starrupture.scanner.controller;

import com.starrupture.scanner.dto.AuthDtos.*;
import com.starrupture.scanner.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody LoginRequest req) {
        Optional<LoginResponse> result = authService.login(req.username(), req.password());
        if (result.isPresent()) {
            return ResponseEntity.ok(result.get());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Identifiants invalides"));
    }

    /** Current user, derived from the validated token (attributes set by AuthFilter). */
    @GetMapping("/me")
    public Map<String, Object> me(HttpServletRequest request) {
        return Map.of(
                "username", String.valueOf(request.getAttribute("username")),
                "role", String.valueOf(request.getAttribute("role")));
    }
}
