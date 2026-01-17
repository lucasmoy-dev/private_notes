
/**
 * Google Drive Module
 * Handles note grouping, folder paths, and synchronization
 */
import { SecurityService as Security } from './security.js';

export class DriveSync {
    constructor(dbPrefix = 'notev3_', folderPath = '/backup/notes/', notesPerChunk = 50) {
        this.basePath = folderPath;
        this.dbPrefix = dbPrefix;
        this.notesPerChunk = notesPerChunk;
        this.metaFile = dbPrefix + 'meta_v4.bin';
        this.groupPrefix = dbPrefix + 'group_v4_';
    }

    async getOrCreateFolder(path) {
        const parts = path.split('/').filter(p => p);
        let parentId = 'root';

        for (const part of parts) {
            const q = `name = '${part}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
            const resp = await gapi.client.drive.files.list({ q, fields: 'files(id, name)' });
            const folders = resp.result.files;

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
        const msgUint8 = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async saveChunks(notes, categories, pass, folderId) {
        console.log(`[Drive] Saving ${notes.length} notes in groups of ${this.notesPerChunk}`);

        // 1. Get all files in folder once to check for existence/updates
        const q = `'${folderId}' in parents and trashed = false`;
        const resp = await gapi.client.drive.files.list({ q, fields: 'files(id, name)' });
        const existingFiles = resp.result.files || [];
        const fileMap = new Map(existingFiles.map(f => [f.name, f.id]));

        // 2. Load Meta
        let oldMeta = null;
        const metaId = fileMap.get(this.metaFile);
        if (metaId) {
            try {
                const accessToken = gapi.auth.getToken().access_token;
                const url = `https://www.googleapis.com/drive/v3/files/${metaId}?alt=media`;
                const fileResp = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                const encrypted = await fileResp.json();
                oldMeta = await Security.decrypt(encrypted, pass);
            } catch (e) { console.log("Failed to load previous meta."); }
        }

        const groupHashes = {};
        const noteGroups = [];
        for (let i = 0; i < notes.length; i += this.notesPerChunk) {
            noteGroups.push(notes.slice(i, i + this.notesPerChunk));
        }

        // 3. Upload/Update Groups
        for (let i = 0; i < noteGroups.length; i++) {
            const hash = await this.calculateHash(noteGroups[i]);
            groupHashes[i] = hash;

            const needsUpload = !oldMeta || !oldMeta.groupHashes || oldMeta.groupHashes[i] !== hash;
            const fileName = `${this.groupPrefix}${i.toString().padStart(5, '0')}.bin`;

            if (needsUpload || !fileMap.has(fileName)) {
                const encrypted = await Security.encrypt(noteGroups[i], pass);
                await this.uploadFileWithId(fileName, JSON.stringify(encrypted), folderId, fileMap.get(fileName));
                console.log(`[Drive] ${fileMap.has(fileName) ? 'Updated' : 'Created'} ${fileName}`);
            }
        }

        // 4. Clean up orphans
        if (oldMeta && oldMeta.groupHashes) {
            const oldIndices = Object.keys(oldMeta.groupHashes).map(Number);
            for (const idx of oldIndices) {
                if (idx >= noteGroups.length) {
                    const fileName = `${this.groupPrefix}${idx.toString().padStart(5, '0')}.bin`;
                    const fileId = fileMap.get(fileName);
                    if (fileId) {
                        await gapi.client.drive.files.delete({ fileId });
                        console.log(`[Drive] Deleted orphaned group: ${fileName}`);
                    }
                }
            }
        }

        // 5. Update Meta
        const metaData = { categories, groupHashes };
        const encryptedMeta = await Security.encrypt(metaData, pass);
        await this.uploadFileWithId(this.metaFile, JSON.stringify(encryptedMeta), folderId, metaId);

        console.log("[Drive] Push complete.");
        return noteGroups.length;
    }

    async loadChunks(folderId, pass) {
        // 1. Get all files
        const q = `'${folderId}' in parents and trashed = false`;
        const resp = await gapi.client.drive.files.list({ q, fields: 'files(id, name)' });
        const existingFiles = resp.result.files || [];
        const fileMap = new Map(existingFiles.map(f => [f.name, f.id]));

        // 2. Try New System
        const metaId = fileMap.get(this.metaFile);
        if (metaId) {
            try {
                const accessToken = gapi.auth.getToken().access_token;
                const metaUrl = `https://www.googleapis.com/drive/v3/files/${metaId}?alt=media`;
                const metaResp = await fetch(metaUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                const metaEnc = await metaResp.json();
                const meta = await Security.decrypt(metaEnc, pass);

                console.log(`[Drive] Loading v4 data. Groups: ${Object.keys(meta.groupHashes).length}`);
                const notes = [];
                const indices = Object.keys(meta.groupHashes).sort((a, b) => a - b);

                for (const idx of indices) {
                    const fileName = `${this.groupPrefix}${idx.toString().padStart(5, '0')}.bin`;
                    const fileId = fileMap.get(fileName);
                    if (fileId) {
                        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
                        const fResp = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                        const enc = await fResp.json();
                        const gNotes = await Security.decrypt(enc, pass);
                        notes.push(...gNotes);
                    }
                }
                return { notes, categories: meta.categories };
            } catch (e) { console.error("[Drive] v4 Load failed", e); }
        }

        // 3. Fallback Legacy
        const legacyPrefix = 'data_part_';
        const legacyFiles = existingFiles
            .filter(f => f.name.startsWith(this.dbPrefix + legacyPrefix))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (legacyFiles.length > 0) {
            console.log(`[Drive] Migrating ${legacyFiles.length} legacy chunks...`);
            const accessToken = gapi.auth.getToken().access_token;
            let fullData = "";
            for (const file of legacyFiles) {
                const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
                const fileResp = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                fullData += await fileResp.text();
            }
            try {
                const cloudEncrypted = JSON.parse(fullData);
                return await Security.decrypt(cloudEncrypted, pass);
            } catch (e) { console.error('[Drive] Legacy migration failed', e); }
        }

        return null;
    }

    async uploadFileWithId(name, content, folderId, fileId = null) {
        const metadata = { name, parents: fileId ? [] : [folderId] };
        const blob = new Blob([content], { type: 'application/json' });
        const accessToken = gapi.auth.getToken().access_token;

        if (fileId) {
            const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
            await fetch(url, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}` }, body: blob });
        } else {
            const url = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);
            await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form });
        }
    }
}
