# 🚀 Przewodnik instalacji — StarRupture Base Scanner

🌍 [English](INSTALLATION.md) · [Français](INSTALLATION.fr.md) · [Deutsch](INSTALLATION.de.md) · [Español](INSTALLATION.es.md) · **Polski**

> **Dla kogo jest ten przewodnik?** Ten przewodnik jest przeznaczony dla osób, **które nigdy wcześniej nie instalowały aplikacji tego rodzaju**.
> Nie jest wymagana żadna wcześniejsza wiedza techniczna. Wyjaśniamy **każdy krok** i **każde polecenie**.
>
> **Szacowany czas:** od 20 do 40 minut (w zależności od szybkości Twojego łącza).

---

## 📋 Co uzyskasz

Po przejściu tego przewodnika będziesz mieć aplikację **StarRupture Base Scanner** uruchomioną na swoim
komputerze (lub serwerze), dostępną z poziomu przeglądarki internetowej. Będziesz mógł importować swoje
zapisy gry i wizualizować swoją bazę.

---

## 🧰 Krok 0 — Czego potrzebujesz

| | Szczegóły |
|---|---|
| 💻 Komputer | Windows 10/11, macOS lub Linux |
| 💾 Wolne miejsce | Około **5 GB** |
| 🌐 Połączenie z Internetem | Aby pobrać aplikację za pierwszym razem |
| 🐳 Oprogramowanie **Docker** | Instalujemy je w Kroku 1 (jest darmowe) |

> **Czym jest Docker?** Wyobraź sobie „pudełko", które zawiera już wszystko, czego aplikacja potrzebuje do
> działania (serwer, bazę danych…). **Nie musisz instalować niczego więcej**: Docker zajmuje się wszystkim.
> To najprostsza i najbardziej niezawodna metoda.

---

## 🐳 Krok 1 — Zainstaluj Docker

### W systemie Windows lub macOS

1. Przejdź na stronę **https://www.docker.com/products/docker-desktop/**
2. Kliknij **Download** i wybierz swój system (Windows lub Mac).
3. Otwórz pobrany plik i wykonaj instalację (klikaj „Next" / „Install").
4. **Uruchom ponownie komputer**, jeśli pojawi się taka prośba.
5. Uruchom **Docker Desktop** (ikona wieloryba 🐳). Poczekaj, aż ikona na dole pokaże
   „Docker Desktop is running".

> 💡 W systemie Windows, jeśli pojawi się komunikat o „WSL 2", pozwól Dockerowi zainstalować go automatycznie
> (kliknij sugerowany link, a następnie spróbuj ponownie).

### W systemie Linux (Ubuntu/Debian)

Otwórz terminal i skopiuj-wklej te polecenia jedno po drugim:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Następnie **wyloguj się i zaloguj ponownie** (lub uruchom ponownie komputer), aby druga zmiana zaczęła obowiązywać.

### Sprawdź, czy Docker działa

Otwórz **terminal**:
- **Windows**: menu Start → wpisz `PowerShell` → Enter.
- **macOS**: Aplikacje → Narzędzia → **Terminal**.
- **Linux**: Twój zwykły terminal.

Wpisz to polecenie, a następnie naciśnij Enter:

```bash
docker --version
```

Jeśli zobaczysz linię w stylu `Docker version 27.x.x`, wszystko jest w porządku ✅. W przeciwnym razie powtórz Krok 1.

---

## 📥 Krok 2 — Pobierz aplikację

### Prosta metoda (bez instalowania niczego dodatkowego)

