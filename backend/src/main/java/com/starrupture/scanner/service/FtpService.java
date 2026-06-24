package com.starrupture.scanner.service;

import com.starrupture.scanner.security.SsrfGuard;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;
import org.apache.commons.net.ftp.FTPReply;
import org.apache.commons.net.ftp.FTPSClient;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Comparator;

@Service
@Slf4j
public class FtpService {

    /**
     * Connect and log in, trying plain FTP first then FTPS (explicit TLS).
     * Returns a ready FTPClient (passive, binary) or throws with the cause.
     */
    private FTPClient connectAndLogin(String host, int port, String user, String password) throws IOException {
        SsrfGuard.checkHost(host); // refuse loopback / IP privées (anti-SSRF)
        int p = port > 0 ? port : 21;
        IOException last = null;
        // Plain FTP first (most game-server hosts), FTPS as fallback.
        for (boolean tls : new boolean[]{false, true}) {
            FTPClient ftp = tls ? new FTPSClient(false) : new FTPClient();
            try {
                ftp.setConnectTimeout(6000);
                ftp.setDefaultTimeout(6000);
                ftp.connect(host, p);
                if (!FTPReply.isPositiveCompletion(ftp.getReplyCode())) {
                    last = new IOException("connexion refusée (code " + ftp.getReplyCode() + ")");
                    disconnect(ftp);
                    continue;
                }
                if (!ftp.login(user, password)) {
                    last = new IOException("authentification refusée : " + ftp.getReplyString().trim());
                    disconnect(ftp);
                    continue;
                }
                if (tls) {
                    FTPSClient ftps = (FTPSClient) ftp;
                    ftps.execPBSZ(0);
                    ftps.execPROT("P");
                }
                ftp.enterLocalPassiveMode();
                ftp.setFileType(FTP.BINARY_FILE_TYPE);
                log.info("FTP connecté à {}:{} ({})", host, p, tls ? "FTPS" : "FTP");
                return ftp;
            } catch (IOException e) {
                last = new IOException((tls ? "FTPS" : "FTP") + " : " + e.getMessage());
                disconnect(ftp);
            }
        }
        throw last != null ? last : new IOException("Connexion impossible");
    }

    /** Download a file and return its raw bytes. */
    public byte[] download(String host, int port, String user, String password, String path) throws IOException {
        FTPClient ftp = connectAndLogin(host, port, user, password);
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ftp.retrieveFile(path, out)) {
                throw new IOException("Fichier introuvable ou illisible : " + path
                        + " (" + ftp.getReplyString().trim() + ")");
            }
            return out.toByteArray();
        } finally {
            disconnect(ftp);
        }
    }

    /** Résultat d'un téléchargement nommé (filename + contenu brut). */
    public record NamedDownload(String filename, byte[] bytes) {}

    /**
     * Liste le dossier distant, prend le .sav le plus récent (par date de
     * modification FTP) et le télécharge. Résout le problème de rotation des
     * slots AutoSave0/1/2 du serveur de jeu.
     */
    public NamedDownload downloadMostRecent(String host, int port, String user, String password, String directory) throws IOException {
        FTPClient ftp = connectAndLogin(host, port, user, password);
        try {
            FTPFile[] files = ftp.listFiles(directory);
            FTPFile best = Arrays.stream(files)
                    .filter(f -> f.isFile() && f.getName().toLowerCase().endsWith(".sav"))
                    .max(Comparator.comparing(f -> f.getTimestamp().getTimeInMillis()))
                    .orElseThrow(() -> new IOException("Aucun fichier .sav trouvé dans " + directory));

            String remotePath = directory.endsWith("/")
                    ? directory + best.getName()
                    : directory + "/" + best.getName();
            log.info("Slot le plus récent : {} ({})", best.getName(), best.getTimestamp().getTime());

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ftp.retrieveFile(remotePath, out)) {
                throw new IOException("Impossible de télécharger " + remotePath
                        + " (" + ftp.getReplyString().trim() + ")");
            }
            return new NamedDownload(best.getName(), out.toByteArray());
        } finally {
            disconnect(ftp);
        }
    }

    /** Test the connection; returns null on success, otherwise the error message. */
    public String test(String host, int port, String user, String password) {
        try {
            disconnect(connectAndLogin(host, port, user, password));
            return null;
        } catch (IOException e) {
            return e.getMessage();
        }
    }

    private void disconnect(FTPClient ftp) {
        if (ftp != null && ftp.isConnected()) {
            try {
                ftp.logout();
            } catch (IOException ignored) {
                // best effort
            }
            try {
                ftp.disconnect();
            } catch (IOException ignored) {
                // best effort
            }
        }
    }
}
