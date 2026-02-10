#!/bin/bash
# Script para compilar y desplegar en Android vía Capacitor

echo "--- Construyendo Web Assets ---"
npm run build

echo "--- Sincronizando con Capacitor ---"
cd mobile
npx cap copy
npx cap sync android

echo "--- Abriendo Android Studio ---"
# npx cap open android

echo "✅ Listo. Ahora puedes generar el APK desde Android Studio o con npx cap run android"
