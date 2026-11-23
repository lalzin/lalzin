#!/usr/bin/env bash
# Téléverse les installateurs Groove Knobs d'une version dans le bucket R2 du site.
#   bash scripts/upload-r2.sh 0.1.11
#
# Rangement attendu par le site (lib/plugins.ts, r2Key) :
#   lalzin/<slug>/<version>/<fichier>            pour chaque plugin
#   lalzin/groove-knobs/<version>/<fichier>      pour la suite complète
# macOS : depuis ../groove-knobs/dist/ ; Windows : depuis la release GitHub v<version>.
set -euo pipefail
V="${1:?Usage : bash scripts/upload-r2.sh <version>, par exemple 0.1.11}"
BUCKET=lalzin
DIST="$(cd "$(dirname "$0")/../../groove-knobs/dist" && pwd)"
WIN="$DIST/win-$V"
mkdir -p "$WIN"

# dossier R2 : nom des fichiers
PAIRES=(
  french-filter:FrenchFilter boogie-trio:BoogieTrio backwash:Backwash pew-pew:PewPew
  sing-it-back:SingItBack kick-lock:KickLock slapper:Slapper crackle:Crackle
  head-spin:HeadSpin ballroom:Ballroom daft-chunk:DaftChunk groove-knobs:GrooveKnobs
)

for paire in "${PAIRES[@]}"; do
  dossier=${paire%%:*}; nom=${paire##*:}
  mac="$nom-$V-macOS.pkg"; win="$nom-$V-Windows-Setup.exe"
  [[ -f "$DIST/$mac" ]] || { echo "Manque $DIST/$mac"; exit 1; }
  [[ -f "$WIN/$win" ]] || curl -fL -o "$WIN/$win" "https://github.com/lalzin/groove-knobs/releases/download/v$V/$win"
  echo "→ $BUCKET/$dossier/$V/"
  npx wrangler r2 object put "$BUCKET/$dossier/$V/$mac" --file "$DIST/$mac" --remote
  npx wrangler r2 object put "$BUCKET/$dossier/$V/$win" --file "$WIN/$win" --remote
done
echo "Terminé : ${#PAIRES[@]} x 2 fichiers dans $BUCKET/<dossier>/$V/"
