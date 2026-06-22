# 🚀 Guía de instalación — StarRupture Base Scanner

🌍 [English](INSTALLATION.md) · [Français](INSTALLATION.fr.md) · [Deutsch](INSTALLATION.de.md) · **Español** · [Polski](INSTALLATION.pl.md)

> **¿Para quién es esta guía?** Esta guía está pensada para personas **que nunca han instalado una aplicación de este tipo**.
> No se necesita ningún conocimiento técnico previo. Le explicamos **cada paso** y **cada comando**.
>
> **Tiempo estimado:** de 20 a 40 minutos (según la velocidad de su conexión).

---

## 📋 Lo que conseguirá

Al terminar esta guía, tendrá la aplicación **StarRupture Base Scanner** funcionando en su
computadora (o en un servidor), accesible desde un navegador web. Podrá importar sus
partidas guardadas del juego y visualizar su base.

---

## 🧰 Paso 0 — Lo que necesita

| | Detalle |
|---|---|
| 💻 Una computadora | Windows 10/11, macOS o Linux |
| 💾 Espacio libre | Alrededor de **5 GB** |
| 🌐 Una conexión a Internet | Para descargar la aplicación la primera vez |
| 🐳 El programa **Docker** | Lo instalamos en el Paso 1 (es gratuito) |

> **¿Qué es Docker?** Imagine una "caja" que ya contiene todo lo que la aplicación necesita
> para funcionar (el servidor, la base de datos…). Usted **no tiene nada más que instalar**: Docker se encarga de todo.
> Es el método más sencillo y más fiable.

---

## 🐳 Paso 1 — Instalar Docker

### En Windows o macOS

1. Vaya a **https://www.docker.com/products/docker-desktop/**
2. Haga clic en **Download** y elija su sistema (Windows o Mac).
3. Abra el archivo descargado y siga la instalación (haga clic en "Next" / "Install").
4. **Reinicie su computadora** si se lo pide.
5. Inicie **Docker Desktop** (el icono de la ballena 🐳). Espere hasta que el icono de la parte inferior muestre
   "Docker Desktop is running".

> 💡 En Windows, si aparece un mensaje sobre "WSL 2", deje que Docker lo instale automáticamente
> (haga clic en el enlace sugerido y vuelva a intentarlo).

### En Linux (Ubuntu/Debian)

Abra una terminal y copie y pegue estos comandos uno por uno:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Después, **cierre la sesión y vuelva a iniciarla** (o reinicie) para que el segundo cambio surta efecto.

### Comprobar que Docker funciona

Abra una **terminal**:
- **Windows**: menú Inicio → escriba `PowerShell` → Enter.
- **macOS**: Aplicaciones → Utilidades → **Terminal**.
- **Linux**: su terminal habitual.

Escriba este comando y luego Enter:

```bash
docker --version
```

Si ve una línea como `Docker version 27.x.x`, todo está correcto ✅. Si no, repita el Paso 1.

---

## 📥 Paso 2 — Descargar la aplicación

### Método sencillo (sin instalar nada más)

1. Vaya a la página del proyecto: **https://github.com/slagh49/starupture-colab**
2. Haga clic en el botón verde **`< > Code`** y luego en **Download ZIP**.
3. Una vez descargado el `.zip`, **extráigalo** (clic derecho → "Extraer todo").
4. Obtendrá una carpeta llamada `starupture-colab` (o similar). **Recuerde dónde está**
   (por ejemplo, en la carpeta de descargas `Downloads`).

### Método alternativo (si conoce `git`)

```bash
git clone https://github.com/slagh49/starupture-colab.git
```

---

## 🔑 Paso 3 — Configurar los dos secretos

La aplicación necesita **dos contraseñas secretas** que usted mismo elige:
- una para la **base de datos** (`DB_PASSWORD`),
- otra para **proteger las conexiones** (`APP_AUTH_SECRET`).

> ⚠️ **Importante**: la aplicación **se niega a iniciarse** si `APP_AUTH_SECRET` no está definido.
> Esto es intencional, por su seguridad.

### 3.1 — Abrir la carpeta correcta

En su terminal, entre en la subcarpeta `infra` de la aplicación.
Adapte la ruta al lugar donde haya extraído el proyecto:

```bash
cd Downloads/starupture-colab/infra
```

> 💡 `cd` significa "cambiar de directorio" (change directory). En Windows, también puede abrir la carpeta `infra` en
> el explorador de archivos, hacer clic en la barra de direcciones, escribir `powershell` y pulsar Enter: se abrirá
> una terminal directamente en el lugar correcto.

### 3.2 — Crear el archivo de configuración

Vamos a crear un pequeño archivo llamado `.env` que guarda los dos secretos.

**En macOS / Linux**, copie y pegue este bloque de una sola vez (genera un secreto aleatorio por sí solo):

```bash
cat > .env <<EOF
DB_PASSWORD=change-this-password
APP_AUTH_SECRET=$(openssl rand -base64 48)
EOF
```

**En Windows (PowerShell)**, copie y pegue este bloque:

