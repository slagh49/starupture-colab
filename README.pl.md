# StarRupture Base Scanner

🌍 [English](README.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · **Polski**

Pełnoprawna aplikacja webowa (full-stack) do wizualizacji i analizy plików zapisu gry **StarRupture** (Early Access, Creepy Jar).

Wgraj plik `.sav` i eksploruj swoją bazę przemysłową na Arcadia-7: interaktywna mapa 2D, animowane przepływy dronów, tabela produkcji, alerty o infekcji.

## Przegląd

### Mapa interaktywna

![Mapa interaktywna](docs/screenshots/carte-interactive.png)

Wizualizacja bazy w 2D: proceduralny teren, maszyny, przepływy dronów, szyny, strefy infekcji i znaczniki. Filtruj według kategorii oraz według przepływu zasobów.

### Tablica TODO (kanban)

![Tablica TODO](docs/screenshots/todo-kanban.png)

Wspólna organizacja zadań w kolumnach (budowa, postęp) z priorytetami i osobami przypisanymi.

### Administracja

![Administracja](docs/screenshots/administration.png)

Automatyczny import plików zapisu przez FTP (brama Web-FTP lub bezpośredni FTP) oraz zarządzanie użytkownikami.

## Szybki start

> 🧑‍🏫 **Dopiero zaczynasz?** Skorzystaj z **[przewodnika instalacji krok po kroku](docs/INSTALLATION.md)** —
> przeznaczony dla osób nietechnicznych, wymaga jedynie Dockera (bez wiedzy technicznej).

### Prosta instalacja (ze źródeł, tylko Docker)

```bash
cd infra
# Create a .env file with DB_PASSWORD and APP_AUTH_SECRET (see the installation guide),
# then build and start:
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Aplikacja jest następnie dostępna pod adresem **http://localhost:8888** (admin / admin przy pierwszym uruchomieniu).

### Wymagania wstępne (deweloperskie)
- Docker i Docker Compose
- Java 21 + Maven 3.9 (rozwój backendu)
- Node.js 20 (rozwój frontendu)

### Rozwój lokalny

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (requires PostgreSQL + Redis)
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Produkcja (Docker Compose)

```bash
cd infra
DB_PASSWORD=password \
APP_AUTH_SECRET="$(openssl rand -base64 48)" \
DOCKER_IMAGE_BACKEND=registry.example.com/backend:latest \
DOCKER_IMAGE_FRONTEND=registry.example.com/frontend:latest \
docker compose up -d
```

Aplikacja jest dostępna na porcie **8888**.

## Stos technologiczny

| Warstwa | Technologia |
|--------|-------------|
| API backendu | Spring Boot 3.4 / Java 21 |
| Frontend | React 18 / TypeScript 5 / Vite 5 |
| Mapa | Natywny Canvas 2D (proceduralny teren fbm) |
| Baza danych | PostgreSQL 16 |
| Cache | Redis 7 |
| Reverse proxy | Nginx |
| Konteneryzacja | Docker Compose |
| CI/CD | Self-hosted GitLab CE |

## Architektura

```
                    ┌─────────────┐
                    │   Nginx     │ :8888
                    │  (frontend) │
                    └──────┬──────┘
                           │ /api/*
                    ┌──────▼──────┐
                    │  Spring Boot│ :8080
                    │  (backend)  │
                    └──┬──────┬───┘
                       │      │
              ┌────────▼┐  ┌──▼─────┐
              │PostgreSQL│  │ Redis  │
              │  :5432   │  │ :6379  │
              └──────────┘  └────────┘
```

## Struktura monorepo

```
starrupture-web/
├── .gitlab-ci.yml          # CI/CD pipeline (build → package → deploy)
├── backend/                # Spring Boot REST API
│   ├── src/main/java/com/starrupture/scanner/
│   │   ├── controller/     # REST endpoints (saves, entities, links, summary)
│   │   ├── service/        # .sav parser (zlib + JSON + regex), EntityService
│   │   ├── entity/         # JPA entities (UUID primary key)
│   │   ├── dto/            # Data transfer objects
│   │   ├── repository/     # Spring Data JPA
│   │   ├── config/         # CORS, Redis cache
│   │   └── exception/      # Global error handling
│   └── src/main/resources/
│       └── db/migration/   # Flyway V1 (schema) → V11 (kanban TODO)
├── frontend/               # React + TypeScript application
│   └── src/
│       ├── components/
│       │   ├── map/        # MapCanvas, TerrainLayer, EntityLayer, DroneLayer, RailLayer
│       │   ├── table/      # ProductionTable, MiniMap, EntityDetail
│       │   └── ui/         # TabBar, Legend, Tooltip, Badge, UploadButton
│       ├── hooks/          # useSaveData, useMapInteraction, useAnimation
│       ├── pages/          # MapPage, ProgressionPage, AdminPage
│       ├── services/       # Typed Axios API
│       ├── constants/      # Colors, map configuration
│       └── types/          # TypeScript DTO types
├── infra/
│   ├── docker-compose.yml  # Services: nginx, backend, postgres, redis
│   └── nginx/nginx.conf
└── docs/
    ├── stories/            # User Stories (SR-001 to SR-012)
    └── PROGRESS.md         # Progress tracking
```

## Funkcje

### Mapa interaktywna (MapPage)
- Proceduralny teren 2D (fbm, obce biomy)
- Encje rozmieszczone z kolorami przypisanymi do kategorii (machine, energy, infra, antenna, danger, loot)
- Zoom kółkiem myszy wycentrowany na kursorze, przesuwanie metodą click-and-drag
- Wizualna informacja zwrotna kursora (otwarta dłoń przy najechaniu na mapę, zamknięta podczas przesuwania, wskaźnik nad encją)
- Podświetlenie przy najechaniu + tooltip, zaznaczenie z panelem szczegółów
- **Przepływy logistyczne** w postaci zakrzywionych łuków kolorowanych według zasobu, z **animowanymi strzałkami kierunkowymi** (kierunek producent → konsument)
- Szyny DroneRail (pomarańczowe) i Walkway (przerywane, cyjanowe)
- Alerty wizualne: pulsujący czerwony pierścień dla infekcji, plakietka OFF
- **Filtrowanie po nazwie**: pokazuje tylko encje, których nazwa pasuje (np. `sulfur-`), we wszystkich kategoriach
- **Warstwa infekcji**: pulsujący czerwony pierścień na każdym zainfekowanym budynku, zawsze widoczny (nawet jeśli jego kategoria jest ukryta), przełączalny jak pozostałe warstwy
- **Warstwa osieroconych (orphans)**: pulsujący różowy pierścień na PackageSender/Receiver bez żadnego połączenia (ani źródła, ani celu), aby wykryć nieskonfigurowane nadajniki
- Przełączalne warstwy: teren, przepływy dronów, szyny, strefy bazy, etykiety, infekcja, osierocone
- Filtry kategorii + pogrupowana lista boczna (kategoria → typ), ograniczona do widocznego obszaru
- Najnowszy zapis jest wczytywany automatycznie przy uruchomieniu

### Automatyczny import (Administracja)

Zakładka **Administracja** do importu pliku `.sav` bezpośrednio z FTP hosta serwera gry, bez ręcznego wgrywania.

- Konfiguracja FTP przechowywana po stronie serwera (host, port, użytkownik, hasło, ścieżka); hasło nigdy nie jest odsyłane do interfejsu
- **Brama HTTP Web-FTP** (zalecana): plik `.sav` jest pobierany przez mostek HTTP hosta (np. `handler.php` od 4Netplayers), który wykonuje FTP po stronie sieci LAN i zwraca plik przez HTTPS. Pozwala to ominąć **pasywny kanał danych FTP**, który po stronie klienta jest często zablokowany, i działa **przy uruchomionym serwerze gry**
- Automatyczne przejście awaryjne na bezpośredni FTP (FTP, następnie FTPS), jeśli adres URL bramy pozostanie pusty
- Import ręczny („Importuj teraz") lub **automatyczny** w konfigurowalnym interwale (`@Scheduled`)
- **Import najnowszego slotu**: jeśli ścieżka FTP wskazuje na **folder** (kończy się na `/` lub nie kończy się na `.sav`), import wylistowuje pliki `.sav` w folderze i pobiera najnowszy według daty modyfikacji. Rozwiązuje to problem rotacji slotów `AutoSave0`/`1`/`2` na serwerze gry (ścieżka wskazująca na stały plik pozostaje wstecznie kompatybilna)
- **Wymaż i zastąp (wipe-and-replace)**: każde wczytanie zapisu (ręczne wgranie **lub** import FTP) najpierw wymazuje istniejące sesje, a następnie wczytuje plik `.sav` na nowo — dzięki czemu aplikacja przechowuje zawsze tylko jeden stan (ostatnio wczytany). Logika współdzielona w `parseSavBytes`, atomowa (`@Transactional`): jeśli parsowanie się nie powiedzie, wymazanie zostaje wycofane
- **Wstawianie wsadowe (batch inserts)**: parsowanie przyspieszone dzięki batchingowi JDBC w Hibernate (`batch_size`, `order_inserts`, `reWriteBatchedInserts`) — niezbędne przy zapisach z dziesiątkami tysięcy encji
- **Zabezpieczenie przed „identycznym zapisem"**: przy imporcie backend porównuje **skrót SHA-256 surowej zawartości** nowego pliku `.sav` z poprzednim. Jeśli się nie zmienił, plik jest identyczny co do bitu — gra nie zapisała nowego stanu (zamrożony plik): w nagłówku pojawia się **baner ostrzegawczy**. Skrót zawartości jest wiarygodny tam, gdzie dawne porównanie `timestamp` + `playtime` błędnie stwierdzało „identyczność", ilekroć te dwa pola akurat się zgadzały (dla starszych sesji bez skrótu następuje powrót do tego porównania). Data wyświetlana w nagłówku to **wewnętrzna data zapisu** (kiedy gra go utworzyła), a nie data wgrania — co ujawnia nieaktualny plik, nawet jeśli jego data pobrania wygląda na świeżą

### Uwierzytelnianie

Aplikacja jest chroniona **ekranem logowania**. Lekkie uwierzytelnianie bez zewnętrznych zależności:

- Hasła haszowane za pomocą **PBKDF2-HMAC-SHA256**, tokeny API **podpisywane HMAC** (bezstanowe, przechowywane po stronie klienta w `localStorage`)
- **Domyślny administrator** (`admin` / `admin`) jest tworzony przy pierwszym uruchomieniu, jeśli nie istnieje żadne konto — **zmień go natychmiast** przez interfejs (konfigurowalny przez `APP_ADMIN_USER`/`APP_ADMIN_PASSWORD`)
- **Administrator** zarządza kontami (tworzenie, ustawianie hasła, usuwanie, rola ADMIN/USER) z poziomu zakładki Administracja
- Każda trasa `/api/**` wymaga ważnego tokenu; `/api/admin/**` wymaga roli ADMIN. Zakładka Administracja jest ukryta dla użytkowników bez uprawnień administratora
- Sekret podpisujący **wymagany** przez `APP_AUTH_SECRET`: aplikacja **odmawia uruchomienia**, jeśli nie jest ustawiony (brak wartości domyślnej, aby uniknąć wspólnego sekretu, który umożliwiłby fałszowanie tokenów). Wygeneruj go za pomocą `openssl rand -base64 48`

### Wspólne znaczniki

**Kliknij prawym przyciskiem myszy** na mapie, aby umieścić **opatrzony adnotacją znacznik** (pinezka z etykietą). Znaczniki są widoczne dla wszystkich graczy, przechowywane w bazie danych i pojawiają się na dedykowanej warstwie (przełączalnej). Lista z możliwością usuwania w pasku bocznym.

### Dziennik (różnice importu)

Zakładka **LOGBOOK**: przy każdym imporcie backend automatycznie porównuje nowy stan z poprzednią migawką i tworzy **podsumowanie zmian**:
- Różnica **czasu gry (Playtime)**, metryki (encje, wyłączone maszyny, pełne wyjścia, infekcje…)
- Wahania **według kategorii encji**
- **Nowo odblokowane receptury**
- **Typy encji**, które się pojawiły lub zniknęły

Różnica jest utrwalana w sesji (`import_diff`) i dostępna do wglądu w dowolnym momencie.

### Tablica TODO (kanban)

Zakładka **TODO**: tablica kanban **współdzielona** przez wszystkich graczy do organizowania projektów bazy.

- **Konfigurowalne kolumny**: tworzenie, zmiana nazwy, usuwanie, **zmiana kolejności metodą przeciągnij i upuść** (uchwyt ⠿ w nagłówku kolumny) — domyślnie To do / In progress / Done
- **Zadania** z tytułem, opisem, **priorytetem** (low/normal/high, kolorowa kropka), **osobą przypisaną** (spośród istniejących kont) oraz **terminem** (podświetlonym, jeśli przekroczony)
- **Przeciąganie i upuszczanie** kart między kolumnami i zmiana ich kolejności (natywne HTML5 drag & drop, bez zależności)
- Każde zadanie pamięta swojego **autora** (bieżącego użytkownika)
- Dane **niezależne od zapisów**: kanban nigdy nie jest wymazywany przez mechanizm wipe-and-replace importu

### Motywy graficzne

Selektor motywu w nagłówku: akcent całego interfejsu dostosowuje się do **tożsamości korporacji ze StarRupture**.

- 6 ciemnych motywów: **Terminal** (cyjan/zielony, domyślny), **Selenian** (pomarańczowy), **Moon Energy** (srebrny/cyjan), **Clever Robotics** (czerwony), **Future Health** (turkusowy), **Griffith Blue** (niebieski) — zmieniają jedynie **akcent**
- 1 motyw **Light**: jasne tła + przyciemniony akcent dla kontrastu — dodatkowo redefiniuje barwy neutralne (tła, obramowania, tekst)
- Zaimplementowane jako **zmienne CSS**: akcent (`--accent`, `--accent-2` + trójki `-rgb`) oraz barwy neutralne (`--bg*`, `--border*`, `--text*`), stosowane przez `[data-theme]` na `<html>`; wybór **utrwalany** w `localStorage`
- Akcent rozciąga się na **mapę**: obrys strefy bazy, przejścia (walkways) i siatka podążają za motywem (renderowanie canvas odczytuje `THEME_ACCENTS`, zsynchronizowane ze zmiennymi CSS)
- **Semantyczne kolory kategorii encji** (mapa) pozostają niezmienione dla czytelności

### Interfejs wielojęzyczny

Cały interfejs jest przetłumaczony na **5 języków**: **angielski** (domyślny), **francuski**, **niemiecki**, **hiszpański**, **polski**.

- Selektor języka (🌐) w nagłówku oraz na stronie logowania
- Zaimplementowany przy użyciu **react-i18next**; pliki tłumaczeń dla poszczególnych języków w `frontend/src/i18n/locales/`
- Wybrany język jest **zapisywany w profilu użytkownika** (po stronie serwera) i ponownie stosowany przy każdym logowaniu, a dodatkowo zapamiętywany w `localStorage`
- **Dane gry** (nazwy encji, receptury) oraz **nazwy własne** (korporacje) nie są tłumaczone

### REST API

> Wszystkie trasy `/api/**` (z wyjątkiem `/api/auth/login`) wymagają nagłówka `Authorization: Bearer <token>`.

| Metoda | Endpoint | Opis |
|---------|----------------|-------------|
| POST | `/api/auth/login` | Logowanie → podpisany token (publiczny) |
| GET | `/api/auth/me` | Bieżący użytkownik (nazwa, rola, język) |
| PUT | `/api/auth/me/language` | Zmiana języka bieżącego użytkownika |
| GET / POST | `/api/admin/users` | Lista / tworzenie użytkowników (ADMIN) |
| PUT | `/api/admin/users/{id}/password` | Ustawienie hasła (ADMIN) |
| DELETE | `/api/admin/users/{id}` | Usunięcie użytkownika (ADMIN) |

| Metoda | Endpoint | Opis |
|---------|----------------|-------------|
| POST | `/api/saves` | Wgranie i sparsowanie pliku `.sav` |
| GET | `/api/saves` | Lista sesji |
| DELETE | `/api/saves/{id}` | Usunięcie sesji |
| GET | `/api/saves/{id}/entities` | Encje (filtrowalne przez `?cat=`) |
| GET | `/api/saves/{id}/links` | Przepływy dronów |
| GET | `/api/saves/{id}/splines` | Szyny i splajny |
| GET | `/api/saves/{id}/zones` | Strefy bazy (bounding boxy) |
| GET | `/api/saves/{id}/summary` | Zagregowane statystyki |
| GET | `/api/saves/{id}/progression` | Korporacje, odblokowane/zablokowane plany + zebrane przedmioty |
| GET / PUT | `/api/admin/config` | Odczyt / zapis konfiguracji importu FTP |
| POST | `/api/admin/test` | Test połączenia (brama HTTP lub FTP) |
| POST | `/api/admin/import` | Natychmiastowy import pliku `.sav` z FTP/bramy |

| Metoda | Endpoint | Opis |
|---------|----------------|-------------|
| GET | `/api/kanban/board` | Pełna tablica kanban (kolumny + zadania) |
| GET | `/api/kanban/users` | Lista użytkowników (do przypisywania) |
| POST / PUT / DELETE | `/api/kanban/columns[/{id}]` | Tworzenie / zmiana nazwy / usuwanie kolumny |
| POST / PUT / DELETE | `/api/kanban/tasks[/{id}]` | Tworzenie / edycja / usuwanie zadania |
| PUT | `/api/kanban/tasks/{id}/move` | Przeniesienie zadania (kolumna + pozycja) |

## Pipeline CI/CD

```
build (backend JAR + frontend dist)
  → package (Docker images → GitLab Container Registry)
    → deploy (scp compose/nginx + docker compose pull/up on the server)
```

- **main** → **automatyczne** wdrożenie produkcyjne (bezpośrednia dostawa, bez zatwierdzania)
- Pojedynczy przepływ `main → prod`: brak gałęzi `develop`/staging

## Postęp

| Sprint | Punkty | Status |
|--------|--------|--------|
| S1 — Fundamenty (upload, parser, mapa, zoom) | 26 | Ukończony |
| S2 — Zaawansowana wizualizacja (drony, szyny, tabela, minimapa, alerty) | 24 | Ukończony |
| S3 — Filtry i CI/CD | 11 | Ukończony |
| **Łącznie** | **61** | Ukończony |

## Licencja

Rozpowszechniane na licencji **MIT** — zobacz plik [LICENSE](LICENSE). Możesz swobodnie
używać, modyfikować i redystrybuować ten kod, również w celach komercyjnych,
pod warunkiem zachowania noty o prawach autorskich.
