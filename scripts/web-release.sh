#!/bin/bash
echo "=== Iniciando Web Release ==="

# 1. Actualizar version
# Usamos powershell para ejecutar el script de actualización
NEW_VERSION=$(powershell.exe -ExecutionPolicy Bypass -Command "& { . ./scripts/src/update-version.ps1; return \$newVersion }")
echo "Nueva version detectada: $NEW_VERSION"

# 2. Build Web
echo "Construyendo aplicación web..."
cd sources/webapp
npm run build
cd ../..

# 3. Copiar a releases/webapp
echo "Copiando archivos a releases/webapp..."
rm -rf releases/webapp/*
cp -r sources/webapp/dist/* releases/webapp/

# 4. Commit and Push
echo "Subiendo cambios a Git..."
powershell.exe -ExecutionPolicy Bypass -File ./scripts/src/build-and-push.ps1 "Web Release v$NEW_VERSION"

echo "✅ Web Release completado!"
