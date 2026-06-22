# 🚀 Installationsanleitung — StarRupture Base Scanner

🌍 [English](INSTALLATION.md) · [Français](INSTALLATION.fr.md) · **Deutsch** · [Español](INSTALLATION.es.md) · [Polski](INSTALLATION.pl.md)

> **Für wen ist diese Anleitung?** Diese Anleitung richtet sich an Personen, **die noch nie eine Anwendung dieser Art installiert haben**.
> Es sind keinerlei technische Vorkenntnisse nötig. Wir erklären Ihnen **jeden Schritt** und **jeden Befehl**.
>
> **Geschätzte Dauer:** 20 bis 40 Minuten (je nach Geschwindigkeit Ihrer Internetverbindung).

---

## 📋 Was Sie am Ende erhalten

Am Ende dieser Anleitung wird die Anwendung **StarRupture Base Scanner** auf Ihrem
Computer (oder einem Server) laufen und in einem Webbrowser erreichbar sein. Sie können dann Ihre
Spielstände importieren und Ihre Basis visualisieren.

---

## 🧰 Schritt 0 — Was Sie brauchen

| | Detail |
|---|---|
| 💻 Einen Computer | Windows 10/11, macOS oder Linux |
| 💾 Freier Speicherplatz | Etwa **5 GB** |
| 🌐 Eine Internetverbindung | Um die Anwendung beim ersten Mal herunterzuladen |
| 🐳 Die Software **Docker** | Wir installieren sie in Schritt 1 (sie ist kostenlos) |

> **Was ist Docker?** Stellen Sie sich eine „Box" vor, die bereits alles enthält, was die Anwendung zum
> Laufen braucht (den Server, die Datenbank …). Sie müssen **nichts weiter installieren**: Docker kümmert sich um alles.
> Es ist die einfachste und zuverlässigste Methode.

---

## 🐳 Schritt 1 — Docker installieren

### Unter Windows oder macOS

1. Gehen Sie auf **https://www.docker.com/products/docker-desktop/**
2. Klicken Sie auf **Download** und wählen Sie Ihr System (Windows oder Mac).
3. Öffnen Sie die heruntergeladene Datei und folgen Sie der Installation (klicken Sie auf „Next" / „Install").
4. **Starten Sie Ihren Computer neu**, falls Sie dazu aufgefordert werden.
5. Starten Sie **Docker Desktop** (das Wal-Symbol 🐳). Warten Sie, bis das Symbol unten
   „Docker Desktop is running" anzeigt.

> 💡 Falls unter Windows eine Meldung „WSL 2" erwähnt, lassen Sie Docker es automatisch installieren
> (klicken Sie auf den vorgeschlagenen Link und versuchen Sie es dann erneut).

### Unter Linux (Ubuntu/Debian)

Öffnen Sie ein Terminal und kopieren Sie diese Befehle nacheinander hinein:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Melden Sie sich anschließend **ab und wieder an** (oder starten Sie neu), damit die zweite Änderung wirksam wird.

### Prüfen, ob Docker funktioniert

Öffnen Sie ein **Terminal**:
- **Windows**: Startmenü → `PowerShell` eingeben → Enter.
- **macOS**: Programme → Dienstprogramme → **Terminal**.
- **Linux**: Ihr gewohntes Terminal.

Geben Sie diesen Befehl ein und drücken Sie Enter:

```bash
docker --version
```

Wenn Sie eine Zeile wie `Docker version 27.x.x` sehen, ist alles in Ordnung ✅. Andernfalls wiederholen Sie Schritt 1.

---

## 📥 Schritt 2 — Die Anwendung herunterladen

### Einfache Methode (ohne etwas weiteres zu installieren)

