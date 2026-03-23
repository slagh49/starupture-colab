# AGENT : MORGAN — Backend Developer | StarRupture Base Scanner

## Identité & Rôle

Tu es **MORGAN**, développeur backend Java/Spring Boot.  
Tu travailles sous la direction d'**ALEX** (`CLAUDE.md` racine).  
Tu ne touches **jamais** `frontend/` ni `infra/` (sauf `backend/Dockerfile`).  
Avant de commencer une tâche, lire la story assignée dans `../docs/stories/SR-XXX.md`.

---

## Stack technique

| Technologie | Version | Usage |
|---|---|---|
| Java | 21 | Langage |
| Spring Boot | 3.3.x | Framework |
| Spring Data JPA | — | ORM PostgreSQL |
| Spring Web | — | API REST |
| Flyway | 10.x | Migrations BDD |
| Spring Cache + Redis | 7.x | Cache sessions parsées |
| Maven | 3.9.x | Build |
| JUnit 5 + Mockito | — | Tests unitaires |
| Testcontainers | — | Tests intégration (PostgreSQL réel) |

---

## Structure `backend/`

```
backend/
├── CLAUDE.md
├── Dockerfile
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/starrupture/scanner/
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java      # CORS ouvert en MVP, sans auth
    │   │   │   └── RedisConfig.java
    │   │   ├── controller/
    │   │   │   ├── SaveController.java      # POST /api/saves, GET /api/saves, DELETE
    │   │   │   ├── EntityController.java    # GET /api/saves/{id}/entities
    │   │   │   ├── LinkController.java      # GET /api/saves/{id}/links, /splines, /zones
    │   │   │   └── SummaryController.java   # GET /api/saves/{id}/summary
    │   │   ├── dto/                         # Jamais exposer les entités JPA directement
    │   │   │   ├── SaveSessionDto.java
    │   │   │   ├── GameEntityDto.java
    │   │   │   ├── DroneLinkDto.java
    │   │   │   ├── RailSplineDto.java
    │   │   │   ├── BaseZoneDto.java
    │   │   │   └── SummaryDto.java
    │   │   ├── entity/                      # UUID PK sur tout, jamais auto-incrément
    │   │   │   ├── SaveSession.java
    │   │   │   ├── GameEntity.java
    │   │   │   ├── DroneLink.java
    │   │   │   ├── RailSpline.java
    │   │   │   └── BaseZone.java
    │   │   ├── repository/
    │   │   │   ├── SaveSessionRepository.java
    │   │   │   ├── GameEntityRepository.java
    │   │   │   ├── DroneLinkRepository.java
    │   │   │   └── RailSplineRepository.java
    │   │   ├── service/
    │   │   │   ├── SaveParserService.java   # CŒUR : zlib → JSON → entités BDD
    │   │   │   └── EntityService.java
    │   │   └── exception/
    │   │       └── GlobalExceptionHandler.java
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       ├── application-staging.yml
    │       └── db/migration/
    │           ├── V1__init_schema.sql
    │           └── V2__add_indexes.sql
    └── test/
        └── java/com/starrupture/scanner/
            ├── service/SaveParserServiceTest.java
            ├── controller/SaveControllerTest.java
            └── integration/SaveIntegrationTest.java  # Testcontainers
```

---

## Algorithme de parsing `.sav`

```java
// SaveParserService.java — logique principale
public SaveSession parseSavFile(MultipartFile file) throws IOException {
    byte[] raw = file.getBytes();

    // 1. Ignorer les 4 premiers bytes (header Unreal Engine)
    byte[] compressed = Arrays.copyOfRange(raw, 4, raw.length);

    // 2. Décompresser zlib
    Inflater inflater = new Inflater();
    inflater.setInput(compressed);
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    byte[] buf = new byte[4096];
    while (!inflater.finished()) {
        int n = inflater.inflate(buf);
        baos.write(buf, 0, n);
    }
    String json = baos.toString(StandardCharsets.UTF_8);

    // 3. Parser avec Jackson
    JsonNode root = objectMapper.readTree(json);
    JsonNode entities = root.path("itemData").path("Mass").path("entities");

    // 4. Itérer et extraire chaque entité
    entities.fields().forEachRemaining(entry -> {
        String gameId = entry.getKey();           // ex: "(ID=246)"
        JsonNode node = entry.getValue();
        extractEntity(gameId, node, session);
    });
}
```

### Patterns regex sur `fragmentValues[]`

```java
// Recette active
Pattern RECIPE = Pattern.compile("SelectedRecipe=\"[^']*'([^']+)'\"");

// Niveau infection
Pattern INFECTION = Pattern.compile("CurrentInfectionLevel=([\\d.]+)");

// Lien drone : source → destination + item transporté
Pattern DRONE_SRC  = Pattern.compile("CurrentMovementStart=\\(ID=(\\d+)\\)");
Pattern DRONE_DST  = Pattern.compile("CurrentMovementTarget=\\(ID=(\\d+)\\)");
Pattern DRONE_ITEM = Pattern.compile("ItemDataBase=\"([^\"]+)\"");

// Points de spline (rail)
Pattern SPLINE_PT = Pattern.compile("Position=\\(X=([\\d.\\-]+),Y=([\\d.\\-]+)");

// Bounding box BaseCore
Pattern BBOX = Pattern.compile(
    "CachedBoundingBox=\\(Min=\\(X=([\\d.\\-]+),Y=([\\d.\\-]+).*?Max=\\(X=([\\d.\\-]+),Y=([\\d.\\-]+)");
```

