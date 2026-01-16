
// Configuration & Constants
const CLIENT_ID = '974464877836-721dprai6taijtuufmrkh438q68e97sp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const DB_FILENAME = 'cloud_notes_db.json';

// App State
let notes = JSON.parse(localStorage.getItem('cloud_notes') || '[]');
let tokenClient;
let gapiInited = false;
let gapiLoaded = false;
let googleUser = null;

// DOM Elements
const notesGrid = document.getElementById('notes-grid');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const noteActions = document.getElementById('note-actions');
const saveBtn = document.getElementById('save-note');
const syncBtn = document.getElementById('sync-btn');
const authBtn = document.getElementById('auth-btn');
const statusBar = document.getElementById('status-bar');
const statusText = document.getElementById('status-text');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderNotes();
    initApp();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW Registered', reg))
            .catch(err => console.log('SW Error', err));
    }
});

function initApp() {
    // Note input focus handling
    noteContent.addEventListener('focus', () => {
        noteTitle.classList.remove('hidden');
        noteActions.classList.remove('hidden');
    });

    // Close input if clicked outside
    document.addEventListener('click', (e) => {
        const container = document.querySelector('.note-input-card');
        if (!container.contains(e.target) && noteContent.value === '' && noteTitle.value === '') {
            noteTitle.classList.add('hidden');
            noteActions.classList.add('hidden');
        }
    });

    saveBtn.addEventListener('click', createNote);
    syncBtn.addEventListener('click', handleSync);
    authBtn.addEventListener('click', handleAuth);

    initGapi();
    initGis();
}

// Google API Stuff
function initGapi() {
    gapi.load('client', async () => {
        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiLoaded = true;
        checkAuthStatus();
    });
}

function initGis() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            showToast('Conectado con Google');
            authBtn.querySelector('.text').innerText = 'Conectado';
            authBtn.classList.add('connected');
            await handleSync(); // Sync automatically after auth
        },
    });
    gapiInited = true;
}

function checkAuthStatus() {
    // We can't easily check auth status without a nudge or previous token
    // For now we assume they need to click "Connect"
}

async function handleAuth() {
    // If we already have a token, we don't need to request it again
    // unless we want to refresh it.
    tokenClient.requestAccessToken({ prompt: '' });
}

// CRUD Logic
function renderNotes() {
    notesGrid.innerHTML = '';
    notes.sort((a, b) => b.updatedAt - a.updatedAt).forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteNote('${note.id}')">✕</button>
            <h3>${note.title || ''}</h3>
            <p>${note.content}</p>
        `;
        notesGrid.appendChild(card);
    });
}

function createNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!content && !title) return;

    const newNote = {
        id: Date.now().toString(),
        title,
        content,
        updatedAt: Date.now()
    };

    notes.unshift(newNote);
    saveLocal();
    renderNotes();

    // Reset UI
    noteTitle.value = '';
    noteContent.value = '';
}

function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    saveLocal();
    renderNotes();
}

function saveLocal() {
    localStorage.setItem('cloud_notes', JSON.stringify(notes));
}

// Sync Logic
async function handleSync() {
    if (!gapiLoaded) return showToast('Google API no cargada');

    showStatus('Sincronizando...');
    try {
        // 1. Search for existing file
        const response = await gapi.client.drive.files.list({
            q: `name = '${DB_FILENAME}' and trashed = false`,
            fields: 'files(id, name)',
        });
        const files = response.result.files;
        let fileId = files.length > 0 ? files[0].id : null;

        if (fileId) {
            // 2. Load from Drive
            const fileResp = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            const cloudNotes = fileResp.result;

            // 3. Simple Merge (Cloud wins on ID conflict for simplicity in POC)
            const merged = [...notes];
            cloudNotes.forEach(cn => {
                const idx = merged.findIndex(n => n.id === cn.id);
                if (idx === -1) {
                    merged.push(cn);
                } else if (cn.updatedAt > merged[idx].updatedAt) {
                    merged[idx] = cn;
                }
            });
            notes = merged;
            saveLocal();
            renderNotes();
        }

        // 4. Save back to Drive
        await saveToDrive(fileId);
        showStatus('Sincronizado');
        showToast('Notas sincronizadas con éxito');
    } catch (err) {
        console.error('Sync error:', err);
        showStatus('Error al sincronizar');
        if (err.status === 401) {
            handleAuth();
        }
    }
}

async function saveToDrive(fileId) {
    const accessToken = gapi.auth.getToken()?.access_token;
    if (!accessToken) {
        throw { status: 401, message: 'No access token' };
    }

    if (fileId) {
        // Update: Simple media upload
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: JSON.stringify(notes)
        });
        if (!response.ok) throw new Error('Update failed');
        return response;
    } else {
        // Create: Multipart upload (Metadata + Media)
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const contentType = 'application/json';
        const metadata = {
            name: DB_FILENAME,
            mimeType: contentType,
        };

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n\r\n' +
            JSON.stringify(notes) +
            close_delim;

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'multipart/related; boundary=' + boundary
            }),
            body: multipartRequestBody
        });
        if (!response.ok) throw new Error('Creation failed');
        return response;
    }
}

// UI Helpers
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showStatus(msg) {
    statusBar.classList.remove('hidden');
    statusText.innerText = msg;
}

// Expose globals for onclick
window.deleteNote = deleteNote;
