@echo off
cd /d "%~dp0"
echo.
echo  Iniciando GestPAC...
echo.

if not exist node_modules (
    echo  Instalando dependencias, espera un momento...
    npm install
)

start http://localhost:3000
node server.js
pause
