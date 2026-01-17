import { SecurityService as Security } from './security.js';

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
    const pass = sessionStorage.getItem('cn_pass_plain_v3');
    if (pass) {
        const encryptedNotes = await Security.encrypt(state.notes, pass);
        const encryptedCats = await Security.encrypt(state.categories, pass);
        localStorage.setItem('cn_notes_v3_enc', JSON.stringify(encryptedNotes));
        localStorage.setItem('cn_categories_v3_enc', JSON.stringify(encryptedCats));

        localStorage.removeItem('cn_notes_v3');
        localStorage.removeItem('cn_categories_v3');
    }
    localStorage.setItem('cn_settings_v3', JSON.stringify(state.settings));
}

export async function loadLocalEncrypted(password) {
    try {
        const encryptedNotes = localStorage.getItem('cn_notes_v3_enc');
        const encryptedCats = localStorage.getItem('cn_categories_v3_enc');

        if (encryptedNotes) {
            state.notes = await Security.decrypt(JSON.parse(encryptedNotes), password);
        } else {
            const plainNotes = localStorage.getItem('cn_notes_v3');
            if (plainNotes) state.notes = JSON.parse(plainNotes);
        }

        if (encryptedCats) {
            state.categories = await Security.decrypt(JSON.parse(encryptedCats), password);
        } else {
            const plainCats = localStorage.getItem('cn_categories_v3');
            if (plainCats) state.categories = JSON.parse(plainCats);
        }
    } catch (err) {
        console.error('Failed to load encrypted data', err);
        throw err;
    }
}

export function loadSettings() {
    const saved = localStorage.getItem('cn_settings_v3');
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
