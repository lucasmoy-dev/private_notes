#!/bin/bash
# Script to build and deploy to Android via Capacitor

echo "--- Building Web Assets ---"
npm run build

echo "--- Syncing with Capacitor ---"
cd mobile
npx cap copy
npx cap sync android

echo "--- Opening Android Studio ---"
# npx cap open android

echo "✅ Ready. You can now generate the APK from Android Studio or with npx cap run android"
