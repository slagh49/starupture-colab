package com.starrupture.scanner.service;

import com.starrupture.scanner.dto.*;
import com.starrupture.scanner.entity.*;
import com.starrupture.scanner.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EntityService {

    private final SaveSessionRepository saveSessionRepository;
    private final GameEntityRepository gameEntityRepository;
    private final GameEntityItemRepository gameEntityItemRepository;
    private final DroneLinkRepository droneLinkRepository;
    private final RailSplineRepository railSplineRepository;
    private final BaseZoneRepository baseZoneRepository;

    // ---- Session operations ----

    public List<SaveSessionDto> getAllSessions() {
        return saveSessionRepository.findAllByOrderByUploadAtDesc().stream()
                .map(this::toSessionDto)
                .collect(Collectors.toList());
    }

    public Optional<SaveSessionDto> getSession(UUID sessionId) {
        return saveSessionRepository.findById(sessionId)
                .map(this::toSessionDto);
    }

    @Transactional
    public void deleteSession(UUID sessionId) {
        if (!saveSessionRepository.existsById(sessionId)) {
            throw new NoSuchElementException("Session not found: " + sessionId);
        }
        saveSessionRepository.deleteById(sessionId);
    }

    // ---- Entity operations ----

    public List<GameEntityDto> getEntities(UUID sessionId, String category) {
        List<GameEntity> entities;
        if (category != null && !category.isBlank()) {
            entities = gameEntityRepository.findBySessionIdAndCategory(sessionId, category);
        } else {
            entities = gameEntityRepository.findBySessionId(sessionId);
        }
        return entities.stream()
                .map(this::toEntityDto)
                .collect(Collectors.toList());
    }

    public List<GameEntityItemDto> getEntityItems(UUID sessionId, UUID entityId) {
        return gameEntityItemRepository.findByEntityId(entityId).stream()
                .map(this::toItemDto)
                .collect(Collectors.toList());
    }

    // ---- Link operations ----

    public List<DroneLinkDto> getDroneLinks(UUID sessionId) {
        return droneLinkRepository.findBySessionId(sessionId).stream()
                .map(this::toLinkDto)
                .collect(Collectors.toList());
    }

    public List<RailSplineDto> getRailSplines(UUID sessionId) {
        return railSplineRepository.findBySessionId(sessionId).stream()
                .map(this::toSplineDto)
                .collect(Collectors.toList());
    }

    public List<BaseZoneDto> getBaseZones(UUID sessionId) {
        return baseZoneRepository.findBySessionId(sessionId).stream()
                .map(this::toZoneDto)
                .collect(Collectors.toList());
    }

    // ---- Summary ----

    public SummaryDto getSummary(UUID sessionId) {
        SaveSession session = saveSessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Session not found: " + sessionId));

        Map<String, Long> countByCategory = new LinkedHashMap<>();
        List<Object[]> categoryCounts = gameEntityRepository.countBySessionIdGroupByCategory(sessionId);
        for (Object[] row : categoryCounts) {
            countByCategory.put((String) row[0], (Long) row[1]);
        }

        return SummaryDto.builder()
                .sessionId(session.getId().toString())
                .sessionName(session.getSessionName())
                .totalEntities((int) gameEntityRepository.countBySessionId(sessionId))
                .countByCategory(countByCategory)
                .totalDroneLinks((int) droneLinkRepository.countBySessionId(sessionId))
                .totalRailSplines((int) railSplineRepository.countBySessionId(sessionId))
                .totalBaseZones((int) baseZoneRepository.countBySessionId(sessionId))
                .playtime(session.getPlaytime())
                .worldTime(session.getWorldTime())
                .build();
    }

    // ---- Mapping methods ----

    private SaveSessionDto toSessionDto(SaveSession entity) {
        return SaveSessionDto.builder()
                .id(entity.getId().toString())
                .filename(entity.getFilename())
                .sessionName(entity.getSessionName())
                .playtime(entity.getPlaytime())
                .timestamp(entity.getTimestamp())
                .uploadAt(entity.getUploadAt())
                .worldTime(entity.getWorldTime())
                .entityCount((int) gameEntityRepository.countBySessionId(entity.getId()))
                .build();
    }

    public SaveSessionDto toSessionDto(SaveSession entity, int entityCount) {
        return SaveSessionDto.builder()
                .id(entity.getId().toString())
                .filename(entity.getFilename())
                .sessionName(entity.getSessionName())
                .playtime(entity.getPlaytime())
                .timestamp(entity.getTimestamp())
                .uploadAt(entity.getUploadAt())
                .worldTime(entity.getWorldTime())
                .entityCount(entityCount)
                .build();
    }

    private GameEntityDto toEntityDto(GameEntity entity) {
        return GameEntityDto.builder()
                .id(entity.getId().toString())
                .gameId(entity.getGameId())
                .name(entity.getName())
                .category(entity.getCategory())
                .x(entity.getX())
                .y(entity.getY())
                .z(entity.getZ())
                .recipe(entity.getRecipe())
                .infection(entity.getInfection())
                .foundable(entity.getFoundable())
                .status(entity.getStatus())
                .electricityLevel(entity.getElectricityLevel())
                .craftProgress(entity.getCraftProgress())
                .craftSpeed(entity.getCraftSpeed())
                .outputFull(entity.getOutputFull())
                .missingItems(entity.getMissingItems())
                .priority(entity.getPriority())
                .build();
    }

    private GameEntityItemDto toItemDto(GameEntityItem item) {
        return GameEntityItemDto.builder()
                .side(item.getSide())
                .item(item.getItem())
                .count(item.getCount())
                .build();
    }

    private DroneLinkDto toLinkDto(DroneLink link) {
        return DroneLinkDto.builder()
                .id(link.getId().toString())
                .fromEntityId(link.getFromEntity() != null ? link.getFromEntity().getId().toString() : null)
                .toEntityId(link.getToEntity() != null ? link.getToEntity().getId().toString() : null)
                .item(link.getItem())
                .droneCount(link.getDroneCount())
                .state(link.getState())
                .build();
    }

    private RailSplineDto toSplineDto(RailSpline spline) {
        return RailSplineDto.builder()
                .id(spline.getId().toString())
                .splineType(spline.getSplineType())
                .points(spline.getPoints())
                .build();
    }

    private BaseZoneDto toZoneDto(BaseZone zone) {
        return BaseZoneDto.builder()
                .id(zone.getId().toString())
                .minX(zone.getMinX())
                .minY(zone.getMinY())
                .maxX(zone.getMaxX())
                .maxY(zone.getMaxY())
                .build();
    }
}
