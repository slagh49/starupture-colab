package com.starrupture.scanner.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "save_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String filename;

    @Column(name = "session_name")
    private String sessionName;

    private Double playtime;

    private String timestamp;

    @Column(name = "upload_at")
    private LocalDateTime uploadAt;

    @Column(name = "world_time")
    private Double worldTime;

    @Column(columnDefinition = "text")
    private String progression;

    /**
     * Vrai lorsque le save importé est identique au précédent (même timestamp
     * interne et même playtime) : le jeu n'a écrit aucune nouvelle sauvegarde.
     * Calculé à l'import, non persisté — sert uniquement à alerter l'utilisateur.
     */
    @Transient
    private boolean sameAsPrevious;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GameEntity> entities = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DroneLink> droneLinks = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RailSpline> railSplines = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BaseZone> baseZones = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (uploadAt == null) {
            uploadAt = LocalDateTime.now();
        }
    }
}
