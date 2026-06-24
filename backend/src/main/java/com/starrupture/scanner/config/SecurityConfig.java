package com.starrupture.scanner.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    /**
     * CORS verrouillé par allowlist. Les origines autorisées sont fournies via
     * {@code APP_CORS_ALLOWED_ORIGINS} (liste séparée par des virgules). Par
     * défaut <b>aucune origine croisée n'est autorisée</b> : en production le
     * frontend est servi par Nginx sur la même origine que l'API (les requêtes
     * ne sont donc pas cross-origin et n'ont pas besoin de CORS). Renseignez la
     * variable uniquement si vous appelez l'API depuis un autre domaine.
     *
     * <p>S'exécute avant l'AuthFilter pour que les en-têtes CORS soient présents
     * même sur les réponses 401/403.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter(@Value("${app.cors.allowed-origins:}") String originsCsv) {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(originsCsv.split(","))
                .map(String::strip)
                .filter(s -> !s.isEmpty())
                .toList();

        if (!origins.isEmpty()) {
            // Origines explicites uniquement (jamais "*"), credentials autorisés.
            config.setAllowedOrigins(origins);
            config.setAllowCredentials(true);
        }
        // Sinon : aucune origine autorisée — le same-origin fonctionne sans CORS.

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Range"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
