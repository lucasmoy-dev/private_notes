import { SecurityService as Security } from './security.js';
import { KEYS } from './constants.js';
import { CapacitorFileStorage } from './capacitor-storage.js';

const isCapacitor = () => !!window.Capacitor;

/**
 * FileStorage Service
 * Uses File System Access API to store notes in a local folder.
 * Delegated to CapacitorFileStorage if running on native mobile.
 */
export class FileStorage {
    static dbName = 'FileHandleDB';
    static storeName = 'handles';

    /**
     * Open IndexedDB to store/retrieve directory handles
     */
    static async _openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(this.storeName);
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async _getHandle() {
        const db = await this._openDB();
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        return new Promise((resolve) => {
            const req = store.get('root');
            req.onsuccess = () => resolve(req.result);
        });
    }

    static async _setHandle(handle) {
        const db = await this._openDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        return new Promise((resolve) => {
            const req = store.put(handle, 'root');
            req.onsuccess = () => resolve();
        });
    }

    static async setLocalCache(key, data) {
        const db = await this._openDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        return new Promise((resolve) => {
            const req = store.put(data, key);
            req.onsuccess = () => resolve();
        });
    }

    static async getLocalCache(key) {
        const db = await this._openDB();
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        return new Promise((resolve) => {
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
        });
    }

    /**
     * Request folder permission from user
     */
    static async connectFolder() {
        if (isCapacitor()) {
            try {
                const handle = await CapacitorFileStorage.connectFolder();
                await this._setHandle(handle);
                return handle;
            } catch (e) {
                console.error('[Storage] Capacitor connection failed', e);
                throw e;
            }
        }
        try {
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            await this._setHandle(handle);
            return handle;
        } catch (e) {
            console.error('[Storage] Connection failed', e);
            throw e;
        }
    }

    /**
     * Check if folder is connected and has permission
     */
    static async getHandle(requestPermission = true) {
        const handle = await this._getHandle();
        if (!handle) return null;

        if (isCapacitor()) return handle;

        const options = { mode: 'readwrite' };
        let permission = await handle.queryPermission(options);

        if (permission === 'granted') {
            return handle;
        }

        if (requestPermission) {
            permission = await handle.requestPermission(options);
            if (permission === 'granted') {
                return handle;
            }
        }

        return null;
    }

    static async getHandleStatus() {
        if (isCapacitor()) return CapacitorFileStorage.getHandleStatus();
        const handle = await this._getHandle();
        if (!handle) return { hasHandle: false, permission: 'none' };

        try {
            const permission = await handle.queryPermission({ mode: 'readwrite' });
            return { hasHandle: true, permission };
        } catch (e) {
            return { hasHandle: true, permission: 'denied' };
        }
    }

    /**
     * Save data to the connected folder. 
     * If noteIds is provided, only those specific notes are written to disk.
     */
    static async pushData(notes, categories, vaultKey, noteIds = null) {
        if (isCapacitor()) return CapacitorFileStorage.pushData(notes, categories, vaultKey, noteIds);
        const handle = await this.getHandle(false);
        if (!handle) return;

        console.log(`[Storage] Pushing data to local folder (Partial: ${!!noteIds})...`);

        // 1. Save Meta/Index (Always update metadata to keep index/categories consistent)
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
        await this._writeFile(handle, 'metadata.bin', JSON.stringify(encryptedMeta));

        // 2. Save Notes
        const notesDir = await handle.getDirectoryHandle('notes', { create: true });

        // Filter notes to write if specific IDs provided
        const notesToPush = noteIds
            ? notes.filter(n => noteIds.includes(n.id))
            : notes;

        for (const note of notesToPush) {
            // We need to find the correct folder based on the GLOBAL index
            const globalIndex = notes.findIndex(n => n.id === note.id);
            if (globalIndex === -1) continue;

            const folderName = Math.floor(globalIndex / 500).toString().padStart(3, '0');
            const subDir = await notesDir.getDirectoryHandle(folderName, { create: true });

            const filename = await Security.hash(note.id);
            const encryptedNote = await Security.encrypt(note, vaultKey);

            await this._writeFile(subDir, `${filename}.bin`, JSON.stringify(encryptedNote));
        }

        console.log('[Storage] Push complete.');
    }

