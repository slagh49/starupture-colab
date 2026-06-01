-- Index sur les FK from_entity_id / to_entity_id de drone_links.
-- Sans eux, supprimer un game_entity force PostgreSQL à scanner toute la table
-- drone_links pour vérifier la contrainte FK (NO ACTION) → le DELETE en cascade
-- de save_sessions (wipe-on-import) devenait O(n²) et durait des heures.
CREATE INDEX IF NOT EXISTS idx_drone_links_from_entity_id ON drone_links(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_drone_links_to_entity_id   ON drone_links(to_entity_id);
