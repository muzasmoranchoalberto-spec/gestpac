@echo off 
cd /d "%%~dp0" 
git add . 
git commit -m "Actualizacion GestPAC" 
git push origin master 
pause 
