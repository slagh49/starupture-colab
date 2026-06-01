package com.starrupture.scanner.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@Slf4j
public class FtpService {

    /** Download a file from the FTP server and return its raw bytes. */
    public byte[] download(String host, int port, String user, String password, String path) throws IOException {
        FTPClient ftp = new FTPClient();
        try {
            ftp.connect(host, port > 0 ? port : 21);
            if (!FTPReply.isPositiveCompletion(ftp.getReplyCode())) {
                throw new IOException("Connexion FTP refusée (code " + ftp.getReplyCode() + ")");
            }
            if (!ftp.login(user, password)) {
                throw new IOException("Échec de l'authentification FTP");
            }
            ftp.enterLocalPassiveMode();
            ftp.setFileType(FTP.BINARY_FILE_TYPE);
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

    /** Test that the server accepts the credentials. */
    public boolean test(String host, int port, String user, String password) {
        FTPClient ftp = new FTPClient();
        try {
            ftp.connect(host, port > 0 ? port : 21);
            if (!FTPReply.isPositiveCompletion(ftp.getReplyCode())) {
                return false;
            }
            return ftp.login(user, password);
        } catch (IOException e) {
            log.warn("FTP test failed: {}", e.getMessage());
            return false;
        } finally {
            disconnect(ftp);
        }
    }

    private void disconnect(FTPClient ftp) {
        if (ftp.isConnected()) {
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