```powershell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
"DB_PASSWORD=change-this-password`nAPP_AUTH_SECRET=$secret" | Out-File -Encoding ascii .env
```

> Reemplace `change-this-password` por una contraseña de su elección para la base de datos
> (cualquier secuencia de letras o números, sin espacios). No necesitará recordarla en el día a día.

### 3.3 — Verificar (opcional)

Para comprobar que el archivo es correcto:

```bash
cat .env
```

Debería ver **dos líneas**: `DB_PASSWORD=...` y `APP_AUTH_SECRET=...` (con una larga
secuencia de caracteres después del `=`).

---

## ▶️ Paso 4 — Iniciar la aplicación

Aún en la carpeta `infra`, ejecute **este único comando**:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

> **¿Qué hace este comando?**
> - `up`: inicia la aplicación.
> - `--build`: construye la aplicación a partir del código fuente (**solo la primera vez**, esto
>   puede tardar **de 5 a 15 minutos** — es normal, Docker descarga y compila todo).
> - `-d`: deja la aplicación funcionando en segundo plano.

Espere a que el comando termine y le devuelva el control. Verá pasar mucho texto en la pantalla:
es normal.

---

## 🌍 Paso 5 — Abrir la aplicación

1. Abra su navegador web (Chrome, Firefox, Edge…).
2. Vaya a la dirección: **http://localhost:8888**

   > Si instaló la aplicación en **otra computadora o servidor**, reemplace `localhost`
   > por la dirección de esa máquina (por ejemplo, `http://192.168.1.50:8888`).

3. Aparece una página de **inicio de sesión**. 🌐 Puede **cambiar el idioma** en la parte superior derecha
   (inglés, francés, alemán, español, polaco).

### Primer inicio de sesión

- **Usuario:** `admin`
- **Contraseña:** `admin`

> 🔒 **HAGA ESTO DE INMEDIATO**: una vez que haya iniciado sesión, vaya a la pestaña **Administration**,
> sección **Users**, y **cambie la contraseña de la cuenta `admin`**. La contraseña
> predeterminada `admin`/`admin` no es segura.

🎉 **¡Ya está instalado!** Ahora puede importar una partida guardada `.sav` con el botón de importación,
o configurar la importación automática (vea más abajo).

---

## 📂 Paso 6 (opcional) — Importación automática desde su servidor de juego

Si su servidor de StarRupture está alojado (por ejemplo, con un proveedor de servidores de juego),
la aplicación puede obtener la partida guardada por sí sola:

1. Inicie sesión y vaya a la pestaña **Administration**.
2. Complete los datos FTP de su proveedor (servidor, usuario, contraseña, ruta).
3. Haga clic en **Test the connection** y luego en **Import now**.
4. Active la **importación automática** para que se repita en el intervalo que desee.

> Los detalles de estas opciones se explican directamente en la interfaz.

---

## 🔄 Actualizar la aplicación (más adelante)

Cuando haya una nueva versión disponible:

1. Vuelva a descargar el proyecto (Paso 2) **sobre** la carpeta antigua, o ejecute `git pull` si
   usó `git`.
2. En la carpeta `infra`, ejecute de nuevo:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Sus datos (partidas importadas, cuentas, tablero TODO) se **conservan**.

---

## ⏹️ Detener / reiniciar la aplicación

En la carpeta `infra`:

```bash
# Detener (los datos se conservan)
docker compose down

# Reiniciar (después de un primer arranque ya construido)
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d
```

> ⚠️ **Nunca use** `docker compose down -v`: la opción `-v` **borra la base de datos**
> (perdería todos sus datos).

---

## 🆘 Solución de problemas

| Síntoma | Solución |
|---|---|
| `docker: command not found` | Docker no está instalado o no está iniciado. Repita el **Paso 1** e inicie Docker Desktop. |
| La página `http://localhost:8888` no se abre | Espere 1 o 2 minutos tras el arranque (el servidor tarda un poco en iniciarse). Asegúrese de que Docker Desktop esté funcionando. |
| "port is already allocated" | Otro programa está usando el puerto 8888. Ciérrelo, o pida ayuda para cambiar el puerto. |
| El backend se reinicia en bucle | Compruebe que el archivo `.env` contiene efectivamente **`APP_AUTH_SECRET=`** seguido de un valor largo (Paso 3). |
| Ver qué ocurre (mensajes de error) | En `infra`, escriba: `docker compose logs -f` (Ctrl+C para salir de la visualización). |
| Restablecer todo (⚠️ borra los datos) | `docker compose down -v` y luego repita el Paso 4. |

---

## 📖 Glosario rápido

- **Terminal / PowerShell**: una ventana donde se escriben comandos con el teclado.
- **Docker**: el programa que ejecuta la aplicación en una "caja" lista para usar.
- **`.env`**: un archivo de texto que guarda sus secretos (contraseñas).
- **`localhost`**: una palabra que significa "esta misma computadora".
- **Puerto `8888`**: la "puerta de entrada" por la que se accede a la aplicación en el navegador.

---

¿Necesita ayuda? Abra un *issue* en la página del proyecto en GitHub:
**https://github.com/slagh49/starupture-colab/issues**
