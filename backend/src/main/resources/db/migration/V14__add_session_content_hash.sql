-- Empreinte SHA-256 du fichier .sav brut, calculée à l'import et stockée sur la
-- session. Sert à détecter de façon fiable un import identique au précédent
-- (même contenu au bit près), là où l'ancienne comparaison timestamp + playtime
-- pouvait conclure à tort « identique » alors que le contenu différait.
ALTER TABLE save_sessions ADD COLUMN content_hash VARCHAR(64);
