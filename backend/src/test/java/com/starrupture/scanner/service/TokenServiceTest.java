package com.starrupture.scanner.service;

import com.starrupture.scanner.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class TokenServiceTest {

    private User sampleUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .username("alice")
                .role("ADMIN")
                .build();
    }

    @Test
    @DisplayName("refuse de démarrer si le secret est vide")
    void shouldFailFastOnBlankSecret() {
        assertThatThrownBy(() -> new TokenService("", 168))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_AUTH_SECRET");
    }

    @Test
    @DisplayName("refuse de démarrer si le secret est null")
    void shouldFailFastOnNullSecret() {
        assertThatThrownBy(() -> new TokenService(null, 168))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("émet puis valide un jeton avec un secret correct")
    void shouldIssueAndValidateToken() {
        TokenService service = new TokenService("un-secret-hmac-suffisamment-long", 168);
        User user = sampleUser();

        String token = service.issue(user);
        Optional<TokenService.TokenInfo> info = service.validate(token);

        assertThat(info).isPresent();
        assertThat(info.get().username()).isEqualTo("alice");
        assertThat(info.get().role()).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("rejette un jeton signé avec un autre secret")
    void shouldRejectTokenSignedWithDifferentSecret() {
        String token = new TokenService("secret-A-original", 168).issue(sampleUser());

        Optional<TokenService.TokenInfo> info =
                new TokenService("secret-B-different", 168).validate(token);

        assertThat(info).isEmpty();
    }
}
