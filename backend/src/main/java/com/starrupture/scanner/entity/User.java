package com.starrupture.scanner.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /** "ADMIN" or "USER". */
    @Column(nullable = false)
    private String role;

    /** UI language preference (ISO code: en, fr, de, es, pl). Defaults to English. */
    @Column(nullable = false)
    private String language;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
