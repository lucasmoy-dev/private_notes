# 📱 Android APK Compilation

## ✅ Project Status
- ✅ Capacitor project configured
- ✅ Web assets synced
- ✅ Storage permissions added
- ✅ Code adapted for Capacitor detection
- ⚠️ Requires Android Studio to compile the APK

## 🛠️ Compiling the APK

### Option 1: Using Android Studio (Recommended)

1. Open **Android Studio**
2. Select **"Open an Existing Project"**
3. Navigate to: `d:\work\lab\private-notes\sources\mobile\android`
4. Wait for Gradle to sync (may take a few minutes the first time)
5. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
6. Once finished, click on **"Locate"** to open the folder with the APK

**APK Location:**
```
d:\work\lab\private-notes\sources\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

### Option 2: Using Command Line

If you have Android Studio installed and configured:

```powershell
cd d:\work\lab\private-notes\sources\mobile\android
.\gradlew.bat assembleDebug
```

The APK will be generated in the same location mentioned above.

## 🔄 Updating the APK after code changes

Every time you make changes to the web code:

```powershell
# From the project root
.\sources\mobile\build.ps1
```

This script:
1. Builds the webapp (`npm run build`)
2. Copies assets to Capacitor (`npx cap copy`)
3. Syncs with Android (`npx cap sync android`)

Then recompile the APK with Android Studio or Gradle.

## 📂 Mobile Project Structure

```
mobile/
├── android/              # Native Android project
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/
│   │               └── debug/
│   │                   └── app-debug.apk  ← APK HERE
│   └── local.properties  # SDK Configuration
├── capacitor.config.json # Capacitor Configuration
├── build.ps1            # Build script
└── package.json         # Capacitor dependencies
```

## 🔍 Verify everything works

Once the APK is installed on your mobile:

1. Open the "PrivateNotes" app
2. Go to **Settings > Sync**
3. You should see **"Phone Storage"** instead of "Local Folder"
4. Upon activating sync, notes will be saved in:
   ```
   /storage/emulated/0/Documents/PrivateNotes/
   ```

## 🔐 Mobile Mode Features

- ✅ Native storage in the documents folder
- ✅ Compatible with sync apps (Syncthing, FolderSync, etc.)
- ✅ Same AES-256-GCM encryption as the web version
- ✅ Automatic environment detection (web vs mobile)
- ✅ Automatic synchronization on app open/close

## ⚠️ Important Notes

- The APK generated with `assembleDebug` is for testing only
- To publish on Play Store, you need `assembleRelease` and to sign the APK
- The first build may take several minutes while downloading dependencies
