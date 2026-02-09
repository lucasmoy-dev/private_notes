import { SecurityService as Security } from './security.js';
import { KEYS } from './constants.js';
import { FileStorage } from './file-storage.js';

export const state = {
    notes: [],
    categories: [],
    settings: {
        theme: 'dark',
        algo: 'aes-256-gcm',
        syncEnabled: true
    },
    currentView: 'all',
    editingNoteId: null,
    unlockedNotes: new Set(),
    unlockedCategories: new Set()
};

export async function saveLocal() {
    const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
    if (vaultKey) {
        // Clean up deleted notes older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        // Anti-Duplication: Primary ID based filtering
        const seenIds = new Set();
        state.notes = state.notes.filter(note => {
            if (!note.id || seenIds.has(note.id)) return false;
            if (note.deleted) return note.updatedAt > thirtyDaysAgo;
            seenIds.add(note.id);
            return true;
        });

        const encryptedNotes = await Security.encrypt(state.notes, vaultKey);
        const encryptedCats = await Security.encrypt(state.categories, vaultKey);

        // Save to IndexedDB Cache (Cleaner than LocalStorage)
        await FileStorage.setLocalCache(KEYS.NOTES_ENC, encryptedNotes);
        await FileStorage.setLocalCache(KEYS.CATEGORIES_ENC, encryptedCats);

        // Keep LocalStorage clean of bulk data
        localStorage.removeItem(KEYS.NOTES_ENC);
        localStorage.removeItem(KEYS.CATEGORIES_ENC);
        localStorage.removeItem(KEYS.NOTES);
        localStorage.removeItem(KEYS.CATEGORIES);

        // Push to local folder if enabled
        if (state.settings.syncEnabled) {
            FileStorage.pushData(state.notes, state.categories, vaultKey).catch(err => {
                console.error('[Sync] Auto-push failed', err);
            });
        }
    }
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(state.settings));
}

export async function loadLocalEncrypted(password) {
    try {
        let encryptedNotes = await FileStorage.getLocalCache(KEYS.NOTES_ENC);
        let encryptedCats = await FileStorage.getLocalCache(KEYS.CATEGORIES_ENC);

        // Fallback for migration from LocalStorage
        if (!encryptedNotes) {
            const lsNotes = localStorage.getItem(KEYS.NOTES_ENC);
            if (lsNotes) {
                encryptedNotes = JSON.parse(lsNotes);
                await FileStorage.setLocalCache(KEYS.NOTES_ENC, encryptedNotes);
                localStorage.removeItem(KEYS.NOTES_ENC);
            }
        }
        if (!encryptedCats) {
            const lsCats = localStorage.getItem(KEYS.CATEGORIES_ENC);
            if (lsCats) {
                encryptedCats = JSON.parse(lsCats);
                await FileStorage.setLocalCache(KEYS.CATEGORIES_ENC, encryptedCats);
                localStorage.removeItem(KEYS.CATEGORIES_ENC);
            }
        }

        if (encryptedNotes) {
            state.notes = await Security.decrypt(encryptedNotes, password);
        } else {
            const plainNotes = localStorage.getItem(KEYS.NOTES);
            if (plainNotes) state.notes = JSON.parse(plainNotes);
        }

        // Migration and Sorting
        if (state.notes.length > 0) {
            state.notes.forEach(note => {
                if (!note.createdAt) note.createdAt = note.updatedAt || Date.now();
                if (!note.updatedAt) note.updatedAt = note.createdAt;
            });

            // Default sort by creation date (descending)
            state.notes.sort((a, b) => b.createdAt - a.createdAt);
        }

        if (encryptedCats) {
            state.categories = await Security.decrypt(encryptedCats, password);
        } else {
            const plainCats = localStorage.getItem(KEYS.CATEGORIES);
            if (plainCats) state.categories = JSON.parse(plainCats);
        }
    } catch (err) {
        console.error('Failed to load encrypted data', err);
        throw err;
    }
}

export function loadSettings() {
    const saved = localStorage.getItem(KEYS.SETTINGS);
    if (saved) {
        state.settings = { ...state.settings, ...JSON.parse(saved) };
    }
}
