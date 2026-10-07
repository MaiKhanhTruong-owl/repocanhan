@echo off
chcp 65001 >nul
title PrintFlow - Quan Ly File va Nhua In 3D (Local)

echo =======================================================
echo    PrintFlow - Quan Ly File va Nhua In 3D Local
echo =======================================================
echo.

cd /d "%~dp0"

:: Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh!
    echo Vui long cai dat Node.js tu https://nodejs.org truoc khi su dung.
    pause
    exit /b
)

:: Kiem tra thu muc node_modules
if not exist "node_modules" (
    echo [THONG BAO] Dang cai dat thu vien lan dau... Vui long doi giay lat!
    call npm install
)

echo [OK] Dang khoi dong PrintFlow...
echo [OK] Trinh duyet se tu dong mo ngay khi he thong san sang!
echo.
echo Nhan Ctrl + C de dung ung dung khi khong su dung.
echo -------------------------------------------------------

:: Chay Vite dev server va tu dong bat trinh duyet
call npm run dev -- --open

pause