1. Przejdź na stronę projektu: **https://github.com/slagh49/starupture-colab**
2. Kliknij zielony przycisk **`< > Code`**, a następnie **Download ZIP**.
3. Po pobraniu pliku `.zip` **rozpakuj go** (kliknij prawym przyciskiem myszy → „Wyodrębnij wszystko").
4. Otrzymasz folder o nazwie `starupture-colab` (lub podobnej). **Zapamiętaj, gdzie się znajduje**
   (na przykład w folderze pobierania).

### Metoda alternatywna (jeśli znasz `git`)

```bash
git clone https://github.com/slagh49/starupture-colab.git
```

---

## 🔑 Krok 3 — Skonfiguruj dwa sekrety

Aplikacja potrzebuje **dwóch tajnych haseł**, które wybierasz samodzielnie:
- jedno dla **bazy danych** (`DB_PASSWORD`),
- jedno do **zabezpieczenia połączeń** (`APP_AUTH_SECRET`).

> ⚠️ **Ważne**: aplikacja **odmówi uruchomienia**, jeśli `APP_AUTH_SECRET` nie jest ustawione.
> Jest to celowe, dla Twojego bezpieczeństwa.

### 3.1 — Otwórz właściwy folder

W terminalu przejdź do podfolderu `infra` aplikacji.
Dostosuj ścieżkę do miejsca, w którym rozpakowałeś projekt:

```bash
cd Downloads/starupture-colab/infra
```

> 💡 `cd` oznacza „zmień katalog" (change directory). W systemie Windows możesz również otworzyć folder `infra` w
> eksploratorze plików, kliknąć w pasku adresu, wpisać `powershell` i nacisnąć Enter: terminal
> otworzy się od razu we właściwym miejscu.

### 3.2 — Utwórz plik konfiguracyjny

Utworzymy mały plik o nazwie `.env`, który będzie przechowywać dwa sekrety.

**W systemie macOS / Linux** skopiuj-wklej cały ten blok naraz (generuje on losowy sekret samodzielnie):

```bash
cat > .env <<EOF
DB_PASSWORD=change-this-password
APP_AUTH_SECRET=$(openssl rand -base64 48)
EOF
```

**W systemie Windows (PowerShell)** skopiuj-wklej ten blok:

```powershell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
"DB_PASSWORD=change-this-password`nAPP_AUTH_SECRET=$secret" | Out-File -Encoding ascii .env
```

> Zastąp `change-this-password` hasłem swojego wyboru do bazy danych
> (dowolny ciąg liter/cyfr, bez spacji). Nie będziesz musiał go pamiętać na co dzień.

### 3.3 — Sprawdź (opcjonalnie)

Aby sprawdzić, czy plik jest poprawny:

```bash
cat .env
```

Powinieneś zobaczyć **dwie linie**: `DB_PASSWORD=...` oraz `APP_AUTH_SECRET=...` (z długim
ciągiem znaków po znaku `=`).

---

## ▶️ Krok 4 — Uruchom aplikację

Wciąż w folderze `infra` wykonaj **to jedno polecenie**:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

> **Co robi to polecenie?**
> - `up`: uruchamia aplikację.
> - `--build`: buduje aplikację z kodu źródłowego (**tylko za pierwszym razem**, może to
>   zająć **od 5 do 15 minut** — to normalne, Docker pobiera i kompiluje wszystko).
> - `-d`: pozostawia aplikację działającą w tle.

Poczekaj, aż polecenie zakończy działanie i odda Ci kontrolę. Zobaczysz dużo przewijającego się tekstu:
to normalne.

---

## 🌍 Krok 5 — Otwórz aplikację

1. Otwórz przeglądarkę internetową (Chrome, Firefox, Edge…).
2. Przejdź pod adres: **http://localhost:8888**

   > Jeśli zainstalowałeś aplikację na **innym komputerze/serwerze**, zastąp `localhost`
   > adresem tej maszyny (np. `http://192.168.1.50:8888`).

3. Pojawi się strona **logowania**. 🌐 Możesz **zmienić język** w prawym górnym rogu
   (angielski, francuski, niemiecki, hiszpański, polski).

### Pierwsze logowanie

- **Nazwa użytkownika:** `admin`
- **Hasło:** `admin`

> 🔒 **ZRÓB TO NATYCHMIAST**: po zalogowaniu przejdź do zakładki **Administration**,
> sekcji **Users**, i **zmień hasło konta `admin`**. Domyślne
> hasło `admin`/`admin` nie jest bezpieczne.

🎉 **Zainstalowane!** Możesz teraz zaimportować zapis `.sav` za pomocą przycisku importu
lub skonfigurować import automatyczny (patrz poniżej).

---

## 📂 Krok 6 (opcjonalnie) — Automatyczny import z Twojego serwera gry

Jeśli Twój serwer StarRupture jest hostowany (np. u dostawcy hostingu serwerów gier),
aplikacja może sama pobrać zapis:

1. Zaloguj się, przejdź do zakładki **Administration**.
2. Wypełnij dane FTP swojego hosta (host, nazwa użytkownika, hasło, ścieżka).
3. Kliknij **Test the connection**, a następnie **Import now**.
4. Włącz **import automatyczny**, aby powtarzał się w wybranym odstępie czasu.

> Szczegóły tych opcji są wyjaśnione bezpośrednio w interfejsie.

---

## 🔄 Aktualizacja aplikacji (później)

Gdy dostępna jest nowa wersja:

1. Pobierz ponownie projekt (Krok 2) **na miejsce** starego folderu lub uruchom `git pull`, jeśli
   korzystałeś z `git`.
2. W folderze `infra` uruchom ponownie:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Twoje dane (zaimportowane zapisy, konta, tablica TODO) zostaną **zachowane**.

---

## ⏹️ Zatrzymanie / ponowne uruchomienie aplikacji

W folderze `infra`:

```bash
# Zatrzymanie (dane są zachowane)
docker compose down

# Ponowne uruchomienie (po już zbudowanym pierwszym uruchomieniu)
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d
```

> ⚠️ **Nigdy nie używaj** `docker compose down -v`: opcja `-v` **kasuje bazę danych**
> (wszystkie Twoje dane zostałyby utracone).

---

## 🆘 Rozwiązywanie problemów

| Objaw | Rozwiązanie |
|---|---|
| `docker: command not found` | Docker nie jest zainstalowany lub nie jest uruchomiony. Powtórz **Krok 1** i uruchom Docker Desktop. |
| Strona `http://localhost:8888` nie chce się otworzyć | Poczekaj 1-2 minuty po uruchomieniu (serwer potrzebuje chwili na start). Upewnij się, że Docker Desktop jest uruchomiony. |
| „port is already allocated" | Inny program używa portu 8888. Zamknij go lub poproś o pomoc w zmianie portu. |
| Backend uruchamia się w pętli | Sprawdź, czy plik `.env` zawiera **`APP_AUTH_SECRET=`** wraz z długą wartością (Krok 3). |
| Zobacz, co się dzieje (komunikaty o błędach) | W folderze `infra` wpisz: `docker compose logs -f` (Ctrl+C, aby zamknąć podgląd). |
| Zresetuj wszystko (⚠️ kasuje dane) | `docker compose down -v`, a następnie powtórz Krok 4. |

---

## 📖 Krótki słowniczek

- **Terminal / PowerShell**: okno, w którym wpisujesz polecenia na klawiaturze.
- **Docker**: oprogramowanie, które uruchamia aplikację w gotowym do użycia „pudełku".
- **`.env`**: plik tekstowy przechowujący Twoje sekrety (hasła).
- **`localhost`**: słowo oznaczające „ten właśnie komputer".
- **Port `8888`**: „drzwi wejściowe", przez które docierasz do aplikacji w przeglądarce.

---

Potrzebujesz pomocy? Otwórz *issue* na stronie projektu w serwisie GitHub:
**https://github.com/slagh49/starupture-colab/issues**
