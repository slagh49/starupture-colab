package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.RailSpline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RailSplineRepository extends JpaRepository<RailSpline, UUID> {

    List<RailSpline> findBySessionId(UUID sessionId);

    long countBySessionId(UUID sessionId);
}
