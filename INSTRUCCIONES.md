# CloudNotes PWA Setup Guide

Esta es una prueba de concepto (POC) de una aplicación de notas tipo Google Keep con sincronización en la nube utilizando Google Drive.

## Tecnologías Utilizadas
- **Core**: Vanilla HTML, CSS y JavaScript.
- **Sincronización**: Google Drive API (gapi) y Google Identity Services (gis).
- **Offline**: Service Worker y Manifest para soporte PWA.

## Configuración de Google Drive Sync

Para que el botón de **Sincronizar** funcione, debes obtener un `CLIENT_ID` de Google Cloud Console:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto.
3. Activa la **Google Drive API** en "APIs & Services" > "Library".
4. Configura la **OAuth Consent Screen** (elige "External" y añade tu email como tester).
5. Crea credenciales de tipo **OAuth Client ID** para una "Web Application".
6. Añade los orígenes autorizados:
   - `http://localhost:5173` (para desarrollo local).
   - `https://[TU-USUARIO].github.io` (para producción).
7. Copia el Client ID y pégalo en el archivo `main.js`:
   ```javascript
   const CLIENT_ID = 'TU_CLIENT_ID_AQUÍ';
   ```

## Cómo ejecutar localmente

1. Asegúrate de tener Node.js instalado.
2. Abre la terminal en esta carpeta.
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Publicación en GitHub Pages

1. Sube este código a un repositorio de GitHub.
2. Configura los **Authorized JavaScript Origins** en Google Cloud Console para incluir la URL de tu repositorio en GitHub Pages.
3. En la configuración del repositorio en GitHub, ve a **Pages** y selecciona la rama `main` (o utiliza acciones de GitHub para el despliegue de Vite).

---
*Nota: Para el despliegue con Vite en GitHub Pages, recuerda revisar la configuración de `base` en `vite.config.js` si el proyecto no está en el root del dominio.*
