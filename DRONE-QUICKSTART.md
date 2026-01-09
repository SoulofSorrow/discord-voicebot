# Drone CI Quick Start

## Schnellstart in 3 Schritten

### 1. Gitea Access Token erstellen

1. Gehe zu deiner Gitea-Instanz
2. **Einstellungen** → **Anwendungen** → **Access Tokens**
3. Erstelle Token mit Berechtigungen: `read:package`, `write:package`

### 2. Secrets in Drone einrichten

```bash
# Setup-Script ausführen (empfohlen)
./setup-drone-secrets.sh

# ODER manuell:
export REPO="owner/discord-voicebot"
export REGISTRY="gitea.example.com"

drone secret add --repository $REPO --name gitea_username --data "dein-username"
drone secret add --repository $REPO --name gitea_token --data "dein-token"
drone secret add --repository $REPO --name GITEA_REGISTRY --data "$REGISTRY"
drone secret add --repository $REPO --name docker_repo --data "$REGISTRY/owner/discord-voicebot"
```

### 3. Pipeline aktivieren

```bash
# .drone.yml committen und pushen
git add .drone.yml
git commit -m "Add Drone CI pipeline"
git push

# Build startet automatisch!
```

## Image verwenden

```bash
# Login
docker login gitea.example.com

# Pull
docker pull gitea.example.com/owner/discord-voicebot:latest

# Run
docker run -d \
  --name discord-voicebot \
  -v $(pwd)/data:/usr/src/app/data \
  --env-file .env \
  gitea.example.com/owner/discord-voicebot:latest
```

## Wichtigste Befehle

```bash
# Build logs
drone build logs owner/discord-voicebot 1

# Build neu starten
drone build create owner/discord-voicebot

# Secrets auflisten
drone secret ls owner/discord-voicebot
```

## Verfügbare Tags

- `latest` - Aktuellster Build vom main Branch
- `<commit-sha>` - Spezifischer Commit
- `v1.0.0` - Git Tags
- `dev-develop` - Development Branch Builds

## Troubleshooting

### Build schlägt fehl
```bash
# Logs checken
drone build logs owner/repo BUILD_NUMBER

# Secrets prüfen
drone secret ls owner/repo
```

### "authentication required"
```bash
# Token-Berechtigungen in Gitea prüfen
# Package Registry in Gitea aktiviert?
```

### Registry URL
```bash
# OHNE Protokoll: ✓ gitea.example.com
# MIT Port: ✓ gitea.example.com:5000
# NICHT: ✗ https://gitea.example.com
```

## Weitere Infos

- Vollständige Anleitung: `.drone-setup.md`
- Drone Docs: https://docs.drone.io
- Gitea Packages: https://docs.gitea.io/en-us/packages/overview/
