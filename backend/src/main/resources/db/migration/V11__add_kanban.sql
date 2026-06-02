-- Onglet TODO : tableau kanban partagé (coopératif) — indépendant des sauvegardes,
-- jamais effacé par le wipe-and-replace de l'import.

CREATE TABLE kanban_column (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      VARCHAR(80) NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE kanban_task (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    column_id   UUID NOT NULL REFERENCES kanban_column(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    priority    VARCHAR(10) NOT NULL DEFAULT 'NORMAL',  -- LOW / NORMAL / HIGH
    assignee    VARCHAR(100),                           -- nom d'utilisateur (libre)
    due_date    DATE,
    position    INTEGER NOT NULL DEFAULT 0,
    created_by  VARCHAR(100),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP
);

CREATE INDEX idx_kanban_task_column ON kanban_task(column_id);

-- Colonnes par défaut pour que le board ne soit pas vide au premier accès.
INSERT INTO kanban_column (title, position) VALUES
    ('À faire', 0),
    ('En cours', 1),
    ('Terminé', 2);
