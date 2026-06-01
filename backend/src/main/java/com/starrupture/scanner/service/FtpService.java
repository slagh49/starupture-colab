package com.starrupture.scanner.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;
import org.apache.commons.net.ftp.FTPSClient;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@Slf4j
public class FtpService {

    /**
     * Connect and log in, trying FTPS (explicit TLS) first then plain FTP —
     * managed game-server hosts (e.g. 4Netplayers) usually require FTPS.
     * Returns a ready FTPClient (passive, binary) or throws with the cause.
     */
    private FTPClient connectAndLogin(String host, int port, String user, String password) throws IOException {
        int p = port > 0 ? port : 21;
        IOException last = null;
        for (boolean tls : new boolean[]{true, false}) {
            FTPClient ftp = tls ? new FTPSClient(false) : new FTPClient();
            try {
                ftp.setConnectTimeout(8000);
                ftp.setDefaultTimeout(8000);
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
