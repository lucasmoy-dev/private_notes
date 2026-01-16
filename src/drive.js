
/**
 * Google Drive Module
 * Handles chunking, folder paths, and synchronization
 */

export class DriveSync {
    constructor(dbFileName = 'chunk_', folderPath = 'database/notes') {
        this.basePath = folderPath;
        this.dbPrefix = dbFileName;
        this.chunkSizeLimit = 100 * 1024; // 100KB
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

    async saveChunks(data, folderId) {
        // 1. Convert to encrypted string if not already
        const serialized = JSON.stringify(data);
        const chunks = [];

        for (let i = 0; i < serialized.length; i += this.chunkSizeLimit) {
            chunks.push(serialized.substring(i, i + this.chunkSizeLimit));
        }

        // 2. Clear old chunks in Drive (Simple strategy for POC: delete or mark)
        // In a real app, we'd compare versions. Here we overwrite/update.
        for (let i = 0; i < chunks.length; i++) {
            const fileName = `${this.dbPrefix}${i}.json`;
            await this.uploadFile(fileName, chunks[i], folderId);
        }

        // Return count for metadata tracking
        return chunks.length;
    }

    async uploadFile(name, content, folderId) {
        // Search if file exists
        const q = `name = '${name}' and '${folderId}' in parents and trashed = false`;
        const resp = await gapi.client.drive.files.list({ q, fields: 'files(id)' });
        const files = resp.result.files;
        const fileId = files.length > 0 ? files[0].id : null;

        const metadata = { name, parents: fileId ? [] : [folderId] };
        const blob = new Blob([content], { type: 'application/json' });

        const accessToken = gapi.auth.getToken().access_token;
        const method = fileId ? 'PATCH' : 'POST';
        const url = fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`
            : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

        if (fileId) {
            await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: blob
            });
        } else {
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);
            await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: form
            });
        }
    }

    async loadChunks(folderId) {
        const q = `name contains '${this.dbPrefix}' and '${folderId}' in parents and trashed = false`;
        const resp = await gapi.client.drive.files.list({
            q,
            fields: 'files(id, name)',
            orderBy: 'name'
        });
        const files = resp.result.files;

        let fullData = "";
        for (const file of files) {
            const fileResp = await gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });
            fullData += typeof fileResp.result === 'string' ? fileResp.result : JSON.stringify(fileResp.result);
        }

        return fullData ? JSON.parse(fullData) : null;
    }
}
