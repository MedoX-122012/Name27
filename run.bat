@echo off
setlocal
title Name27 - Bot
cd /d "%~dp0"
where node >nul 2>nul || (echo [ERROR] Node.js not found & pause & exit /b 1)
if not exist .env copy /y .env.example .env >nul 2>&1
if not exist node_modules call npm install --silent >nul 2>&1
if not exist "node_modules\.prisma" npx prisma generate --silent >nul 2>&1
if not exist "prisma\dev.db" npx prisma db push --accept-data-loss --silent >nul 2>&1
start "Name27" cmd /k npx tsx watch src/index.ts
exit
