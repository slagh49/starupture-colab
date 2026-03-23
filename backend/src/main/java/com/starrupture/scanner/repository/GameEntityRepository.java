package com.starrupture.scanner.repository;

import com.starrupture.scanner.entity.GameEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameEntityRepository extends JpaRepository<GameEntity, UUID> {

    List<GameEntity> findBySessionId(UUID sessionId);

    List<GameEntity> findBySessionIdAndCategory(UUID sessionId, String category);

    @Query("SELECT g FROM GameEntity g WHERE g.session.id = :sessionId AND g.gameId = :gameId")
    Optional<GameEntity> findBySessionIdAndGameId(@Param("sessionId") UUID sessionId,
                                                   @Param("gameId") String gameId);

    @Query("SELECT g.category, COUNT(g) FROM GameEntity g WHERE g.session.id = :sessionId GROUP BY g.category")
    List<Object[]> countBySessionIdGroupByCategory(@Param("sessionId") UUID sessionId);

    long countBySessionId(UUID sessionId);
}
