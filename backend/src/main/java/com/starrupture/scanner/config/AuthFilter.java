package com.starrupture.scanner.config;

import com.starrupture.scanner.service.AuthService;
import com.starrupture.scanner.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Lightweight auth gate for the REST API:
 * <ul>
 *   <li>{@code /api/auth/login} and CORS preflight are public,</li>
 *   <li>every other {@code /api/**} call requires a valid bearer token,</li>
 *   <li>{@code /api/admin/**} additionally requires the ADMIN role.</li>
 * </ul>
 * Runs after the CORS filter (lower precedence) and skips OPTIONS so preflight passes.
 */
@Component
@Order(20)
@RequiredArgsConstructor
public class AuthFilter extends OncePerRequestFilter {

    private final TokenService tokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        if (!path.startsWith("/api/")
                || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.equals("/api/auth/login")) {
            chain.doFilter(request, response);
            return;
        }

        Optional<TokenService.TokenInfo> info = tokenService.validate(bearer(request));
        if (info.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Authentification requise\"}");
            return;
        }

        TokenService.TokenInfo user = info.get();
        if (path.startsWith("/api/admin/") && !AuthService.ROLE_ADMIN.equals(user.role())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Accès administrateur requis\"}");
            return;
        }

        request.setAttribute("userId", user.userId());
        request.setAttribute("username", user.username());
        request.setAttribute("role", user.role());
        chain.doFilter(request, response);
    }

    private static String bearer(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
