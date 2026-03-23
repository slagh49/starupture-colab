package com.starrupture.scanner.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "base_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaseZone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private SaveSession session;

    @Column(name = "min_x")
    private Double minX;

    @Column(name = "min_y")
    private Double minY;

    @Column(name = "max_x")
    private Double maxX;

    @Column(name = "max_y")
    private Double maxY;
}
