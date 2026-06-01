-- Passerelle HTTP Web-FTP (Monsta FTP bridge) : permet de télécharger le .sav
-- en HTTP via le serveur de l'hébergeur (qui fait le FTP côté LAN), ce qui
-- contourne le canal de données FTP passif bloqué côté client.
ALTER TABLE app_config
    ADD COLUMN bridge_url VARCHAR(500)
    DEFAULT 'https://ftp.4np.4players.de/bridges/php/handler.php';
