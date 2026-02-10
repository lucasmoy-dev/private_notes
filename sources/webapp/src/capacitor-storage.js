import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { SecurityService as Security } from './security.js';

const DEFAULT_BASE_DIR = 'PrivateNotes';

export class CapacitorFileStorage {
    static getBaseDir() {
        return localStorage.getItem(KEYS.LOCAL_SYNC_FOLDER) || DEFAULT_BASE_DIR;
    }

    static async connectFolder(folderName = null) {
        if (folderName) {
            localStorage.setItem(KEYS.LOCAL_SYNC_FOLDER, folderName);
        }
        const BASE_DIR = this.getBaseDir();

        try {
            // Check and request permissions
            const status = await Filesystem.requestPermissions();
            if (status.publicStorage !== 'granted') {
                throw new Error('Permiso denegado. Habilita el acceso al almacenamiento.');
            }

            // Ensure directory exists
            try {
                await Filesystem.mkdir({
                    path: BASE_DIR,
                    directory: Directory.Documents,
                    recursive: true
                });
            } catch (e) {
                // If mkdir fails, verify if it's because it already exists and we have access
                try {
                    await Filesystem.stat({
                        path: BASE_DIR,
                        directory: Directory.Documents
                    });
                } catch (statError) {
                    console.error('[Capacitor] mkdir failed and stat failed', e, statError);
                    throw new Error(`No se pudo acceder a la carpeta "${BASE_DIR}".`);
                }
            }

            return { capacitor: true, folder: BASE_DIR };
        } catch (e) {
            console.error('[Capacitor] Connection failed', e);
            throw e;
        }
    }

    static async getHandleStatus() {
        const BASE_DIR = this.getBaseDir();
        // If the user hasn't explicitly clicked "Connect" ever, we don't want to show "Connected" 
        // even if the folder exists by chance. 
        const isEnabled = localStorage.getItem(KEYS.LOCAL_SYNC_FOLDER) !== null;
        if (!isEnabled) return { hasHandle: false, permission: 'none' };

        try {
            await Filesystem.stat({
                path: BASE_DIR,
                directory: Directory.Documents
            });
            return { hasHandle: true, permission: 'granted', folder: BASE_DIR };
        } catch (e) {
            return { hasHandle: false, permission: 'none', folder: BASE_DIR };
        }
    }

    static async pushData(notes, categories, vaultKey, noteIds = null) {
        const BASE_DIR = this.getBaseDir();
        console.log(`[Capacitor] Pushing data to ${BASE_DIR} (Partial: ${!!noteIds})...`);

        // 1. Save Meta/Index
        const indexData = notes.map((n, i) => ({
            id: n.id,
            folder: Math.floor(i / 500).toString().padStart(3, '0')
        }));

        const meta = {
            categories,
            index: indexData,
            updatedAt: Date.now()
        };

        const encryptedMeta = await Security.encrypt(meta, vaultKey);
        await this._writeFile('metadata.bin', JSON.stringify(encryptedMeta));

        // 2. Save Notes
        const notesToPush = noteIds
            ? notes.filter(n => noteIds.includes(n.id))
            : notes;

        for (const note of notesToPush) {
            const globalIndex = notes.findIndex(n => n.id === note.id);
            if (globalIndex === -1) continue;

            const folderName = Math.floor(globalIndex / 500).toString().padStart(3, '0');
            const dirPath = `${BASE_DIR}/notes/${folderName}`;

            try {
                await Filesystem.mkdir({
                    path: dirPath,
                    directory: Directory.Documents,
                    recursive: true
                });
            } catch (e) { }

            const filename = await Security.hash(note.id);
            const encryptedNote = await Security.encrypt(note, vaultKey);

            await Filesystem.writeFile({
                path: `${dirPath}/${filename}.bin`,
                data: JSON.stringify(encryptedNote),
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });
        }

        console.log('[Capacitor] Push complete.');
    }

    static async pullData(vaultKey) {
        const BASE_DIR = this.getBaseDir();
        try {
            // Check if directory exists and metadata exists
            try {
                await Filesystem.stat({
                    path: `${BASE_DIR}/metadata.bin`,
                    directory: Directory.Documents
                });
            } catch (e) {
                console.log('[Capacitor] metadata.bin not found, folder might be empty or new.');
                return null;
            }

            const metaContent = await Filesystem.readFile({
                path: `${BASE_DIR}/metadata.bin`,
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });

            const meta = await Security.decrypt(JSON.parse(metaContent.data), vaultKey);
            if (!meta || !meta.index) return null;

            const notes = [];
            for (const item of meta.index) {
                try {
                    const filename = await Security.hash(item.id);
                    const notePath = `${BASE_DIR}/notes/${item.folder}/${filename}.bin`;
                    const noteContent = await Filesystem.readFile({
                        path: notePath,
                        directory: Directory.Documents,
                        encoding: Encoding.UTF8
                    });
                    const note = await Security.decrypt(JSON.parse(noteContent.data), vaultKey);
                    if (note) notes.push(note);
                } catch (err) {
                    console.warn(`[Capacitor] Failed to load note ${item.id}`, err);
                }
            }

            return { notes, categories: meta.categories || [] };
        } catch (e) {
            console.error('[Capacitor] Pull failed', e);
            // Re-throw if it's a security/decryption error so the UI can show it
            if (e.message.includes('Contraseña') || e.message.includes('decrypt')) {
                throw e;
            }
            return null;
        }
    }

    static async getMetadata(vaultKey) {
        const BASE_DIR = this.getBaseDir();
        try {
            const metaContent = await Filesystem.readFile({
                path: `${BASE_DIR}/metadata.bin`,
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });
            return await Security.decrypt(JSON.parse(metaContent.data), vaultKey);
        } catch (e) {
            return null;
        }
    }

    static async _writeFile(name, content) {
        const BASE_DIR = this.getBaseDir();
        await Filesystem.writeFile({
            path: `${BASE_DIR}/${name}`,
            data: content,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
        });
    }

    static async setFolder(name) {
        localStorage.setItem(KEYS.LOCAL_SYNC_FOLDER, name);
    }
}
