
/**
 * Google Drive Module
 * Handles note grouping, folder paths, and synchronization
 */
import { SecurityService as Security } from './security.js';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';

export class DriveSync {
    constructor(dbPrefix = 'notev3_', folderPath = '/backup/notes/', notesPerChunk = 50) {
        this.basePath = folderPath;
        this.dbPrefix = dbPrefix;
        this.notesPerChunk = notesPerChunk;
        this.metaFile = `${dbPrefix}meta_v4.bin`;
        this.groupPrefix = `${dbPrefix}group_v4_`;
    }

    /**
     * Gets the current GAPI access token
     * @private
     */
    _getAccessToken() {
        // Check both gapi.client (modern) and gapi.auth (legacy)
        const token = gapi?.client?.getToken() || gapi?.auth?.getToken();
        if (!token) throw new Error('Google API token not found. User might be signed out.');
        return token.access_token;
    }

    /**
     * Fetches a file from Google Drive
     * @private
     */
    async _fetchFile(fileId, asJson = true) {
        const url = `${DRIVE_API_BASE}/${fileId}?alt=media`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${this._getAccessToken()}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file ${fileId}: ${response.statusText}`);
        }

        return asJson ? response.json() : response.text();
    }

    /**
     * Lists files in a folder and returns a Map of filename -> fileId
     * @private
     */
    async _getFileMap(folderId) {
        const q = `'${folderId}' in parents and trashed = false`;
        const resp = await gapi.client.drive.files.list({ q, fields: 'files(id, name)' });
        const files = resp.result.files || [];
        return new Map(files.map(f => [f.name, f.id]));
    }

    async getOrCreateFolder(path) {
        const parts = path.split('/').filter(p => p);
        let parentId = 'root';

        for (const part of parts) {
            const q = `name = '${part}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
            const resp = await gapi.client.drive.files.list({ q, fields: 'files(id, name)' });
            const folders = resp.result.files || [];

            if (folders.length > 0) {
                parentId = folders[0].id;
            } else {
                const folderMetadata = {
                    name: part,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentId]
                };
                const createResp = await gapi.client.drive.files.create({
                    resource: folderMetadata,
                    fields: 'id'
                });
                parentId = createResp.result.id;
            }
        }
        return parentId;
    }

    async calculateHash(obj) {
        const str = JSON.stringify(obj);
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async saveChunks(notes, categories, vaultKey, folderId) {
        console.log(`[Drive] Saving ${notes.length} notes in groups of ${this.notesPerChunk}`);

        const fileMap = await this._getFileMap(folderId);

        // Load Meta to check for changes
        let oldMeta = null;
        const metaId = fileMap.get(this.metaFile);
        if (metaId) {
            try {
                const encrypted = await this._fetchFile(metaId);
                oldMeta = await Security.decrypt(encrypted, vaultKey);
            } catch (e) {
                console.warn("[Drive] Could not load previous meta, proceeding with full sync.", e);
            }
        }

        // Prepare chunks
        const noteGroups = [];
        for (let i = 0; i < notes.length; i += this.notesPerChunk) {
            noteGroups.push(notes.slice(i, i + this.notesPerChunk));
        }

        const groupHashes = {};
        const uploadPromises = [];

        // Upload/Update Groups
        for (let i = 0; i < noteGroups.length; i++) {
            const hash = await this.calculateHash(noteGroups[i]);
            groupHashes[i] = hash;

            const fileName = `${this.groupPrefix}${i.toString().padStart(5, '0')}.bin`;
            const existingId = fileMap.get(fileName);
            const needsUpload = !oldMeta || !oldMeta.groupHashes || oldMeta.groupHashes[i] !== hash || !existingId;

            if (needsUpload) {
                const uploadTask = (async () => {
                    const encrypted = await Security.encrypt(noteGroups[i], vaultKey);
                    await this.uploadFileWithId(fileName, JSON.stringify(encrypted), folderId, existingId);
                    console.log(`[Drive] ${existingId ? 'Updated' : 'Created'} ${fileName}`);
                })();
                uploadPromises.push(uploadTask);
            }
        }

        // Wait for all group uploads
        await Promise.all(uploadPromises);

        // Clean up orphans
        if (oldMeta && oldMeta.groupHashes) {
            const oldIndices = Object.keys(oldMeta.groupHashes).map(Number);
            const deletePromises = oldIndices
                .filter(idx => idx >= noteGroups.length)
                .map(async idx => {
                    const fileName = `${this.groupPrefix}${idx.toString().padStart(5, '0')}.bin`;
                    const fileId = fileMap.get(fileName);
                    if (fileId) {
                        await gapi.client.drive.files.delete({ fileId });
                        console.log(`[Drive] Deleted orphaned group: ${fileName}`);
                    }
                });
            await Promise.all(deletePromises);
        }

        // Update Meta
        const metaData = { categories, groupHashes };
        const encryptedMeta = await Security.encrypt(metaData, vaultKey);
        await this.uploadFileWithId(this.metaFile, JSON.stringify(encryptedMeta), folderId, metaId);

        console.log("[Drive] Push complete.");
        return noteGroups.length;
    }

    async loadChunks(folderId, vaultKey) {
        const fileMap = await this._getFileMap(folderId);

        // Try Modern System (v4)
        const metaId = fileMap.get(this.metaFile);
        if (metaId) {
            try {
                const metaEnc = await this._fetchFile(metaId);
                const meta = await Security.decrypt(metaEnc, vaultKey);

                console.log(`[Drive] Loading v4 data. Groups: ${Object.keys(meta.groupHashes).length}`);

                const indices = Object.keys(meta.groupHashes).sort((a, b) => a - b);
                const chunkPromises = indices.map(async (idx) => {
                    const fileName = `${this.groupPrefix}${idx.toString().padStart(5, '0')}.bin`;
                    const fileId = fileMap.get(fileName);
                    if (!fileId) return [];

                    const encryptedChunk = await this._fetchFile(fileId);
                    return await Security.decrypt(encryptedChunk, vaultKey);
                });

                const chunksResults = await Promise.all(chunkPromises);
                const notes = chunksResults.flat();

                return { notes, categories: meta.categories };
            } catch (e) {
                console.error("[Drive] v4 Load failed, checking legacy...", e);
            }
        }

        // Fallback Legacy (v3)
        const legacyPrefix = 'data_part_';
        const legacyFiles = Array.from(fileMap.entries())
            .filter(([name]) => name.startsWith(this.dbPrefix + legacyPrefix))
            .sort((a, b) => a[0].localeCompare(b[0]));

        if (legacyFiles.length > 0) {
            console.log(`[Drive] Migrating ${legacyFiles.length} legacy chunks...`);
            try {
                const legacyPromises = legacyFiles.map(([_, id]) => this._fetchFile(id, false));
                const parts = await Promise.all(legacyPromises);
                const fullData = parts.join('');
                const cloudEncrypted = JSON.parse(fullData);
                return await Security.decrypt(cloudEncrypted, vaultKey);
            } catch (e) {
                console.error('[Drive] Legacy migration failed', e);
            }
        }

        return null;
    }

    async uploadFileWithId(name, content, folderId, fileId = null) {
        const accessToken = this._getAccessToken();
        const blob = new Blob([content], { type: 'application/json' });

        if (fileId) {
            const url = `${DRIVE_UPLOAD_BASE}/${fileId}?uploadType=media`;
            const resp = await fetch(url, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: blob
            });
            if (!resp.ok) throw new Error(`Failed to update file ${name}`);
        } else {
            const url = `${DRIVE_UPLOAD_BASE}?uploadType=multipart`;
            const metadata = { name, parents: [folderId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: form
            });
            if (!resp.ok) throw new Error(`Failed to create file ${name}`);
        }
    }
}
