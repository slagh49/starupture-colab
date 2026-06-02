package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.KanbanColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KanbanColumnRepository extends JpaRepository<KanbanColumn, UUID> {

    List<KanbanColumn> findAllByOrderByPositionAsc();
}
