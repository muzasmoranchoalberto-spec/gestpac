#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node &> /dev/null; then
  osascript -e 'display alert "Node.js no está instalado" message "Descárgalo desde nodejs.org e instálalo primero."'
  exit 1
fi
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install
fi
echo "Arrancando GestPAC..."
open http://localhost:3000
node server.js
