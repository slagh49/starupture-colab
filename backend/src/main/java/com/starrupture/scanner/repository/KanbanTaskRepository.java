package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.KanbanTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KanbanTaskRepository extends JpaRepository<KanbanTask, UUID> {

    List<KanbanTask> findByColumnIdOrderByPositionAsc(UUID columnId);

    long countByColumnId(UUID columnId);
}
