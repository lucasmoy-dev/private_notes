# 🔐 Private Notes

A secure, privacy-focused note-taking Progressive Web App (PWA) with end-to-end encryption, biometric authentication, and cloud synchronization.

## 🏗️ Project Structure

The project is organized as follows:

- **`sources/webapp`**: Core web application logic and assets.
- **`sources/mobile`**: Capacitor wrapper and Android native project.
- **`releases/`**: Compiled versions of the app.
  - `webapp/`: Production-ready web files.
  - `private-notes-vX.X.X.apk`: Android application packages.
- **`scripts/`**: Automation scripts for development and deployment.
  - `src/`: Core PowerShell logic scripts.
  - `android-release.sh`: Full release process for Android.
  - `web-release.sh`: Full release process for Web.

## 🚀 Release Process

To perform a new release, use the scripts in the `scripts/` folder. These scripts will automatically increment the version, build the project, update documentation, and push changes to Git.

### Web Release
```bash
./scripts/web-release.sh
```

### Android Release
```bash
./scripts/android-release.sh
```

## 🛠️ Development

### WebApp
Navigate to `sources/webapp`:
```bash
npm install
npm run dev
```

### Mobile (Android)
Compilation is handled via Docker to ensure environment consistency.
Requirement: **Docker Desktop** must be running.

## 🔒 Security First
- **End-to-End Encryption**: AES-256-GCM.
- **Zero-Knowledge**: Master password is never stored or transmitted.
- **Biometric Authentication**: WebAuthn support for quick unlocking.

---
**Made with ❤️ for privacy-conscious note-takers**
