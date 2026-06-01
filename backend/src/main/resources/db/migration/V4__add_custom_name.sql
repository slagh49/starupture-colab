-- Nom personnalisé donné par le joueur en jeu (CrBuildingCustomNameSubsystem)
ALTER TABLE game_entities
    ADD COLUMN custom_name VARCHAR(255);
