## Opción 1: Usar Docker (MÁS RECOMENDADO)

Si tienes Docker Desktop instalado, esta es la forma más limpia y segura:

1. Asegúrate de tener **Docker Desktop** abierto.
2. Ejecuta en PowerShell:
   ```powershell
   cd d:\work\lab\private-notes
   npm run build
   cd mobile
   npx cap sync android
   docker-compose up --build
   ```
3. La APK se generará en:
   `d:\work\lab\private-notes\mobile\android\app\build\outputs\apk\debug\app-debug.apk`

---

## Opción 2: Usar Android Studio (Alternativa)

### Paso 1: Preparar el proyecto
Ejecuta desde PowerShell:
```powershell
cd d:\work\lab\private-notes
npm run build
cd mobile
npx cap copy
npx cap sync android
```

### Paso 2: Abrir en Android Studio
1. Abre Android Studio
2. Click en "Open"
3. Navega a: `d:\work\lab\private-notes\mobile\android`
4. Click "OK"

### Paso 3: Compilar APK
1. Menu: Build > Build Bundle(s) / APK(s) > Build APK(s)
2. La APK se generará en:
   `d:\work\lab\private-notes\mobile\android\app\build\outputs\apk\debug\app-debug.apk`

---

## Para instalar directamente en el móvil (vía ADB)

Si tienes un móvil Android conectado y con "Depuración USB" activa:

```powershell
adb install -r d:\work\lab\private-notes\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

