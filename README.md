# 🔐 Private Notes

A secure, privacy-focused note-taking application with end-to-end encryption, biometric authentication, and local folder synchronization (compatible with Syncthing).

## 🏗️ Project Structure

The project is organized into modular components:

- **`sources/webapp`**: Core logic and UI of the Private Notes PWA.
- **`sources/mobile`**: Capacitor wrapper and native Android project.
- **`sources/scripts`**: Utility scripts for versioning, building, and Git automation.
- **`releases/`**: Production-ready binaries and web builds.
  - `webapp/`: Optimized production build for web hosting.
  - `private-notes-vX.X.X.apk`: Android application packages.
  - `private-notes-latest.apk`: The most recently compiled APK.

## 🚀 Release Process

We use a consolidated, interactive release manager. From the root directory, run:

### Windows (PowerShell)
```powershell
.\release.ps1
```

This menu allows you to choose between:
1. **WebApp Release**: Increments version, builds the web app, copies it to `releases/webapp/`, and pushes to Git.
2. **Android Release**: Increments version, syncs Capacitor assets, compiles the APK via Docker, and pushes to Git.

## 🛠️ Development & Requirements

### WebApp
Navigate to `sources/webapp`:
```bash
npm install
npm run dev
```

### Mobile (Android)
Compilation is fully automated via **Docker** to ensure a consistent build environment across different machines.
- **Requirement**: Docker Desktop must be installed and running.
- The build process automatically handles Android SDK, Gradle, and Java configurations within the container.

## 🔒 Security & Sync Features
- **End-to-End Encryption**: AES-256-GCM + GZIP compression for minimum storage footprint.
- **Zero-Knowledge**: Your master password is never stored or transmitted.
- **Biometric Authentication**: Native fingerprint support (WebAuthn/Biometrics) for instant access.
- **Local Sync Mode**: Save notes to a specific folder in your device storage (Documents).
- **External Sync Support**: Designed to work perfectly with **Syncthing** or **FolderSync** for multi-device synchronization without a central server.

---
**Made with ❤️ for privacy-conscious note-takers**
