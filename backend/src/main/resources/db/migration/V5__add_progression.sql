-- Progression du joueur (corporations + plans) extraite du .sav, en JSON
ALTER TABLE save_sessions
    ADD COLUMN progression TEXT;
