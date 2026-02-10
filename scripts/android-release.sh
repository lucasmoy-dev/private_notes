#!/bin/bash
echo "=== Iniciando Android Release ==="

# 1. Actualizar version
NEW_VERSION=$(powershell.exe -ExecutionPolicy Bypass -Command "& { . ./scripts/src/update-version.ps1; return \$newVersion }")
echo "Nueva version detectada: $NEW_VERSION"

# 2. Build Android (usando el .ps1 que hace el trabajo sucio con Docker)
powershell.exe -ExecutionPolicy Bypass -File ./scripts/src/android-release.ps1 -Version "$NEW_VERSION"

if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación de Android"
    exit 1
fi

# 3. Commit and Push
echo "Subiendo cambios a Git..."
powershell.exe -ExecutionPolicy Bypass -File ./scripts/src/build-and-push.ps1 "Android Release v$NEW_VERSION"

echo "✅ Android Release completado!"
