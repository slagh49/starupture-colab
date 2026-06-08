-- Marqueurs collaboratifs sur la carte (pins annotés).
CREATE TABLE map_marker (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    x          FLOAT NOT NULL,
    y          FLOAT NOT NULL,
    label      VARCHAR(200) NOT NULL,
    color      VARCHAR(20) DEFAULT '#00d4ff',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Diff d'import : résumé des changements entre deux imports successifs.
-- Stocké sur la session (JSON), calculé au moment du wipe-and-replace.
ALTER TABLE save_sessions ADD COLUMN import_diff TEXT;

-- Snapshot de l'état précédent pour calculer le diff à l'import suivant.
ALTER TABLE app_config ADD COLUMN last_import_snapshot TEXT;