    /**
     * Load data from connected folder
     */
    static async pullData(vaultKey) {
        if (isCapacitor()) return CapacitorFileStorage.pullData(vaultKey);
        const handle = await this.getHandle();
        if (!handle) return null;

        try {
            let meta;
            try {
                const metaFile = await handle.getFileHandle('metadata.bin');
                const metaContent = await (await metaFile.getFile()).text();
                meta = await Security.decrypt(JSON.parse(metaContent), vaultKey);
            } catch (e) {
                console.warn('[Storage] metadata.bin not found or invalid. Attempting to rebuild index from files...');
                return await this.rebuildIndex(vaultKey);
            }

            if (!meta || !meta.index) return await this.rebuildIndex(vaultKey);

            const notesDir = await handle.getDirectoryHandle('notes');
            const notes = [];

            for (const item of meta.index) {
                try {
                    const subDir = await notesDir.getDirectoryHandle(item.folder);
                    const filename = await Security.hash(item.id);
                    const noteFile = await subDir.getFileHandle(`${filename}.bin`);
                    const noteContent = await (await noteFile.getFile()).text();
                    const note = await Security.decrypt(JSON.parse(noteContent), vaultKey);
                    if (note) notes.push(note);
                } catch (err) {
                    console.warn(`[Storage] Failed to load note ${item.id}`, err);
                }
            }

            return { notes, categories: meta.categories || [] };
        } catch (e) {
            console.error('[Storage] Pull failed', e);
            return null;
        }
    }

    /**
     * Get only the metadata from the folder
     */
    static async getMetadata(vaultKey) {
        if (isCapacitor()) return CapacitorFileStorage.getMetadata(vaultKey);
        const handle = await this.getHandle(false);
        if (!handle) return null;

        try {
            const metaFile = await handle.getFileHandle('metadata.bin');
            const metaContent = await (await metaFile.getFile()).text();
            return await Security.decrypt(JSON.parse(metaContent), vaultKey);
        } catch (e) {
            return null;
        }
    }

    /**
     * Emergency scan of all subfolders to recover notes if index is lost
     */
    static async rebuildIndex(vaultKey) {
        const handle = await this.getHandle();
        if (!handle) return null;

        try {
            console.log('[Storage] Rebuilding index by scanning folder...');
            const notesDir = await handle.getDirectoryHandle('notes');
            const notes = [];

            for await (const entry of notesDir.values()) {
                if (entry.kind === 'directory') {
                    for await (const fileEntry of entry.values()) {
                        if (fileEntry.kind === 'file' && fileEntry.name.endsWith('.bin')) {
                            try {
                                const file = await fileEntry.getFile();
                                const content = await file.text();
                                const note = await Security.decrypt(JSON.parse(content), vaultKey);
                                if (note) notes.push(note);
                            } catch (err) {
                                // Likely wrong password or corrupted file
                            }
                        }
                    }
                }
            }

            console.log(`[Storage] Rebuild complete. Found ${notes.length} notes.`);
            if (notes.length > 0) {
                // Return data and let the caller save it (which will trigger a push with new metadata)
                return { notes, categories: [] };
            }
            return null;
        } catch (e) {
            console.error('[Storage] Rebuild failed', e);
            return null;
        }
    }

    static async _writeFile(dirHandle, name, content) {
        const fileHandle = await dirHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    /**
     * Temporary migration tool for .cnb files
     */
    static async migrateFromCNB(file, vaultKey) {
        const text = await file.text();
        const encrypted = JSON.parse(text);
        const data = await Security.decrypt(encrypted, vaultKey);

        if (!data || !data.notes) throw new Error('Invalid backup file');

        // Push this data to the folder
        await this.pushData(data.notes, data.categories || [], vaultKey);
        return data;
    }
}
