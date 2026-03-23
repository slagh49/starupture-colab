package com.starrupture.scanner.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "drone_links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DroneLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private SaveSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_entity_id")
    private GameEntity fromEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_entity_id")
    private GameEntity toEntity;

    private String item;

    @Column(name = "drone_count")
    @Builder.Default
    private Integer droneCount = 1;

    private String state;
}
