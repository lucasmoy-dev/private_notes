## Option 1: Use Docker (RECOMMENDED)

If you have Docker Desktop installed, this is the cleanest and safest way:

1. Ensure **Docker Desktop** is open.
2. Run in PowerShell:
   ```powershell
   cd d:\work\lab\private-notes
   npm run build
   cd sources/mobile
   npx cap sync android
   docker-compose up --build
   ```
3. The APK will be generated at:
   `releases/private-notes-latest.apk` (if using the release script) or
   `sources/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Option 2: Use Android Studio (Alternative)

### Step 1: Prepare the project
Run from PowerShell:
```powershell
cd d:\work\lab\private-notes
npm run build
cd sources/mobile
npx cap copy
npx cap sync android
```

### Step 2: Open in Android Studio
1. Open Android Studio
2. Click on "Open"
3. Navigate to: `d:\work\lab\private-notes\sources\mobile\android`
4. Click "OK"

### Step 3: Compile APK
1. Menu: Build > Build Bundle(s) / APK(s) > Build APK(s)
2. The APK will be generated at:
   `sources/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## To install directly on mobile (via ADB)

If you have an Android device connected and "USB Debugging" enabled:

```powershell
adb install -r d:\work\lab\private-notes\sources\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```
