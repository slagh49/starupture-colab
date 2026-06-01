package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.AppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AppConfigRepository extends JpaRepository<AppConfig, UUID> {
}
