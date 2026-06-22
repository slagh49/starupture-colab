# 🚀 Guide d'installation — StarRupture Base Scanner

🌍 [English](INSTALLATION.md) · **Français** · [Deutsch](INSTALLATION.de.md) · [Español](INSTALLATION.es.md) · [Polski](INSTALLATION.pl.md)

> **Pour qui ?** Ce guide s'adresse aux personnes **qui n'ont jamais installé d'application de ce type**.
> Aucune connaissance technique préalable n'est nécessaire. On explique **chaque étape** et **chaque commande**.
>
> **Temps estimé :** 20 à 40 minutes (selon la vitesse de votre connexion).

---

## 📋 Ce que vous allez obtenir

À la fin de ce guide, vous aurez l'application **StarRupture Base Scanner** qui tourne sur votre
ordinateur (ou un serveur), accessible depuis un navigateur web. Vous pourrez y importer vos
sauvegardes du jeu et visualiser votre base.

---

## 🧰 Étape 0 — Ce dont vous avez besoin

| | Détail |
|---|---|
| 💻 Un ordinateur | Windows 10/11, macOS, ou Linux |
| 💾 Espace libre | Environ **5 Go** |
| 🌐 Une connexion Internet | Pour télécharger l'application la première fois |
| 🐳 Le logiciel **Docker** | On l'installe à l'étape 1 (c'est gratuit) |

> **C'est quoi Docker ?** Imaginez une « boîte » qui contient déjà tout ce dont l'application a
> besoin pour fonctionner (le serveur, la base de données…). Vous n'avez **rien d'autre à installer** :
> Docker s'occupe de tout. C'est la méthode la plus simple et la plus fiable.

---

## 🐳 Étape 1 — Installer Docker

### Sur Windows ou macOS

1. Rendez-vous sur **https://www.docker.com/products/docker-desktop/**
2. Cliquez sur **Download** et choisissez votre système (Windows ou Mac).
3. Ouvrez le fichier téléchargé et suivez l'installation (cliquez « Suivant » / « Installer »).
4. **Redémarrez votre ordinateur** si on vous le demande.
5. Lancez **Docker Desktop** (icône de baleine 🐳). Attendez que l'icône en bas indique
   « Docker Desktop is running » (Docker est démarré).

> 💡 Sur Windows, si un message parle de « WSL 2 », laissez Docker l'installer automatiquement
> (cliquez sur le lien proposé puis recommencez).

### Sur Linux (Ubuntu/Debian)

Ouvrez un terminal et copiez-collez ces commandes une par une :

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Puis **déconnectez-vous et reconnectez-vous** (ou redémarrez) pour que le second changement prenne effet.

### Vérifier que Docker fonctionne

Ouvrez un **terminal** :
- **Windows** : menu Démarrer → tapez `PowerShell` → Entrée.
- **macOS** : Applications → Utilitaires → **Terminal**.
- **Linux** : votre terminal habituel.

Tapez cette commande puis Entrée :

```bash
docker --version
```

Si vous voyez une ligne comme `Docker version 27.x.x`, c'est bon ✅. Sinon, reprenez l'étape 1.

---

## 📥 Étape 2 — Télécharger l'application

### Méthode simple (sans rien installer de plus)

1. Allez sur la page du projet : **https://github.com/slagh49/starupture-colab**
2. Cliquez sur le bouton vert **`< > Code`**, puis **Download ZIP**.
3. Une fois le `.zip` téléchargé, **décompressez-le** (clic droit → « Extraire tout »).
4. Vous obtenez un dossier nommé `starupture-colab` (ou similaire). **Retenez où il se trouve**
   (par exemple dans `Téléchargements`).

### Méthode alternative (si vous connaissez `git`)

```bash
git clone https://github.com/slagh49/starupture-colab.git
```

---

## 🔑 Étape 3 — Configurer les deux secrets

L'application a besoin de **deux mots de passe secrets** que vous choisissez vous-même :
- un pour la **base de données** (`DB_PASSWORD`),
- un pour **sécuriser les connexions** (`APP_AUTH_SECRET`).

> ⚠️ **Important** : l'application **refuse de démarrer** si `APP_AUTH_SECRET` n'est pas défini.
> C'est volontaire, pour votre sécurité.

### 3.1 — Ouvrir le bon dossier

Dans votre terminal, rendez-vous dans le sous-dossier `infra` de l'application.
Adaptez le chemin à l'endroit où vous avez décompressé le projet :

```bash
cd Téléchargements/starupture-colab/infra
```

> 💡 `cd` veut dire « changer de dossier » (*change directory*). Sur Windows, vous pouvez aussi
> ouvrir le dossier `infra` dans l'explorateur, cliquer dans la barre d'adresse, taper `powershell`
> et Entrée : un terminal s'ouvrira directement au bon endroit.

### 3.2 — Créer le fichier de configuration

Nous allons créer un petit fichier nommé `.env` qui contient les deux secrets.

**Sur macOS / Linux**, copiez-collez ce bloc d'un coup (il génère un secret aléatoire tout seul) :

```bash
cat > .env <<EOF
DB_PASSWORD=changez-ce-mot-de-passe
APP_AUTH_SECRET=$(openssl rand -base64 48)
EOF
```

**Sur Windows (PowerShell)**, copiez-collez ce bloc :

```powershell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
"DB_PASSWORD=changez-ce-mot-de-passe`nAPP_AUTH_SECRET=$secret" | Out-File -Encoding ascii .env
```

> Remplacez `changez-ce-mot-de-passe` par le mot de passe de votre choix pour la base de données
> (n'importe quelle suite de lettres/chiffres, sans espaces). Vous n'aurez pas à le retenir au quotidien.

### 3.3 — Vérifier (facultatif)

Pour vérifier que le fichier est correct :

```bash
cat .env
```

Vous devez voir **deux lignes** : `DB_PASSWORD=...` et `APP_AUTH_SECRET=...` (avec une longue
suite de caractères après le `=`).

---

## ▶️ Étape 4 — Démarrer l'application

Toujours dans le dossier `infra`, lancez **cette seule commande** :

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

> **Que fait cette commande ?**
> - `up` : démarre l'application.
> - `--build` : construit l'application à partir du code (la **première fois uniquement**, cela
>   peut prendre **5 à 15 minutes** — c'est normal, Docker télécharge et compile tout).
> - `-d` : laisse l'application tourner en arrière-plan.

Patientez jusqu'à ce que la commande se termine et rende la main. Vous verrez défiler beaucoup de
texte : c'est normal.

---

## 🌍 Étape 5 — Ouvrir l'application

1. Ouvrez votre navigateur web (Chrome, Firefox, Edge…).
2. Allez à l'adresse : **http://localhost:8888**

   > Si vous avez installé l'application sur un **autre ordinateur/serveur**, remplacez `localhost`
   > par l'adresse de cette machine (ex. `http://192.168.1.50:8888`).

3. Une page de **connexion** apparaît. 🌐 Vous pouvez **changer la langue** en haut à droite
   (anglais, français, allemand, espagnol, polonais).

### Première connexion

- **Identifiant :** `admin`
- **Mot de passe :** `admin`

> 🔒 **À FAIRE IMMÉDIATEMENT** : une fois connecté, allez dans l'onglet **Administration**,
> section **Utilisateurs**, et **changez le mot de passe du compte `admin`**. Le mot de passe
> par défaut `admin`/`admin` n'est pas sécurisé.

🎉 **C'est installé !** Vous pouvez maintenant importer une sauvegarde `.sav` via le bouton
d'import, ou configurer l'import automatique (voir ci-dessous).

---

## 📂 Étape 6 (facultatif) — Import automatique depuis votre serveur de jeu

Si votre serveur StarRupture est hébergé (ex. chez un hébergeur de serveurs de jeu),
l'application peut récupérer la sauvegarde toute seule :

1. Connectez-vous, allez dans l'onglet **Administration**.
2. Renseignez les informations FTP de votre hébergeur (hôte, identifiant, mot de passe, chemin).
3. Cliquez sur **Tester la connexion**, puis **Importer maintenant**.
4. Activez l'**import automatique** pour qu'il se répète à l'intervalle voulu.

> Le détail de ces options est expliqué directement dans l'interface.

---

## 🔄 Mettre à jour l'application (plus tard)

Quand une nouvelle version est disponible :

1. Re-téléchargez le projet (Étape 2) **par-dessus** l'ancien dossier, ou faites `git pull` si
   vous avez utilisé `git`.
2. Dans le dossier `infra`, relancez :

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Vos données (sauvegardes importées, comptes, tableau TODO) sont **conservées**.

---

## ⏹️ Arrêter / redémarrer l'application

Dans le dossier `infra` :

```bash
# Arrêter (les données sont conservées)
docker compose down

# Redémarrer (après un premier démarrage déjà construit)
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d
```

> ⚠️ **N'utilisez jamais** `docker compose down -v` : l'option `-v` **efface la base de données**
> (toutes vos données seraient perdues).

---

## 🆘 En cas de problème

| Symptôme | Solution |
|---|---|
| `docker : command not found` / « commande introuvable » | Docker n'est pas installé ou pas démarré. Reprenez l'**Étape 1** et lancez Docker Desktop. |
| La page `http://localhost:8888` ne s'ouvre pas | Attendez 1-2 minutes après le démarrage (le serveur met un peu de temps à se lancer). Vérifiez que Docker Desktop est bien démarré. |
| « port is already allocated » (port déjà utilisé) | Un autre programme utilise le port 8888. Fermez-le, ou demandez de l'aide pour changer le port. |
| Le backend redémarre en boucle | Vérifiez que le fichier `.env` contient bien **`APP_AUTH_SECRET=`** suivi d'une longue valeur (Étape 3). |
| Voir ce qui se passe (messages d'erreur) | Dans `infra`, tapez : `docker compose logs -f` (Ctrl+C pour quitter l'affichage). |
| Tout réinitialiser (⚠️ efface les données) | `docker compose down -v` puis recommencez l'Étape 4. |

---

## 📖 Petit glossaire

- **Terminal / PowerShell** : une fenêtre où l'on tape des commandes au clavier.
- **Docker** : le logiciel qui fait tourner l'application dans une « boîte » prête à l'emploi.
- **`.env`** : un fichier texte qui contient vos secrets (mots de passe).
- **`localhost`** : un mot qui désigne « cet ordinateur-ci ».
- **Port `8888`** : la « porte d'entrée » par laquelle on accède à l'application dans le navigateur.

---

Besoin d'aide ? Ouvrez une *issue* sur la page GitHub du projet :
**https://github.com/slagh49/starupture-colab/issues**
