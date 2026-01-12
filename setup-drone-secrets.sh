#!/bin/bash

# Drone CI Secrets Setup Script
# Dieses Script hilft beim Einrichten der notwendigen Secrets für Drone CI

set -e

echo "========================================="
echo "Drone CI Secrets Setup für discord-voicebot"
echo "========================================="
echo ""

# Farbcodes für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Prüfe ob drone CLI installiert ist
if ! command -v drone &> /dev/null; then
    echo -e "${RED}Fehler: drone CLI ist nicht installiert${NC}"
    echo "Installation: https://docs.drone.io/cli/install/"
    echo ""
    echo "macOS: brew install drone/drone/drone"
    echo "Linux: curl -L https://github.com/harness/drone-cli/releases/latest/download/drone_linux_amd64.tar.gz | tar zx"
    exit 1
fi

# Prüfe Drone CLI Konfiguration
echo -e "${YELLOW}Prüfe Drone CLI Konfiguration...${NC}"
if [ -z "$DRONE_SERVER" ] || [ -z "$DRONE_TOKEN" ]; then
    echo -e "${RED}Fehler: Drone CLI ist nicht konfiguriert!${NC}"
    echo ""
    echo -e "${YELLOW}Du musst folgende Umgebungsvariablen setzen:${NC}"
    echo ""
    echo "1. Gehe zu deinem Drone Server (z.B. https://drone.groot.rocks)"
    echo "2. Klicke auf dein Avatar → User Settings"
    echo "3. Erstelle einen Personal Token (oder kopiere den existierenden)"
    echo "4. Setze die Umgebungsvariablen:"
    echo ""
    echo -e "${BLUE}export DRONE_SERVER=https://drone.groot.rocks${NC}"
    echo -e "${BLUE}export DRONE_TOKEN=dein-drone-token${NC}"
    echo ""
    echo "Optional (in ~/.bashrc oder ~/.zshrc speichern):"
    echo ""
    echo -e "${BLUE}echo 'export DRONE_SERVER=https://drone.groot.rocks' >> ~/.zshrc"
    echo -e "echo 'export DRONE_TOKEN=dein-drone-token' >> ~/.zshrc"
    echo -e "source ~/.zshrc${NC}"
    echo ""
    echo "Danach dieses Script erneut ausführen."
    exit 1
fi

echo -e "${GREEN}✓ Drone Server: ${DRONE_SERVER}${NC}"
echo ""

# Eingabe Repository
echo -e "${YELLOW}Repository Information${NC}"
read -p "Gitea Owner/Username: " OWNER
read -p "Repository Name [discord-voicebot]: " REPO
REPO=${REPO:-discord-voicebot}
FULL_REPO="${OWNER}/${REPO}"

echo ""
echo -e "${YELLOW}Gitea Registry Information${NC}"
read -p "Gitea Registry URL (z.B. gitea.example.com): " GITEA_REGISTRY
read -p "Gitea Username: " GITEA_USERNAME
read -sp "Gitea Access Token: " GITEA_TOKEN
echo ""

# Optional: Webhook
echo ""
echo -e "${YELLOW}Optional: Webhook für Benachrichtigungen${NC}"
read -p "Webhook URL (Enter zum Überspringen): " WEBHOOK_URL

# Bestätigung
echo ""
echo -e "${YELLOW}Folgende Secrets werden gesetzt:${NC}"
echo "Repository: ${FULL_REPO}"
echo "Registry: ${GITEA_REGISTRY}"
echo "Username: ${GITEA_USERNAME}"
echo "Token: ***"
if [ ! -z "$WEBHOOK_URL" ]; then
    echo "Webhook: ${WEBHOOK_URL}"
fi
echo ""
read -p "Fortfahren? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Abgebrochen."
    exit 1
fi

echo ""
echo -e "${GREEN}Setze Secrets...${NC}"

# Docker Repository Path (Registry + Owner + Repo)
DOCKER_REPO="${GITEA_REGISTRY}/${OWNER}/${REPO}"

# Secrets setzen
echo "- gitea_username..."
drone secret add \
    --repository "${FULL_REPO}" \
    --name gitea_username \
    --data "${GITEA_USERNAME}"

echo "- gitea_token..."
drone secret add \
    --repository "${FULL_REPO}" \
    --name gitea_token \
    --data "${GITEA_TOKEN}"

echo "- GITEA_REGISTRY..."
drone secret add \
    --repository "${FULL_REPO}" \
    --name GITEA_REGISTRY \
    --data "${GITEA_REGISTRY}"

echo "- docker_repo..."
drone secret add \
    --repository "${FULL_REPO}" \
    --name docker_repo \
    --data "${DOCKER_REPO}"

if [ ! -z "$WEBHOOK_URL" ]; then
    echo "- webhook_url..."
    drone secret add \
        --repository "${FULL_REPO}" \
        --name webhook_url \
        --data "${WEBHOOK_URL}"
fi

echo ""
echo -e "${GREEN}✓ Secrets erfolgreich gesetzt!${NC}"
echo ""

# Secrets auflisten (ohne Werte)
echo "Vorhandene Secrets:"
drone secret ls "${FULL_REPO}" 2>/dev/null || echo "Konnte Secrets nicht auflisten (benötigt Admin-Rechte)"

echo ""
echo -e "${YELLOW}Nächste Schritte:${NC}"
echo "1. Aktiviere das Repository in Drone (falls noch nicht geschehen)"
echo "2. Pushe die .drone.yml in dein Repository"
echo "3. Der erste Build sollte automatisch starten"
echo ""
echo "Build manuell triggern:"
echo "  drone build create ${FULL_REPO}"
echo ""
echo "Build logs ansehen:"
echo "  drone build logs ${FULL_REPO} <build-number>"
echo ""

# Erstelle .env.registry Datei für lokale Verwendung
cat > .env.registry <<EOF
# Gitea Registry Konfiguration
# Erstellt von setup-drone-secrets.sh am $(date)

GITEA_REGISTRY=${GITEA_REGISTRY}
OWNER=${OWNER}
REPO=${REPO}

# Verwendung:
# source .env.registry
# docker pull \${GITEA_REGISTRY}/\${OWNER}/\${REPO}:latest
EOF

echo -e "${GREEN}✓ .env.registry erstellt für lokale Verwendung${NC}"
echo ""
echo "Lokales Pull-Beispiel:"
echo "  source .env.registry"
echo "  docker login \${GITEA_REGISTRY}"
echo "  docker pull \${GITEA_REGISTRY}/\${OWNER}/\${REPO}:latest"
echo ""
