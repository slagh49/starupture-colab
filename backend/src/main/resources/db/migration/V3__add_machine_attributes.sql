-- Attributs machine supplémentaires lus depuis les fragmentValues du .sav
ALTER TABLE game_entities
    ADD COLUMN electricity_level INTEGER,
    ADD COLUMN craft_progress    FLOAT,
    ADD COLUMN craft_speed       FLOAT,
    ADD COLUMN output_full       BOOLEAN,
    ADD COLUMN missing_items     BOOLEAN,
    ADD COLUMN priority          VARCHAR(20);

-- Inventaire des machines : une ligne par item (entrée/sortie)
CREATE TABLE game_entity_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id  UUID NOT NULL REFERENCES game_entities(id) ON DELETE CASCADE,
    side       VARCHAR(10) NOT NULL,
    item       VARCHAR(200),
    item_count INTEGER DEFAULT 0
);

CREATE INDEX idx_game_entity_items_entity_id ON game_entity_items(entity_id);
