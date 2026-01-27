import { SecurityService as Security } from './security.js';
import { KEYS } from './constants.js';

export const state = {
    notes: [],
    categories: [],
    settings: {
        theme: 'dark',
        drivePath: '/backup/notes/',
        algo: 'aes-256-gcm',
        notesPerChunk: 50
    },
    currentView: 'all',
    editingNoteId: null,
    unlockedNotes: new Set(),
    unlockedCategories: new Set(),
    gapiLoaded: false,
    tokenClient: null
};

export async function saveLocal() {
    const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
    if (vaultKey) {
        // Clean up deleted notes older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        // Anti-Duplication: Remove notes with identical title and content (except for deleted ones)
        const seen = new Set();
        state.notes = state.notes.filter(note => {
            if (note.deleted) return note.updatedAt > thirtyDaysAgo;

            // Generate a simple key to detect content clones
            // We include category to avoid merging same-titled notes in different categories
            const contentKey = `${note.title?.trim()}|${note.content?.trim()}|${note.categoryId}`;
            if (seen.has(contentKey)) return false; // Skip duplicate

            seen.add(contentKey);
            return true;
        });

        const encryptedNotes = await Security.encrypt(state.notes, vaultKey);
        const encryptedCats = await Security.encrypt(state.categories, vaultKey);
        localStorage.setItem(KEYS.NOTES_ENC, JSON.stringify(encryptedNotes));
        localStorage.setItem(KEYS.CATEGORIES_ENC, JSON.stringify(encryptedCats));

        localStorage.removeItem(KEYS.NOTES);
        localStorage.removeItem(KEYS.CATEGORIES);
    }
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(state.settings));
}

export async function loadLocalEncrypted(password) {
    try {
        const encryptedNotes = localStorage.getItem(KEYS.NOTES_ENC);
        const encryptedCats = localStorage.getItem(KEYS.CATEGORIES_ENC);

        if (encryptedNotes) {
            state.notes = await Security.decrypt(JSON.parse(encryptedNotes), password);
        } else {
            const plainNotes = localStorage.getItem(KEYS.NOTES);
            if (plainNotes) state.notes = JSON.parse(plainNotes);
        }

        if (encryptedCats) {
            state.categories = await Security.decrypt(JSON.parse(encryptedCats), password);
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
        // Migration of old setting name if exists
        if (state.settings.syncChunkSize !== undefined) {
            if (!state.settings.notesPerChunk) {
                state.settings.notesPerChunk = 50; // Use default for new system
            }
            delete state.settings.syncChunkSize;
        }
    }
}
