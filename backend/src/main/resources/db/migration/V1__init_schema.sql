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
