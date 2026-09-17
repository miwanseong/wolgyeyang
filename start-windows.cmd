@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 이상을 먼저 설치해 주세요.
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
if not exist node_modules (
  call npm ci
  if errorlevel 1 (
    echo 패키지 설치 실패. 네트워크 연결을 확인해 주세요.
    pause
    exit /b 1
  )
)
echo 브라우저에서 http://localhost:3000 을 여세요.
call npm start
pause
