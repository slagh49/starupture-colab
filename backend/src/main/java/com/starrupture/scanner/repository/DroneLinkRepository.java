package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.DroneLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DroneLinkRepository extends JpaRepository<DroneLink, UUID> {

    List<DroneLink> findBySessionId(UUID sessionId);

    long countBySessionId(UUID sessionId);
}
