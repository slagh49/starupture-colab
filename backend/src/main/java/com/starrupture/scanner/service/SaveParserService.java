package com.starrupture.scanner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.starrupture.scanner.entity.*;
import com.starrupture.scanner.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.DataFormatException;
import java.util.zip.Inflater;

@Service
@RequiredArgsConstructor
@Slf4j
public class SaveParserService {

    private final ObjectMapper objectMapper;
    private final SaveSessionRepository saveSessionRepository;
    private final GameEntityRepository gameEntityRepository;
    private final DroneLinkRepository droneLinkRepository;
    private final RailSplineRepository railSplineRepository;
    private final BaseZoneRepository baseZoneRepository;

    // Regex patterns for fragment extraction
    static final Pattern RECIPE = Pattern.compile("SelectedRecipe=\"[^']*'([^']+)'\"");
    static final Pattern INFECTION = Pattern.compile("CurrentInfectionLevel=([\\d.]+)");
    static final Pattern DRONE_SRC = Pattern.compile("CurrentMovementStart=\\(ID=(\\d+)\\)");
    static final Pattern DRONE_DST = Pattern.compile("CurrentMovementTarget=\\(ID=(\\d+)\\)");
    static final Pattern DRONE_ITEM = Pattern.compile("ItemDataBase=\"([^\"]+)\"");
    static final Pattern SPLINE_PT = Pattern.compile("Position=\\(X=([\\d.\\-]+),Y=([\\d.\\-]+)");
    static final Pattern BBOX = Pattern.compile(
            "CachedBoundingBox=\\(Min=\\(X=([\\d.\\-]+),Y=([\\d.\\-]+).*?Max=\\(X=([\\d.\\-]+),Y=([\\d.\\-]+)");