1. Gehen Sie auf die Projektseite: **https://github.com/slagh49/starupture-colab**
2. Klicken Sie auf den grünen Button **`< > Code`** und dann auf **Download ZIP**.
3. Sobald die `.zip`-Datei heruntergeladen ist, **entpacken Sie sie** (Rechtsklick → „Alle extrahieren").
4. Sie erhalten einen Ordner namens `starupture-colab` (oder ähnlich). **Merken Sie sich, wo er liegt**
   (zum Beispiel im Download-Ordner).

### Alternative Methode (falls Sie sich mit `git` auskennen)

```bash
git clone https://github.com/slagh49/starupture-colab.git
```

---

## 🔑 Schritt 3 — Die beiden Geheimnisse einrichten

Die Anwendung benötigt **zwei geheime Passwörter**, die Sie selbst wählen:
- eines für die **Datenbank** (`DB_PASSWORD`),
- eines, um die **Verbindungen abzusichern** (`APP_AUTH_SECRET`).

> ⚠️ **Wichtig**: Die Anwendung **verweigert den Start**, wenn `APP_AUTH_SECRET` nicht gesetzt ist.
> Das ist Absicht und dient Ihrer Sicherheit.

### 3.1 — Den richtigen Ordner öffnen

Wechseln Sie in Ihrem Terminal in den Unterordner `infra` der Anwendung.
Passen Sie den Pfad an den Ort an, an dem Sie das Projekt entpackt haben:

```bash
cd Downloads/starupture-colab/infra
```

> 💡 `cd` bedeutet „change directory" (Verzeichnis wechseln). Unter Windows können Sie auch den Ordner `infra` im
> Datei-Explorer öffnen, in die Adresszeile klicken, `powershell` eingeben und Enter drücken: Es öffnet sich ein Terminal
> direkt am richtigen Ort.

### 3.2 — Die Konfigurationsdatei erstellen

Wir erstellen nun eine kleine Datei namens `.env`, die die beiden Geheimnisse enthält.

**Unter macOS / Linux** kopieren Sie diesen Block auf einmal hinein (er erzeugt von selbst ein zufälliges Geheimnis):

```bash
cat > .env <<EOF
DB_PASSWORD=change-this-password
APP_AUTH_SECRET=$(openssl rand -base64 48)
EOF
```

**Unter Windows (PowerShell)** kopieren Sie diesen Block hinein:

```powershell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
"DB_PASSWORD=change-this-password`nAPP_AUTH_SECRET=$secret" | Out-File -Encoding ascii .env
```

> Ersetzen Sie `change-this-password` durch ein Passwort Ihrer Wahl für die Datenbank
> (eine beliebige Folge aus Buchstaben/Ziffern, ohne Leerzeichen). Sie müssen es sich im Alltag nicht merken.

### 3.3 — Überprüfen (optional)

Um zu prüfen, ob die Datei korrekt ist:

```bash
cat .env
```

Sie sollten **zwei Zeilen** sehen: `DB_PASSWORD=...` und `APP_AUTH_SECRET=...` (mit einer langen
Zeichenfolge nach dem `=`).

---

## ▶️ Schritt 4 — Die Anwendung starten

Führen Sie immer noch im Ordner `infra` **diesen einzigen Befehl** aus:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

> **Was bewirkt dieser Befehl?**
> - `up`: startet die Anwendung.
> - `--build`: baut die Anwendung aus dem Quellcode (**nur beim ersten Mal**; das
>   kann **5 bis 15 Minuten** dauern — das ist normal, Docker lädt und kompiliert alles herunter).
> - `-d`: lässt die Anwendung im Hintergrund laufen.

Warten Sie, bis der Befehl fertig ist und Ihnen die Eingabe wieder überlässt. Es wird viel Text durchlaufen:
das ist normal.

---

## 🌍 Schritt 5 — Die Anwendung öffnen

1. Öffnen Sie Ihren Webbrowser (Chrome, Firefox, Edge …).
2. Rufen Sie die Adresse auf: **http://localhost:8888**

   > Wenn Sie die Anwendung auf **einem anderen Computer/Server** installiert haben, ersetzen Sie `localhost`
   > durch die Adresse dieser Maschine (z. B. `http://192.168.1.50:8888`).

3. Eine **Anmeldeseite** erscheint. 🌐 Oben rechts können Sie **die Sprache ändern**
   (Englisch, Französisch, Deutsch, Spanisch, Polnisch).

### Erste Anmeldung

- **Benutzername:** `admin`
- **Passwort:** `admin`

> 🔒 **TUN SIE DIES SOFORT**: Gehen Sie nach der Anmeldung in den Reiter **Administration**,
> in den Bereich **Users**, und **ändern Sie das Passwort des `admin`-Kontos**. Das standardmäßige
> Passwort `admin`/`admin` ist nicht sicher.

🎉 **Die Installation ist abgeschlossen!** Sie können jetzt über den Import-Button einen Spielstand `.sav` importieren
oder den automatischen Import einrichten (siehe unten).

---

## 📂 Schritt 6 (optional) — Automatischer Import von Ihrem Spielserver

Wenn Ihr StarRupture-Server gehostet wird (z. B. bei einem Game-Server-Anbieter),
kann die Anwendung den Spielstand selbst abrufen:

1. Melden Sie sich an und gehen Sie in den Reiter **Administration**.
2. Tragen Sie die FTP-Daten Ihres Hosts ein (Host, Benutzername, Passwort, Pfad).
3. Klicken Sie auf **Test the connection** und dann auf **Import now**.
4. Aktivieren Sie den **automatischen Import**, damit er sich im gewünschten Intervall wiederholt.

> Die Einzelheiten zu diesen Optionen werden direkt in der Oberfläche erklärt.

---

## 🔄 Die Anwendung aktualisieren (später)

Wenn eine neue Version verfügbar ist:

1. Laden Sie das Projekt erneut herunter (Schritt 2) und legen Sie es **über** den alten Ordner, oder führen Sie `git pull` aus, falls
   Sie `git` verwendet haben.
2. Führen Sie im Ordner `infra` erneut aus:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Ihre Daten (importierte Spielstände, Konten, TODO-Board) bleiben **erhalten**.

---

## ⏹️ Die Anwendung stoppen / neu starten

Im Ordner `infra`:

```bash
# Stoppen (Daten bleiben erhalten)
docker compose down

# Neu starten (nach einem bereits gebauten ersten Start)
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d
```

> ⚠️ **Verwenden Sie niemals** `docker compose down -v`: Die Option `-v` **löscht die Datenbank**
> (alle Ihre Daten gingen verloren).

---

## 🆘 Fehlerbehebung

| Symptom | Lösung |
|---|---|
| `docker: command not found` | Docker ist nicht installiert oder nicht gestartet. Wiederholen Sie **Schritt 1** und starten Sie Docker Desktop. |
| Die Seite `http://localhost:8888` öffnet sich nicht | Warten Sie 1–2 Minuten nach dem Start (der Server braucht etwas Zeit zum Hochfahren). Stellen Sie sicher, dass Docker Desktop läuft. |
| „port is already allocated" | Ein anderes Programm verwendet den Port 8888. Schließen Sie es, oder bitten Sie um Hilfe, um den Port zu ändern. |
| Das Backend startet in einer Endlosschleife neu | Prüfen Sie, ob die Datei `.env` tatsächlich **`APP_AUTH_SECRET=`** gefolgt von einem langen Wert enthält (Schritt 3). |
| Sehen, was passiert (Fehlermeldungen) | Geben Sie in `infra` ein: `docker compose logs -f` (Strg+C, um die Anzeige zu beenden). |
| Alles zurücksetzen (⚠️ löscht Daten) | `docker compose down -v`, dann Schritt 4 wiederholen. |

---

## 📖 Kleines Glossar

- **Terminal / PowerShell**: ein Fenster, in dem Sie Befehle über die Tastatur eingeben.
- **Docker**: die Software, die die Anwendung in einer gebrauchsfertigen „Box" laufen lässt.
- **`.env`**: eine Textdatei, die Ihre Geheimnisse (Passwörter) enthält.
- **`localhost`**: ein Wort, das „genau diesen Computer" bedeutet.
- **Port `8888`**: die „Eingangstür", über die Sie die Anwendung im Browser erreichen.

---

Brauchen Sie Hilfe? Eröffnen Sie ein *Issue* auf der GitHub-Seite des Projekts:
**https://github.com/slagh49/starupture-colab/issues**
