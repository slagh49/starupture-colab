package com.starrupture.scanner.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "game_entities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private SaveSession session;

    @Column(name = "game_id")
    private String gameId;

    private String name;

    private String category;

    @Column(nullable = false)
    private Double x;

    @Column(nullable = false)
    private Double y;

    @Column(nullable = false)
    private Double z;

    private String recipe;

    @Builder.Default
    private Double infection = 0.0;

    @Builder.Default
    private Boolean foundable = false;

    @Builder.Default
    private String status = "on";

    @Column(name = "raw_path")
    private String rawPath;
}
