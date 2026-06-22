# StarRupture Base Scanner

🌍 [English](README.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Español** · [Polski](README.pl.md)

Una aplicación web full-stack para visualizar y analizar archivos de guardado del juego **StarRupture** (Early Access, Creepy Jar).

Sube un archivo `.sav` y explora tu base industrial en Arcadia-7: mapa 2D interactivo, flujos de drones animados, tabla de producción, alertas de infección.

## Visión general

### Mapa interactivo

![Mapa interactivo](docs/screenshots/carte-interactive.png)

Visualización 2D de la base: terreno procedural, máquinas, flujos de drones, raíles, zonas de infección y marcadores. Filtra por categoría y por flujo de recursos.

### Tablero TODO (kanban)

![Tablero TODO](docs/screenshots/todo-kanban.png)

Organización colaborativa de tareas en columnas (construcción, progresión) con prioridades y responsables.

### Administración

![Administración](docs/screenshots/administration.png)

Importación FTP automática de archivos de guardado (pasarela Web-FTP o FTP directo) y gestión de usuarios.

## Inicio rápido

> 🧑‍🏫 **¿Es la primera vez?** Sigue la **[guía de instalación paso a paso](docs/INSTALLATION.es.md)** —
> diseñada para usuarios no técnicos, solo requiere Docker (no se necesitan conocimientos técnicos).

### Instalación sencilla (desde el código fuente, solo con Docker)

```bash
cd infra
# Crea un archivo .env con DB_PASSWORD y APP_AUTH_SECRET (consulta la guía de instalación),
# luego compila e inicia:
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

La aplicación queda disponible en **http://localhost:8888** (admin / admin en el primer arranque).

### Requisitos previos (desarrollo)
- Docker y Docker Compose
- Java 21 + Maven 3.9 (desarrollo del backend)
- Node.js 20 (desarrollo del frontend)

### Desarrollo local

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (requiere PostgreSQL + Redis)
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Producción (Docker Compose)

```bash
cd infra
DB_PASSWORD=password \
APP_AUTH_SECRET="$(openssl rand -base64 48)" \
DOCKER_IMAGE_BACKEND=registry.example.com/backend:latest \
DOCKER_IMAGE_FRONTEND=registry.example.com/frontend:latest \
docker compose up -d
```

La aplicación queda disponible en el puerto **8888**.

## Stack tecnológico

| Capa | Tecnología |
|--------|-------------|
| API backend | Spring Boot 3.4 / Java 21 |
| Frontend | React 18 / TypeScript 5 / Vite 5 |
| Mapa | Canvas 2D nativo (terreno procedural fbm) |
| Base de datos | PostgreSQL 16 |
| Caché | Redis 7 |
| Proxy inverso | Nginx |
| Contenedorización | Docker Compose |
| CI/CD | GitLab CE autoalojado |

## Arquitectura

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

## Estructura del monorepo

```
starrupture-web/
├── .gitlab-ci.yml          # Pipeline CI/CD (build → package → deploy)
├── backend/                # API REST Spring Boot
│   ├── src/main/java/com/starrupture/scanner/
│   │   ├── controller/     # Endpoints REST (saves, entities, links, summary)
│   │   ├── service/        # Parser .sav (zlib + JSON + regex), EntityService
│   │   ├── entity/         # Entidades JPA (clave primaria UUID)
│   │   ├── dto/            # Objetos de transferencia de datos
│   │   ├── repository/     # Spring Data JPA
│   │   ├── config/         # CORS, caché Redis
│   │   └── exception/      # Manejo global de errores
│   └── src/main/resources/
│       └── db/migration/   # Flyway V1 (esquema) → V11 (TODO kanban)
├── frontend/               # Aplicación React + TypeScript
│   └── src/
│       ├── components/
│       │   ├── map/        # MapCanvas, TerrainLayer, EntityLayer, DroneLayer, RailLayer
│       │   ├── table/      # ProductionTable, MiniMap, EntityDetail
│       │   └── ui/         # TabBar, Legend, Tooltip, Badge, UploadButton
│       ├── hooks/          # useSaveData, useMapInteraction, useAnimation
│       ├── pages/          # MapPage, ProgressionPage, AdminPage
│       ├── services/       # API Axios tipada
│       ├── constants/      # Colores, configuración del mapa
│       └── types/          # Tipos DTO de TypeScript
├── infra/
│   ├── docker-compose.yml  # Servicios: nginx, backend, postgres, redis
│   └── nginx/nginx.conf
└── docs/
    ├── stories/            # User Stories (SR-001 a SR-012)
    └── PROGRESS.md         # Seguimiento del progreso
```

## Funcionalidades

### Mapa interactivo (MapPage)
- Terreno 2D procedural (fbm, biomas alienígenas)
- Entidades posicionadas con colores por categoría (machine, energy, infra, antenna, danger, loot)
- Zoom con la rueda del ratón centrado en el cursor, desplazamiento mediante clic y arrastre
- Retroalimentación visual del cursor (mano abierta al pasar por el mapa, cerrada al desplazarse, puntero sobre una entidad)
- Resaltado al pasar el ratón + tooltip, selección con panel de detalle
- **Flujos logísticos** como arcos curvos coloreados según el recurso, con **flechas direccionales animadas** (sentido productor → consumidor)
- Raíles DroneRail (naranja) y Walkway (cian discontinuo)
- Alertas visuales: anillo rojo pulsante para infección, distintivo OFF
- **Filtrado por nombre**: muestra únicamente las entidades cuyo nombre coincide (p. ej. `sulfur-`), en todas las categorías
- **Capa de infección**: anillo rojo pulsante sobre cada edificio infectado, siempre visible (incluso si su categoría está oculta), conmutable como las demás capas
- **Capa de huérfanos**: anillo magenta pulsante sobre los PackageSender/Receiver sin ningún enlace (ni origen ni destino), para detectar transmisores sin configurar
- Capas conmutables: terreno, flujos de drones, raíles, zonas base, etiquetas, infección, huérfanos
- Filtros por categoría + lista lateral agrupada (categoría → tipo), limitada al área visible
- El guardado más reciente se carga automáticamente al iniciar

### Importación automática (Administración)

Pestaña **Administración** para importar el `.sav` directamente desde el FTP del servidor que aloja el juego, sin subida manual.

- Configuración FTP almacenada en el servidor (host, puerto, usuario, contraseña, ruta); la contraseña nunca se devuelve a la interfaz
- **Pasarela HTTP Web-FTP** (recomendada): el `.sav` se descarga a través del puente HTTP del host (p. ej. el `handler.php` de 4Netplayers), que realiza el FTP del lado de la LAN y devuelve el archivo por HTTPS. Esto evita el **canal de datos FTP pasivo**, a menudo bloqueado del lado del cliente, y funciona **con el servidor del juego en marcha**
- Recurso automático al FTP directo (FTP y luego FTPS) si se deja vacía la URL de la pasarela
- Importación manual ("Importar ahora") o **automática** a un intervalo configurable (`@Scheduled`)
- **Importar el slot más reciente**: si la ruta FTP apunta a una **carpeta** (termina en `/` o no termina en `.sav`), la importación lista los archivos `.sav` de la carpeta y descarga el más reciente por fecha de modificación. Esto resuelve el problema de rotación de slots `AutoSave0`/`1`/`2` en el servidor del juego (una ruta que apunta a un archivo fijo sigue siendo retrocompatible)
- **Borrar y reemplazar**: cualquier carga de guardado (subida manual **o** importación FTP) primero borra las sesiones existentes y luego recarga el `.sav` desde cero — de modo que la aplicación solo conserva un único estado (el último cargado). Lógica compartida en `parseSavBytes`, atómica (`@Transactional`): si el análisis falla, el borrado se revierte
- **Inserciones por lotes**: análisis acelerado mediante el batching JDBC de Hibernate (`batch_size`, `order_inserts`, `reWriteBatchedInserts`) — esencial para guardados con decenas de miles de entidades
- **Salvaguarda de "guardado idéntico"**: en cada importación, el backend compara el **hash SHA-256 del contenido en bruto** del nuevo `.sav` con el anterior. Si no ha cambiado, el archivo es idéntico hasta el bit — el juego no escribió ningún guardado nuevo (archivo congelado): aparece un **banner de advertencia** en la cabecera. El hash de contenido es fiable allí donde la antigua comparación de `timestamp` + `playtime` concluía erróneamente "idéntico" siempre que esos dos campos coincidían por casualidad (recurre a esa comparación para las sesiones heredadas sin hash). La fecha mostrada en la cabecera es la **fecha interna del guardado** (cuando el juego lo escribió), no la fecha de subida — lo que revela un archivo obsoleto aunque su fecha de descarga parezca reciente

### Autenticación

La aplicación está protegida por una **pantalla de inicio de sesión**. Autenticación ligera y sin dependencias externas:

- Contraseñas cifradas con **PBKDF2-HMAC-SHA256**, tokens de API **firmados con HMAC** (sin estado, almacenados en el cliente en `localStorage`)
- Se crea un **administrador por defecto** (`admin` / `admin`) en el primer arranque si no existe ninguna cuenta — **cámbialo de inmediato** desde la interfaz (configurable mediante `APP_ADMIN_USER`/`APP_ADMIN_PASSWORD`)
- El **administrador** gestiona las cuentas (creación, asignación de contraseña, eliminación, rol ADMIN/USER) desde la pestaña Administración
- Cada ruta `/api/**` requiere un token válido; `/api/admin/**` requiere el rol ADMIN. La pestaña Administración se oculta para los usuarios no administradores
- Secreto de firma **obligatorio** mediante `APP_AUTH_SECRET`: la aplicación **se niega a arrancar** si no está definido (sin valor por defecto, para evitar un secreto compartido que permitiría falsificar tokens). Genera uno con `openssl rand -base64 48`

### Marcadores colaborativos

**Clic derecho** en el mapa para colocar un **marcador anotado** (chincheta con una etiqueta). Los marcadores son visibles para todos los jugadores, se almacenan en la base de datos y aparecen en una capa dedicada (conmutable). Lista con eliminación en la barra lateral.

### Bitácora (diff de importación)

Pestaña **LOGBOOK**: en cada importación, el backend compara automáticamente el nuevo estado con la instantánea anterior y produce un **resumen de los cambios**:
- Delta de **tiempo de juego**, métricas (entidades, máquinas apagadas, salidas saturadas, infecciones…)
- Variaciones **por categoría de entidad**
- **Recetas recién desbloqueadas**
- **Tipos de entidad** que aparecieron o desaparecieron

El diff se persiste en la sesión (`import_diff`) y puede consultarse en cualquier momento.

### Tablero TODO (kanban)

Pestaña **TODO**: un tablero kanban **compartido** entre todos los jugadores para organizar los proyectos de la base.

- **Columnas personalizables**: crear, renombrar, eliminar, **reordenar mediante arrastrar y soltar** (asa ⠿ en la cabecera de la columna) — To do / In progress / Done por defecto
- **Tareas** con título, descripción, **prioridad** (low/normal/high, punto de color), **responsable** (entre las cuentas existentes) y **fecha límite** (resaltada si está vencida)
- **Arrastrar y soltar** tarjetas entre columnas y reordenarlas (drag & drop nativo de HTML5, sin dependencias)
- Cada tarea recuerda a su **autor** (el usuario actual)
- Datos **independientes de los guardados**: el kanban nunca se borra con el borrar-y-reemplazar de la importación

### Temas gráficos

Selector de temas en la cabecera: el acento de toda la interfaz se adapta a la **identidad de una corporación de StarRupture**.

- 6 temas oscuros: **Terminal** (cian/verde, por defecto), **Selenian** (naranja), **Moon Energy** (plateado/cian), **Clever Robotics** (rojo), **Future Health** (turquesa), **Griffith Blue** (azul) — solo cambian el **acento**
- 1 tema **Light** (claro): fondos claros + acento oscurecido para el contraste — además redefine los neutros (fondos, bordes, texto)
- Implementado como **variables CSS**: acento (`--accent`, `--accent-2` + tripletas `-rgb`) y neutros (`--bg*`, `--border*`, `--text*`), aplicados mediante `[data-theme]` en `<html>`; la elección se **persiste** en `localStorage`
- El acento se extiende al **mapa**: el contorno de las zonas base, las pasarelas y la cuadrícula siguen el tema (el renderizado del canvas lee `THEME_ACCENTS`, sincronizado con las variables CSS)
- Los **colores semánticos de las categorías de entidades** (mapa) permanecen sin cambios por legibilidad

### Interfaz multilingüe

Toda la interfaz está traducida a **5 idiomas**: **inglés** (por defecto), **francés**, **alemán**, **español**, **polaco**.

- Selector de idioma (🌐) en la cabecera y en la página de inicio de sesión
- Implementado con **react-i18next**; archivos de traducción por idioma en `frontend/src/i18n/locales/`
- El idioma elegido se **guarda en el perfil del usuario** (del lado del servidor) y se reaplica en cada inicio de sesión, además de recordarse en `localStorage`
- Los **datos del juego** (nombres de entidades, recetas) y los **nombres propios** (corporaciones) no se traducen

### API REST

> Todas las rutas `/api/**` (excepto `/api/auth/login`) requieren la cabecera `Authorization: Bearer <token>`.

| Método | Endpoint | Descripción |
|---------|----------------|-------------|
| POST | `/api/auth/login` | Inicio de sesión → token firmado (público) |
| GET | `/api/auth/me` | Usuario actual (nombre, rol, idioma) |
| PUT | `/api/auth/me/language` | Cambiar el idioma del usuario actual |
| GET / POST | `/api/admin/users` | Listar / crear usuarios (ADMIN) |
| PUT | `/api/admin/users/{id}/password` | Establecer la contraseña (ADMIN) |
| DELETE | `/api/admin/users/{id}` | Eliminar un usuario (ADMIN) |

| Método | Endpoint | Descripción |
|---------|----------------|-------------|
| POST | `/api/saves` | Subir y analizar un archivo `.sav` |
| GET | `/api/saves` | Listar sesiones |
| DELETE | `/api/saves/{id}` | Eliminar una sesión |
| GET | `/api/saves/{id}/entities` | Entidades (filtrables por `?cat=`) |
| GET | `/api/saves/{id}/links` | Flujos de drones |
| GET | `/api/saves/{id}/splines` | Raíles y splines |
| GET | `/api/saves/{id}/zones` | Zonas base (bounding boxes) |
| GET | `/api/saves/{id}/summary` | Estadísticas agregadas |
| GET | `/api/saves/{id}/progression` | Corporaciones, blueprints desbloqueados/bloqueados + objetos recolectados |
| GET / PUT | `/api/admin/config` | Leer / escribir la configuración de importación FTP |
| POST | `/api/admin/test` | Prueba de conexión (pasarela HTTP o FTP) |
| POST | `/api/admin/import` | Importación inmediata del `.sav` desde FTP/pasarela |

| Método | Endpoint | Descripción |
|---------|----------------|-------------|
| GET | `/api/kanban/board` | Tablero kanban completo (columnas + tareas) |
| GET | `/api/kanban/users` | Lista de usuarios (para la asignación) |
| POST / PUT / DELETE | `/api/kanban/columns[/{id}]` | Crear / renombrar / eliminar una columna |
| POST / PUT / DELETE | `/api/kanban/tasks[/{id}]` | Crear / editar / eliminar una tarea |
| PUT | `/api/kanban/tasks/{id}/move` | Mover una tarea (columna + posición) |

## Pipeline CI/CD

```
build (JAR backend + dist frontend)
  → package (imágenes Docker → GitLab Container Registry)
    → deploy (scp compose/nginx + docker compose pull/up en el servidor)
```

- **main** → despliegue **automático a producción** (entrega directa, sin aprobación)
- Flujo único `main → prod`: sin rama `develop`/staging

## Progreso

| Sprint | Puntos | Estado |
|--------|--------|--------|
| S1 — Fundamentos (subida, parser, mapa, zoom) | 26 | Hecho |
| S2 — Visualización avanzada (drones, raíles, tabla, minimapa, alertas) | 24 | Hecho |
| S3 — Filtros y CI/CD | 11 | Hecho |
| **Total** | **61** | Hecho |

## Licencia

Distribuido bajo la licencia **MIT** — consulta el archivo [LICENSE](LICENSE). Eres libre
de usar, modificar y redistribuir este código, incluso con fines comerciales,
siempre que conserves el aviso de copyright.
