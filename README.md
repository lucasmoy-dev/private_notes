# 🔐 Private Notes

A secure, privacy-focused note-taking Progressive Web App (PWA) with end-to-end encryption, biometric authentication, and cloud synchronization.

![Private Notes](./screenshot_auth.png)

## ✨ Features

### 🔒 **Security First**
- **End-to-End Encryption**: All notes are encrypted using AES-256-GCM before being stored
- **Master Password Protection**: Your vault is protected by a master password that never leaves your device
- **Biometric Authentication**: Unlock your vault using fingerprint or Face ID (WebAuthn)
- **Password-Protected Categories**: Add an extra layer of security to sensitive notes
- **Zero-Knowledge Architecture**: Your data is encrypted locally; even cloud backups are encrypted

### 📱 **Progressive Web App**
- **Install Anywhere**: Works on desktop, mobile, and tablet
- **Offline Support**: Access your notes even without internet connection
- **Native-Like Experience**: Fast, responsive, and feels like a native app
- **Auto-Updates**: Always get the latest features automatically

### ☁️ **Cloud Sync (Optional)**
- **Google Drive Integration**: Sync your encrypted notes across devices
- **Selective Sync**: Choose which notes to sync
- **Conflict Resolution**: Smart merging when editing from multiple devices
- **Privacy Preserved**: Notes are encrypted before upload

### 🎨 **Beautiful UI**
- **Dark & Light Themes**: Choose your preferred visual style
- **Rich Text Editing**: Format your notes with colors, styles, and more
- **Customizable Categories**: Organize notes with colored tags and icons
- **Responsive Design**: Optimized for all screen sizes

### 🌍 **Multi-Language**
- **English** (Default)
- **Spanish** (Español)
- Easy to add more languages

## 🚀 Quick Start

### Installation

1. **Visit the App**: Navigate to the deployed URL
2. **Install**: Click the "Install" button in your browser or app menu
3. **Create Vault**: Set up your master password (remember it - it cannot be recovered!)
4. **Start Writing**: Create your first note

### Usage

#### Creating Notes
1. Click the **"+ New Note"** button
2. Write your content
3. Assign a category (optional)
4. Notes auto-save as you type

#### Organizing with Categories
1. Go to **Settings** → **Manage Tags**
2. Create categories with custom colors and icons
3. Optionally add password protection to sensitive categories

#### Enabling Biometric Login
1. Enter your master password
2. Click **"Enable Biometrics / FaceID"**
3. Follow your device's prompts
4. Next time, unlock with your fingerprint or face!

#### Cloud Sync Setup
1. Go to **Settings** → **Sync**
2. Click **"Connect with Google Drive"**
3. Authorize the app
4. Your encrypted notes will sync automatically

## 🛠️ Development

### Prerequisites
- Node.js 16+ and npm

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/private_notes.git
cd private_notes

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploy

```bash
# Using the deploy script (requires GitHub Pages setup)
./deploy.ps1  # Windows
./deploy.sh   # Linux/Mac
```

## 🏗️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Authentication**: WebAuthn API
- **Build Tool**: Vite
- **Storage**: IndexedDB (via localForage)
- **Cloud Sync**: Google Drive API

## 🔐 Security Architecture

### Encryption Flow

```
User Password → PBKDF2 (100k iterations) → Vault Key
                                              ↓
Note Content → AES-256-GCM (Vault Key) → Encrypted Note → Storage/Cloud
```

### Key Points
- Master password is **never stored** anywhere
- Vault key is derived from password using PBKDF2 with 100,000 iterations
- Each note is encrypted individually with a unique IV
- Biometric authentication uses WebAuthn (FIDO2 standard)
- Cloud backups contain only encrypted data

## 📁 Project Structure

```
private_notes/
├── public/
│   ├── favicon.png
│   ├── manifest.json
│   └── sw.js (Service Worker)
├── src/
│   ├── components/
│   │   ├── AuthShield.js
│   │   ├── CategoryManager.js
│   │   ├── CommonUI.js
│   │   ├── Editor.js
│   │   ├── Layout.js
│   │   ├── NotesGrid.js
│   │   ├── Settings.js
│   │   └── Sidebar.js
│   ├── auth.js
│   ├── constants.js
│   ├── drive.js
│   ├── i18n.js
│   ├── security.js
│   ├── state.js
│   └── ui-utils.js
├── index.html
├── main.js
├── style.css
└── vite.config.js
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web standards
- Inspired by privacy-focused note-taking apps
- Icons by [Lucide](https://lucide.dev/)

## ⚠️ Important Notes

- **Your master password cannot be recovered** - make sure to remember it!
- Biometric authentication requires HTTPS (or localhost for development)
- Cloud sync requires a Google account
- This is a client-side only app - no server stores your data

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/private_notes/issues) page
2. Create a new issue with detailed information
3. Use the "Force Cleanup & Reload" option in settings if experiencing UI issues

---

**Made with ❤️ for privacy-conscious note-takers**
