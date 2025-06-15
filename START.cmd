@echo off
cd /d %~dp0
start cmd /k "npm cache clean --force && if exist node_modules rmdir /s /q node_modules && npm install && npm install @tailwindcss/postcss && npm run dev"