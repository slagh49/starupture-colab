package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.SaveSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SaveSessionRepository extends JpaRepository<SaveSession, UUID> {

    List<SaveSession> findAllByOrderByUploadAtDesc();
}
