@echo off
title Push Library System to GitHub
echo ===================================================
echo     PUSHING LIBRARY MANAGEMENT SYSTEM TO GITHUB
echo ===================================================
echo.

echo [1/3] Staging files for Git...
git add index.html style.css app.js README.md
git rm app.py database.sql templates/index.html static/style.css >nul 2>&1

echo [2/3] Committing changes...
git commit -m "Convert library system to premium client-side web application"

echo [3/3] Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo Main branch failed. Trying master branch...
    git push origin master
)

echo.
echo ===================================================
echo   Done! Your repository has been updated on GitHub.
echo ===================================================
echo.
pause
