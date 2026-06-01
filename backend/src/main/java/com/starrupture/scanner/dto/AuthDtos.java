package com.starrupture.scanner.dto;

/** Request/response records for authentication and user management. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(String username, String password) {
    }

    public record LoginResponse(String token, String username, String role) {
    }

    public record UserDto(String id, String username, String role, String createdAt) {
    }

    public record CreateUserRequest(String username, String password, String role) {
    }

    public record SetPasswordRequest(String password) {
    }
}
