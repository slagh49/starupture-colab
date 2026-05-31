package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.GameEntityItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameEntityItemRepository extends JpaRepository<GameEntityItem, UUID> {

    List<GameEntityItem> findByEntityId(UUID entityId);
}
