-- Import différentiel : on stocke l'empreinte (SHA-256) du dernier .sav importé
-- et l'id de la session correspondante. Si un import retélécharge un fichier
-- identique, on ne crée pas de session en double — on réutilise l'existante.
ALTER TABLE app_config ADD COLUMN last_import_hash VARCHAR(64);
ALTER TABLE app_config ADD COLUMN last_import_session_id UUID;
