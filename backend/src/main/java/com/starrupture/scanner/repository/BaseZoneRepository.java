package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.BaseZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BaseZoneRepository extends JpaRepository<BaseZone, UUID> {

    List<BaseZone> findBySessionId(UUID sessionId);

    long countBySessionId(UUID sessionId);
}