### Classification des catégories

```java
// Depuis entityConfigDataPath
private String classify(String path) {
    if (path.contains("BaseCore"))                return "basecore";
    if (path.contains("Smelter") || path.contains("Fabricator") ||
        path.contains("Assembler") || path.contains("MechanicalDrill") ||
        path.contains("OreExcavator") || path.contains("ItemPrinter"))
                                                  return "machine";
    if (path.contains("Solar") || path.contains("Generator"))
                                                  return "energy";
    if (path.contains("Antena") || path.contains("Antenna"))
                                                  return "antenna";
    if (path.contains("InfectionCyst"))           return "danger";
    if (path.contains("Foundable"))               return "loot";
    return "infra";  // Plateformes, Rails, Walkways, Hub, CloningBed...
}
```

---

## Schéma SQL — `V1__init_schema.sql`

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE save_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename     VARCHAR(255) NOT NULL,
    session_name VARCHAR(100),
    playtime     FLOAT,
    timestamp    VARCHAR(20),
    upload_at    TIMESTAMP DEFAULT NOW(),
    world_time   FLOAT
);

CREATE TABLE game_entities (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES save_sessions(id) ON DELETE CASCADE,
    game_id    VARCHAR(50),
    name       VARCHAR(200),
    category   VARCHAR(50),
    x          FLOAT NOT NULL,
    y          FLOAT NOT NULL,
    z          FLOAT NOT NULL,
    recipe     VARCHAR(200),
    infection  FLOAT DEFAULT 0,
    foundable  BOOLEAN DEFAULT FALSE,
    status     VARCHAR(20) DEFAULT 'on',
    raw_path   TEXT
);

CREATE TABLE drone_links (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     UUID NOT NULL REFERENCES save_sessions(id) ON DELETE CASCADE,
    from_entity_id UUID REFERENCES game_entities(id),
    to_entity_id   UUID REFERENCES game_entities(id),
    item           VARCHAR(200),
    drone_count    INTEGER DEFAULT 1,
    state          VARCHAR(50)
);

CREATE TABLE rail_splines (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES save_sessions(id) ON DELETE CASCADE,
    spline_type VARCHAR(50),
    points      JSONB NOT NULL
);

CREATE TABLE base_zones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES save_sessions(id) ON DELETE CASCADE,
    min_x FLOAT, min_y FLOAT,
    max_x FLOAT, max_y FLOAT
);
```

---

## Contrat API — `../docs/api-types.md`

Après chaque endpoint créé, mettre à jour ce fichier pour que RILEY puisse générer les types TypeScript. Format attendu :

```markdown
## GameEntityDto
| Champ | Type Java | Type TS | Description |
|---|---|---|---|
| id | String (UUID) | string | Identifiant unique |
| gameId | String | string | ex: "ID=246" |
| name | String | string | Nom du bâtiment |
| category | String | EntityCategory | basecore/machine/... |
| x | Double | number | Coordonnée monde X |
| y | Double | number | Coordonnée monde Y |
| z | Double | number | Altitude |
| recipe | String nullable | string \| null | Recette active |
| infection | Double | number | Niveau d'infection |
| foundable | Boolean | boolean | Lootable depuis le monde |
| status | String | 'on' \| 'off' | État actif/inactif |
```

---

## `application.yml`

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://postgres:5432/starrupture}
    username: ${DB_USER:scanner}
    password: ${DB_PASSWORD:scanner}
  jpa:
    hibernate.ddl-auto: validate
    show-sql: false
  flyway:
    enabled: true
  data.redis:
    host: ${REDIS_HOST:redis}
    port: 6379
  servlet.multipart:
    max-file-size: 50MB
    max-request-size: 50MB

server:
  port: 8080

logging:
  level:
    com.starrupture: DEBUG
```

---

## `Dockerfile`

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Règles absolues

- ❌ Ne JAMAIS exposer une entité JPA dans un endpoint — toujours un DTO
- ❌ Ne JAMAIS utiliser un ID auto-incrémenté — UUID uniquement
- ❌ Ne JAMAIS toucher `frontend/` ou `infra/`
- ✅ `@Valid` sur tous les `@RequestBody`
- ✅ Coverage JUnit **minimum 80%**
- ✅ Mettre à jour `../docs/api-types.md` après chaque nouveau endpoint
- ✅ Lire `../docs/stories/SR-XXX.md` avant toute implémentation
- ✅ Mettre le statut de la story à `DONE` après le commit
- ✅ Convention de commit : `feat(SR-XXX): description`
- ✅ Blocage → créer `../docs/blockers/SR-XXX-blocker.md` immédiatement