    /**
     * Decompress zlib data, skipping the 4-byte Unreal Engine header.
     */
    public String decompressSav(byte[] raw) throws IOException {
        if (raw.length < 5) {
            throw new IOException("File too small to be a valid .sav file");
        }
        byte[] compressed = Arrays.copyOfRange(raw, 4, raw.length);

        Inflater inflater = new Inflater();
        inflater.setInput(compressed);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            while (!inflater.finished()) {
                int n = inflater.inflate(buf);
                if (n == 0 && inflater.needsInput()) {
                    throw new IOException("Incomplete zlib data");
                }
                baos.write(buf, 0, n);
            }
            return baos.toString(StandardCharsets.UTF_8);
        } catch (DataFormatException e) {
            throw new IOException("Invalid zlib compressed data: " + e.getMessage(), e);
        } finally {
            inflater.end();
        }
    }

    /**
     * Classify entity by its config data path.
     */
    public String classify(String path) {
        if (path == null) return "infra";
        if (path.contains("BaseCore")) return "basecore";
        if (path.contains("Smelter") || path.contains("Fabricator") ||
                path.contains("Assembler") || path.contains("MechanicalDrill") ||
                path.contains("OreExcavator") || path.contains("ItemPrinter"))
            return "machine";
        if (path.contains("Solar") || path.contains("Generator"))
            return "energy";
        if (path.contains("Antena") || path.contains("Antenna"))
            return "antenna";
        if (path.contains("InfectionCyst")) return "danger";
        if (path.contains("Foundable")) return "loot";
        return "infra";
    }

    /**
     * Extract a short name from a config data path.
     */
    public String extractName(String path) {
        if (path == null || path.isEmpty()) return "Unknown";
        // Take the last segment after the last '/' or '.'
        String name = path;
        int lastSlash = name.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < name.length() - 1) {
            name = name.substring(lastSlash + 1);
        }
        int lastDot = name.lastIndexOf('.');
        if (lastDot >= 0 && lastDot < name.length() - 1) {
            name = name.substring(lastDot + 1);
        }
        // Remove common suffixes
        name = name.replace("_C", "").replace("_c", "");
        return name.isEmpty() ? "Unknown" : name;
    }

    /**
     * Extract recipe from fragment values.
     */
    public String extractRecipe(List<String> fragments) {
        for (String frag : fragments) {
            Matcher m = RECIPE.matcher(frag);
            if (m.find()) {
                return m.group(1);
            }
        }
        return null;
    }

    /**
     * Extract infection level from fragment values.
     */
    public double extractInfection(List<String> fragments) {
        for (String frag : fragments) {
            Matcher m = INFECTION.matcher(frag);
            if (m.find()) {
                try {
                    return Double.parseDouble(m.group(1));
                } catch (NumberFormatException e) {
                    log.warn("Failed to parse infection level: {}", m.group(1));
                }
            }
        }
        return 0.0;
    }

    /**
     * Extract spline points from fragment values.
     */
    public List<double[]> extractSplinePoints(List<String> fragments) {
        List<double[]> points = new ArrayList<>();
        for (String frag : fragments) {
            Matcher m = SPLINE_PT.matcher(frag);
            while (m.find()) {
                try {
                    double x = Double.parseDouble(m.group(1));
                    double y = Double.parseDouble(m.group(2));
                    points.add(new double[]{x, y});
                } catch (NumberFormatException e) {
                    log.warn("Failed to parse spline point: {}, {}", m.group(1), m.group(2));
                }
            }
        }
        return points;
    }

    /**
     * Extract bounding box from fragment values.
     */
    public double[] extractBoundingBox(List<String> fragments) {
        for (String frag : fragments) {
            Matcher m = BBOX.matcher(frag);
            if (m.find()) {
                try {
                    return new double[]{
                            Double.parseDouble(m.group(1)),
                            Double.parseDouble(m.group(2)),
                            Double.parseDouble(m.group(3)),
                            Double.parseDouble(m.group(4))
                    };
                } catch (NumberFormatException e) {
                    log.warn("Failed to parse bounding box");
                }
            }
        }
        return null;
    }

    /**
     * Convert fragment values JsonNode to a list of strings.
     */
    private List<String> getFragmentValues(JsonNode entityNode) {
        List<String> fragments = new ArrayList<>();
        JsonNode fragArray = entityNode.path("fragmentValues");
        if (fragArray.isArray()) {
            for (JsonNode frag : fragArray) {
                fragments.add(frag.asText());
            }
        }
        return fragments;
    }

    /**
     * Parse coordinates from entity node.
     */
    private double[] extractCoordinates(JsonNode entityNode) {
        double x = entityNode.path("x").asDouble(0.0);
        double y = entityNode.path("y").asDouble(0.0);
        double z = entityNode.path("z").asDouble(0.0);
        return new double[]{x, y, z};
    }

    /**
     * Main parsing method: decompresses .sav, parses JSON, extracts all entities.
     */
    @Transactional
    public SaveSession parseSavFile(MultipartFile file) throws IOException {
        byte[] raw = file.getBytes();
        String json = decompressSav(raw);

        JsonNode root = objectMapper.readTree(json);

        // Create session from root metadata
        SaveSession session = SaveSession.builder()
                .filename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown.sav")
                .sessionName(root.path("sessionName").asText(null))
                .playtime(root.path("playtime").asDouble(0.0))
                .timestamp(root.path("timestamp").asText(null))
                .worldTime(root.path("worldTime").asDouble(0.0))
                .build();

        session = saveSessionRepository.save(session);

        // Navigate to entities
        JsonNode entities = root.path("itemData").path("Mass").path("entities");

        // Map to resolve drone links: gameId -> GameEntity
        Map<String, GameEntity> entityMap = new HashMap<>();
        // Pending drone data: list of (srcGameId, dstGameId, item)
        List<String[]> pendingDroneLinks = new ArrayList<>();

        if (entities.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = entities.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String gameId = entry.getKey();
                JsonNode node = entry.getValue();

                String configPath = node.path("entityConfigDataPath").asText("");
                String category = classify(configPath);
                String name = extractName(configPath);
                double[] coords = extractCoordinates(node);
                List<String> fragments = getFragmentValues(node);

                String recipe = extractRecipe(fragments);
                double infection = extractInfection(fragments);
                boolean foundable = "loot".equals(category);

                GameEntity entity = GameEntity.builder()
                        .session(session)
                        .gameId(gameId)
                        .name(name)
                        .category(category)
                        .x(coords[0])
                        .y(coords[1])
                        .z(coords[2])
                        .recipe(recipe)
                        .infection(infection)
                        .foundable(foundable)
                        .status("on")
                        .rawPath(configPath)
                        .build();

                entity = gameEntityRepository.save(entity);
                entityMap.put(gameId, entity);

                // Extract drone link data
                for (String frag : fragments) {
                    Matcher srcMatch = DRONE_SRC.matcher(frag);
                    Matcher dstMatch = DRONE_DST.matcher(frag);
                    Matcher itemMatch = DRONE_ITEM.matcher(frag);

                    if (srcMatch.find() && dstMatch.find()) {
                        String srcId = "(ID=" + srcMatch.group(1) + ")";
                        String dstId = "(ID=" + dstMatch.group(1) + ")";
                        String item = itemMatch.find() ? itemMatch.group(1) : null;
                        pendingDroneLinks.add(new String[]{srcId, dstId, item});
                    }
                }

                // Extract spline points for rails/walkways
                if (configPath.contains("DroneRail") || configPath.contains("Walkway") ||
                        configPath.contains("Rail")) {
                    List<double[]> splinePoints = extractSplinePoints(fragments);
                    if (!splinePoints.isEmpty()) {
                        String splineType = configPath.contains("Walkway") ? "walkway" : "drone_rail";
                        String pointsJson = objectMapper.writeValueAsString(splinePoints);
                        RailSpline spline = RailSpline.builder()
                                .session(session)
                                .splineType(splineType)
                                .points(pointsJson)
                                .build();
                        railSplineRepository.save(spline);
                    }
                }

                // Extract bounding box for BaseCore
                if ("basecore".equals(category)) {
                    double[] bbox = extractBoundingBox(fragments);
                    if (bbox != null) {
                        BaseZone zone = BaseZone.builder()
                                .session(session)
                                .minX(bbox[0])
                                .minY(bbox[1])
                                .maxX(bbox[2])
                                .maxY(bbox[3])
                                .build();
                        baseZoneRepository.save(zone);
                    }
                }
            }
        }

        // Resolve and save drone links
        for (String[] linkData : pendingDroneLinks) {
            GameEntity fromEntity = entityMap.get(linkData[0]);
            GameEntity toEntity = entityMap.get(linkData[1]);
            DroneLink link = DroneLink.builder()
                    .session(session)
                    .fromEntity(fromEntity)
                    .toEntity(toEntity)
                    .item(linkData[2])
                    .droneCount(1)
                    .state("active")
                    .build();
            droneLinkRepository.save(link);
        }

        log.info("Parsed save file '{}': {} entities, {} drone links",
                file.getOriginalFilename(), entityMap.size(), pendingDroneLinks.size());

        return session;
    }
}
