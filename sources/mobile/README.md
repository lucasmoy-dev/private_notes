# 📱 Compilación de APK para Android

## ✅ Estado del Proyecto
- ✅ Proyecto Capacitor configurado
- ✅ Assets web sincronizados
- ✅ Permisos de almacenamiento añadidos
- ✅ Código adaptado para detectar Capacitor
- ⚠️ Requiere Android Studio para compilar la APK

## 🛠️ Compilar la APK

### Opción 1: Usando Android Studio (Recomendado)

1. Abre **Android Studio**
2. Selecciona **"Open an Existing Project"**
3. Navega a: `d:\work\lab\private-notes\mobile\android`
4. Espera a que Gradle sincronice (puede tardar unos minutos la primera vez)
5. Ve a **Build > Build Bundle(s) / APK(s) > Build APK(s)**
6. Una vez termine, haz clic en **"Locate"** para abrir la carpeta con la APK

**Ubicación de la APK:**
```
d:\work\lab\private-notes\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

### Opción 2: Usando Línea de Comandos

Si tienes Android Studio instalado y configurado:

```powershell
cd d:\work\lab\private-notes\mobile\android
.\gradlew.bat assembleDebug
```

La APK se generará en la misma ubicación mencionada arriba.

## 🔄 Actualizar la APK después de cambios en el código

Cada vez que hagas cambios en el código web:

```powershell
# Desde la raíz del proyecto
.\mobile\build.ps1
```

Este script:
1. Compila la webapp (`npm run build`)
2. Copia los assets a Capacitor (`npx cap copy`)
3. Sincroniza con Android (`npx cap sync android`)

Luego vuelve a compilar la APK con Android Studio o Gradle.

## 📂 Estructura del Proyecto Móvil

```
mobile/
├── android/              # Proyecto Android nativo
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/
│   │               └── debug/
│   │                   └── app-debug.apk  ← APK AQUÍ
│   └── local.properties  # Configuración del SDK
├── capacitor.config.json # Configuración de Capacitor
├── build.ps1            # Script de compilación
└── package.json         # Dependencias de Capacitor

## 🔍 Verificar que todo funciona

Una vez instalada la APK en tu móvil:

1. Abre la app "PrivateNotes"
2. Ve a **Configuración > Sincronización**
3. Deberías ver **"Memoria del Teléfono"** en lugar de "Carpeta Local"
4. Al activar la sincronización, las notas se guardarán en:
   ```
   /storage/emulated/0/Documents/PrivateNotes/
   ```

## 🔐 Características del Modo Móvil

- ✅ Almacenamiento nativo en la carpeta de documentos
- ✅ Compatible con apps de sincronización (Syncthing, FolderSync, etc.)
- ✅ Misma encriptación AES-256-GCM que la versión web
- ✅ Detección automática del entorno (web vs móvil)
- ✅ Sincronización automática al abrir/cerrar la app

## ⚠️ Notas Importantes

- La APK generada con `assembleDebug` es solo para pruebas
- Para publicar en Play Store, necesitas `assembleRelease` y firmar la APK
- El primer build puede tardar varios minutos mientras descarga dependencias
