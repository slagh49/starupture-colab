package com.starrupture.scanner.service;

import com.starrupture.scanner.dto.AuthDtos.*;
import com.starrupture.scanner.entity.User;
import com.starrupture.scanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_USER = "USER";

    /** Supported UI languages (ISO codes). */
    public static final java.util.Set<String> SUPPORTED_LANGUAGES =
            java.util.Set.of("en", "fr", "de", "es", "pl");
    public static final String DEFAULT_LANGUAGE = "en";

    private final UserRepository userRepository;
    private final TokenService tokenService;

    @Value("${app.auth.default-admin-user:admin}")
    private String defaultAdminUser;

    @Value("${app.auth.default-admin-password:admin}")
    private String defaultAdminPassword;

    /** Seed a default admin on first start (when no users exist yet). */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultAdmin() {
        if (userRepository.count() > 0) {
            return;
        }
        userRepository.save(User.builder()
                .username(defaultAdminUser)
                .passwordHash(PasswordUtil.hash(defaultAdminPassword))
                .role(ROLE_ADMIN)
                .language(DEFAULT_LANGUAGE)
                .createdAt(LocalDateTime.now())
                .build());
        log.warn("Admin par défaut créé : '{}' — CHANGEZ LE MOT DE PASSE via l'interface admin.", defaultAdminUser);
    }

    /** Returns a login response on success, empty on bad credentials. */
    public Optional<LoginResponse> login(String username, String password) {
        Optional<User> found = userRepository.findByUsername(username == null ? "" : username.trim());
        if (found.isEmpty() || !PasswordUtil.verify(password == null ? "" : password, found.get().getPasswordHash())) {
            return Optional.empty();
        }
        User user = found.get();
        return Optional.of(new LoginResponse(
                tokenService.issue(user), user.getUsername(), user.getRole(), languageOf(user)));
    }

    /** Current user's language preference (defaults to English if unset/unknown). */
    public String getLanguage(String username) {
        return userRepository.findByUsername(username == null ? "" : username.trim())
                .map(AuthService::languageOf)
                .orElse(DEFAULT_LANGUAGE);
    }

    /** Update the current user's language preference. */
    @Transactional
    public void setLanguage(String username, String language) {
        if (language == null || !SUPPORTED_LANGUAGES.contains(language)) {
            throw new IllegalArgumentException("Langue non supportée");
        }
        User user = userRepository.findByUsername(username == null ? "" : username.trim())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        user.setLanguage(language);
        userRepository.save(user);
    }

    private static String languageOf(User user) {
        String lang = user.getLanguage();
        return (lang != null && SUPPORTED_LANGUAGES.contains(lang)) ? lang : DEFAULT_LANGUAGE;
    }

    public List<UserDto> listUsers() {
        return userRepository.findAllByOrderByUsernameAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public UserDto createUser(CreateUserRequest req) {
        String username = req.username() == null ? "" : req.username().trim();
        if (username.isEmpty()) {
            throw new IllegalArgumentException("Nom d'utilisateur requis");
        }
        if (req.password() == null || req.password().isBlank()) {
            throw new IllegalArgumentException("Mot de passe requis");
        }
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Cet utilisateur existe déjà");
        }
        String role = ROLE_ADMIN.equals(req.role()) ? ROLE_ADMIN : ROLE_USER;
        User user = userRepository.save(User.builder()
                .username(username)
                .passwordHash(PasswordUtil.hash(req.password()))
                .role(role)
                .language(DEFAULT_LANGUAGE)
                .createdAt(LocalDateTime.now())
                .build());
        return toDto(user);
    }

    @Transactional
    public void setPassword(UUID id, String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Mot de passe requis");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        user.setPasswordHash(PasswordUtil.hash(password));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        if (ROLE_ADMIN.equals(user.getRole()) && userRepository.countByRole(ROLE_ADMIN) <= 1) {
            throw new IllegalArgumentException("Impossible de supprimer le dernier administrateur");
        }
        userRepository.deleteById(id);
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId().toString(), u.getUsername(), u.getRole(),
                u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
    }
}
