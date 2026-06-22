# 🚀 Installation guide — StarRupture Base Scanner

🌍 **English** · [Français](INSTALLATION.fr.md) · [Deutsch](INSTALLATION.de.md) · [Español](INSTALLATION.es.md) · [Polski](INSTALLATION.pl.md)

> **Who is this for?** This guide is for people **who have never installed an application of this kind**.
> No prior technical knowledge is required. We explain **every step** and **every command**.
>
> **Estimated time:** 20 to 40 minutes (depending on your connection speed).

---

## 📋 What you will get

By the end of this guide, you will have the **StarRupture Base Scanner** application running on your
computer (or a server), accessible from a web browser. You will be able to import your game
saves and visualize your base.

---

## 🧰 Step 0 — What you need

| | Detail |
|---|---|
| 💻 A computer | Windows 10/11, macOS, or Linux |
| 💾 Free space | About **5 GB** |
| 🌐 An Internet connection | To download the application the first time |
| 🐳 The **Docker** software | We install it in Step 1 (it's free) |

> **What is Docker?** Picture a "box" that already contains everything the application needs to
> run (the server, the database…). You have **nothing else to install**: Docker handles everything.
> It's the simplest and most reliable method.

---

## 🐳 Step 1 — Install Docker

### On Windows or macOS

1. Go to **https://www.docker.com/products/docker-desktop/**
2. Click **Download** and choose your system (Windows or Mac).
3. Open the downloaded file and follow the installation (click "Next" / "Install").
4. **Restart your computer** if prompted.
5. Launch **Docker Desktop** (whale icon 🐳). Wait until the icon at the bottom shows
   "Docker Desktop is running".

> 💡 On Windows, if a message mentions "WSL 2", let Docker install it automatically
> (click the suggested link, then try again).

### On Linux (Ubuntu/Debian)

Open a terminal and copy-paste these commands one by one:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Then **log out and back in** (or reboot) for the second change to take effect.

### Check that Docker works

Open a **terminal**:
- **Windows**: Start menu → type `PowerShell` → Enter.
- **macOS**: Applications → Utilities → **Terminal**.
- **Linux**: your usual terminal.

Type this command then Enter:

```bash
docker --version
```

If you see a line like `Docker version 27.x.x`, you're good ✅. Otherwise, redo Step 1.

---

## 📥 Step 2 — Download the application

### Simple method (without installing anything else)

1. Go to the project page: **https://github.com/slagh49/starupture-colab**
2. Click the green **`< > Code`** button, then **Download ZIP**.
3. Once the `.zip` is downloaded, **extract it** (right-click → "Extract all").
4. You get a folder named `starupture-colab` (or similar). **Remember where it is**
   (for example in `Downloads`).

### Alternative method (if you know `git`)

```bash
git clone https://github.com/slagh49/starupture-colab.git
```

---

## 🔑 Step 3 — Configure the two secrets

The application needs **two secret passwords** that you choose yourself:
- one for the **database** (`DB_PASSWORD`),
- one to **secure the connections** (`APP_AUTH_SECRET`).

> ⚠️ **Important**: the application **refuses to start** if `APP_AUTH_SECRET` is not set.
> This is intentional, for your security.

### 3.1 — Open the right folder

In your terminal, go into the application's `infra` subfolder.
Adapt the path to wherever you extracted the project:

```bash
cd Downloads/starupture-colab/infra
```

> 💡 `cd` means "change directory". On Windows, you can also open the `infra` folder in
> the file explorer, click in the address bar, type `powershell` and Enter: a terminal
> will open directly in the right place.

### 3.2 — Create the configuration file

We are going to create a small file named `.env` that holds the two secrets.

**On macOS / Linux**, copy-paste this block all at once (it generates a random secret by itself):

```bash
cat > .env <<EOF
DB_PASSWORD=change-this-password
APP_AUTH_SECRET=$(openssl rand -base64 48)
EOF
```

**On Windows (PowerShell)**, copy-paste this block:

```powershell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
"DB_PASSWORD=change-this-password`nAPP_AUTH_SECRET=$secret" | Out-File -Encoding ascii .env
```

> Replace `change-this-password` with a password of your choice for the database
> (any sequence of letters/digits, no spaces). You won't need to remember it day to day.

### 3.3 — Verify (optional)

To check that the file is correct:

```bash
cat .env
```

You should see **two lines**: `DB_PASSWORD=...` and `APP_AUTH_SECRET=...` (with a long
sequence of characters after the `=`).

---

## ▶️ Step 4 — Start the application

Still in the `infra` folder, run **this single command**:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

> **What does this command do?**
> - `up`: starts the application.
> - `--build`: builds the application from the source code (the **first time only**, this
>   can take **5 to 15 minutes** — that's normal, Docker downloads and compiles everything).
> - `-d`: leaves the application running in the background.

Wait until the command finishes and returns control to you. You'll see a lot of text scroll by:
that's normal.

---

## 🌍 Step 5 — Open the application

1. Open your web browser (Chrome, Firefox, Edge…).
2. Go to the address: **http://localhost:8888**

   > If you installed the application on **another computer/server**, replace `localhost`
   > with that machine's address (e.g. `http://192.168.1.50:8888`).

3. A **login** page appears. 🌐 You can **change the language** in the top right
   (English, French, German, Spanish, Polish).

### First login

- **Username:** `admin`
- **Password:** `admin`

> 🔒 **DO THIS IMMEDIATELY**: once logged in, go to the **Administration** tab,
> **Users** section, and **change the `admin` account's password**. The default
> `admin`/`admin` password is not secure.

🎉 **It's installed!** You can now import a `.sav` save via the import button,
or configure automatic import (see below).

---

## 📂 Step 6 (optional) — Automatic import from your game server

If your StarRupture server is hosted (e.g. with a game server host),
the application can fetch the save by itself:

1. Log in, go to the **Administration** tab.
2. Fill in your host's FTP details (host, username, password, path).
3. Click **Test the connection**, then **Import now**.
4. Enable **automatic import** so it repeats at the desired interval.

> The details of these options are explained directly in the interface.

---

## 🔄 Update the application (later)

When a new version is available:

1. Re-download the project (Step 2) **over** the old folder, or run `git pull` if
   you used `git`.
2. In the `infra` folder, run again:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Your data (imported saves, accounts, TODO board) is **preserved**.

---

## ⏹️ Stop / restart the application

In the `infra` folder:

```bash
# Stop (data is preserved)
docker compose down

# Restart (after an already-built first start)
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d
```

> ⚠️ **Never use** `docker compose down -v`: the `-v` option **erases the database**
> (all your data would be lost).

---

## 🆘 Troubleshooting

| Symptom | Solution |
|---|---|
| `docker: command not found` | Docker is not installed or not started. Redo **Step 1** and launch Docker Desktop. |
| The page `http://localhost:8888` won't open | Wait 1-2 minutes after startup (the server takes a little time to launch). Make sure Docker Desktop is running. |
| "port is already allocated" | Another program is using port 8888. Close it, or ask for help to change the port. |
| The backend restarts in a loop | Check that the `.env` file does contain **`APP_AUTH_SECRET=`** followed by a long value (Step 3). |
| See what's happening (error messages) | In `infra`, type: `docker compose logs -f` (Ctrl+C to quit the display). |
| Reset everything (⚠️ erases data) | `docker compose down -v` then redo Step 4. |

---

## 📖 Quick glossary

- **Terminal / PowerShell**: a window where you type commands on the keyboard.
- **Docker**: the software that runs the application in a ready-to-use "box".
- **`.env`**: a text file that holds your secrets (passwords).
- **`localhost`**: a word that means "this very computer".
- **Port `8888`**: the "front door" through which you reach the application in the browser.

---

Need help? Open an *issue* on the project's GitHub page:
**https://github.com/slagh49/starupture-colab/issues**
