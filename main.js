
import Sortable from 'sortablejs';
import { Security } from './src/auth.js';
import { DriveSync } from './src/drive.js';

/**
 * CLOUDNOTES PRO - SHADCN EDITION
 * Core Logic Module
 */

// --- State Management ---
let notes = JSON.parse(localStorage.getItem('cn_notes_v3') || '[]');
let categories = JSON.parse(localStorage.getItem('cn_categories_v3') || '[]');
let settings = JSON.parse(localStorage.getItem('cn_settings_v3') || JSON.stringify({
    theme: 'dark',
    drivePath: 'database/notes',
    algo: 'aes-256-gcm'
}));
let currentView = 'all';
let editingNoteId = null;
let gapiLoaded = false;
let tokenClient;

// --- Palette ---
const PALETTE = [
    '#ffffff', '#f1f5f9', '#fee2e2', '#fef3c7', '#f0fdf4', '#eff6ff',
    '#faf5ff', '#fff1f2', '#f8fafc', '#fef2f2', '#fff7ed', '#f0fdfa',
    '#f5f3ff', '#fdf2f8', '#000000', '#475569', '#dc2626', '#d97706',
    '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#0f172a', '#1e293b',
    '#7f1d1d', '#78350f', '#064e3b', '#1e3a8a', '#4c1d95', '#831843'
];

const EMOJIS = ["😊", "😂", "🥰", "😎", "🤔", "😴", "🔥", "✨", "🚀", "🎉", "❤️", "👍", "💡", "📅", "✅", "❌", "🔒", "🔑", "📌", "🎨", "📁", "🏠", "🌟", "🌍", "💻", "📱", "🍎", "🍕", "🍺", "🌈", "☀️", "🌙", "⚡", "💎", "🎁", "🎈", "🎵", "📷", "🔍", "🛸", "👾", "🤖", "👻", "🦄", "🐾", "🏀", "⚽", "🚗", "✈️"];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme();
    setupEventListeners();
    initSortable();
    checkAuthStatus();
    renderCategories();
    renderNotes();
    lucide.createIcons();
});

function checkAuthStatus() {
    const shield = document.getElementById('auth-shield');
    const isSetup = localStorage.getItem('cn_master_hash_v3');

    if (!isSetup) {
        document.getElementById('auth-title').innerText = "Bienvenido a CloudNotes";
        document.getElementById('auth-desc').innerText = "Define una contraseña maestra para tu nueva bóveda.";
    }

    if (sessionStorage.getItem('cn_pass_plain_v3')) {
        shield.classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('app').classList.remove('opacity-0');
    }
}

function setupEventListeners() {
    // Auth
    document.getElementById('auth-submit').onclick = handleMasterAuth;
    document.getElementById('master-password').onkeydown = (e) => e.key === 'Enter' && handleMasterAuth();

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.onclick = () => {
            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.remove('bg-accent', 'text-accent-foreground');
                l.classList.add('text-muted-foreground');
            });
            link.classList.add('bg-accent', 'text-accent-foreground');
            link.classList.remove('text-muted-foreground');
            currentView = link.dataset.view;
            document.getElementById('view-title').innerText = link.innerText;
            renderNotes();
        };
    });

    // Note Modal
    document.getElementById('new-note-btn').onclick = () => openEditor();
    document.getElementById('close-editor').onclick = closeEditor;
    document.getElementById('save-note').onclick = saveActiveNote;

    // Formatting Toolbar
    document.querySelectorAll('.editor-tool[data-cmd]').forEach(btn => {
        btn.onmousedown = (e) => {
            e.preventDefault();
            document.execCommand(btn.dataset.cmd, false, null);
        };
    });

    // Popovers
    document.getElementById('open-colors').onclick = (e) => togglePopover(e, 'color-popover');
    document.getElementById('open-emojis').onclick = (e) => togglePopover(e, 'emoji-popover');

    // Emoji Grid
    const emojiGrid = document.getElementById('emoji-grid');
    EMOJIS.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'cursor-pointer hover:bg-accent p-2 rounded text-xl text-center';
        span.innerText = emoji;
        span.onclick = () => {
            document.execCommand('insertHTML', false, emoji);
            hidePopovers();
        };
        emojiGrid.appendChild(span);
    });

    // Color Grid
    const colorGrid = document.getElementById('color-grid');
    PALETTE.forEach(color => {
        const div = document.createElement('div');
        div.className = 'w-8 h-8 rounded-full cursor-pointer border hover:scale-110 transition-transform';
        div.style.backgroundColor = color;
        div.onclick = () => {
            document.execCommand('foreColor', false, color);
            hidePopovers();
        };
        colorGrid.appendChild(div);
    });

    // Settings
    document.getElementById('settings-trigger').onclick = () => {
        document.getElementById('settings-modal').classList.remove('hidden');
        document.getElementById('config-drive-path').value = settings.drivePath;
        document.getElementById('config-algo').value = settings.algo;
    };
    document.querySelectorAll('.close-settings').forEach(b => b.onclick = () => {
        document.getElementById('settings-modal').classList.add('hidden');
    });
    document.getElementById('save-config').onclick = saveSettings;

    // Sync
    document.getElementById('sync-btn').onclick = handleSync;

    window.onclick = (e) => {
        if (!e.target.closest('.editor-tool') && !e.target.closest('.popover-content')) {
            hidePopovers();
        }
    };

    document.getElementById('theme-light').onclick = () => setTheme('light');
    document.getElementById('theme-dark').onclick = () => setTheme('dark');

    // Category
    document.getElementById('add-category').onclick = promptNewCategory;

    initGapi();
}

/** --- Auth Logic --- **/
async function handleMasterAuth() {
    const pass = document.getElementById('master-password').value;
    if (!pass) return showToast('Ingresa una contraseña');

    const hash = await Security.hashPassword(pass);
    const existingHash = localStorage.getItem('cn_master_hash_v3');

    if (!existingHash) {
        localStorage.setItem('cn_master_hash_v3', hash);
        sessionStorage.setItem('cn_pass_plain_v3', pass);
        showToast('Bóveda inicializada');
    } else if (existingHash === hash) {
        sessionStorage.setItem('cn_pass_plain_v3', pass);
        showToast('Bóveda abierta');
    } else {
        return showToast('Contraseña incorrecta');
    }

    document.getElementById('auth-shield').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('app').classList.remove('opacity-0');
    renderNotes();
    renderCategories();
}

/** --- Editor Interaction --- **/
function openEditor(note = null) {
    const modal = document.getElementById('editor-modal');
    const titleEl = document.getElementById('edit-title');
    const contentEl = document.getElementById('edit-content');
    const catSelect = document.getElementById('edit-category');

    editingNoteId = note ? note.id : null;
    titleEl.value = note ? note.title : '';
    contentEl.innerHTML = note ? note.content : '';
    catSelect.value = note ? (note.categoryId || '') : '';

    // Reset buttons
    updatePinStatus(note ? note.pinned : false);
    updateLockStatus(note ? !!note.passwordHash : false);

    modal.classList.remove('hidden');
    contentEl.focus();
}

function closeEditor() {
    document.getElementById('editor-modal').classList.add('hidden');
    editingNoteId = null;
}

async function saveActiveNote() {
    let title = document.getElementById('edit-title').value.trim();
    const content = document.getElementById('edit-content').innerHTML;
    const catId = document.getElementById('edit-category').value;
    const isPinned = document.getElementById('toggle-pin').dataset.active === 'true';
    const hasLock = document.getElementById('toggle-lock').dataset.active === 'true';

    // Auto-title if empty
    if (!title) {
        const now = new Date();
        title = now.toISOString().split('T')[0] + ', ' + now.toLocaleTimeString();
    }

    if (!content.trim()) return showToast('La nota está vacía');

    const noteIndex = notes.findIndex(n => n.id === editingNoteId);
    const noteData = {
        id: editingNoteId || Date.now().toString(),
        title,
        content,
        categoryId: catId || null,
        pinned: isPinned,
        passwordHash: hasLock ? (noteIndex >= 0 ? notes[noteIndex].passwordHash : null) : null,
        updatedAt: Date.now()
    };

    if (hasLock && !noteData.passwordHash) {
        const pass = prompt('Establece una contraseña para esta nota:');
        if (pass) noteData.passwordHash = await Security.hashPassword(pass);
        else return;
    }

    if (noteIndex >= 0) {
        notes[noteIndex] = noteData;
    } else {
        notes.unshift(noteData);
    }

    saveLocal();
    closeEditor();
    renderNotes();
    showToast('Nota guardada');
}

/** --- Rendering --- **/
function renderNotes() {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = '';

    let filtered = notes.filter(n => {
        if (currentView === 'all') return true;
        if (currentView === 'pinned') return n.pinned;
        return n.categoryId === currentView;
    });

    // Pinned notes always on top, then by date
    filtered.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
    });

    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = `note-card note-animate-in ${note.pinned ? 'pinned border-l-brand' : 'border-l-transparent'}`;
        card.dataset.id = note.id;

        const cat = categories.find(c => c.id === note.categoryId);
        if (cat && !note.pinned) card.style.borderLeftColor = cat.color || 'transparent';

        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <h3 class="font-semibold text-sm line-clamp-1">${note.title}</h3>
                <div class="flex gap-1">
                    ${note.pinned ? '<i data-lucide="pin" class="w-3 h-3 text-brand"></i>' : ''}
                    ${note.passwordHash ? '<i data-lucide="lock-keyhole" class="w-3 h-3 text-muted-foreground"></i>' : ''}
                </div>
            </div>
            <div class="text-xs text-muted-foreground line-clamp-3 mb-4">
                ${note.passwordHash ? '<i>Contenido protegido</i>' : note.content}
            </div>
            <div class="flex items-center justify-between mt-auto">
                <span class="text-[10px] text-muted-foreground">${new Date(note.updatedAt).toLocaleDateString()}</span>
                <button class="delete-note p-1 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" data-id="${note.id}">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            </div>
        `;

        card.onclick = (e) => {
            if (e.target.closest('.delete-note')) return;
            handleNoteClick(note);
        };

        grid.appendChild(card);
    });

    lucide.createIcons();

    // Re-attach delete handlers
    document.querySelectorAll('.delete-note').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('¿Eliminar esta nota?')) {
                notes = notes.filter(n => n.id !== btn.dataset.id);
                saveLocal();
                renderNotes();
            }
        };
    });
}

async function handleNoteClick(note) {
    if (note.passwordHash) {
        const pass = prompt('Nota protegida. Ingresa la contraseña:');
        if (!pass) return;
        const hash = await Security.hashPassword(pass);
        if (hash !== note.passwordHash) return showToast('Error: Contraseña incorrecta');
    }
    openEditor(note);
}

function renderCategories() {
    const sidebar = document.getElementById('sidebar-categories');
    const select = document.getElementById('edit-category');
    sidebar.innerHTML = '';
    select.innerHTML = '<option value="">Sin categoría</option>';

    categories.forEach(cat => {
        // Sidebar
        const btn = document.createElement('button');
        btn.className = 'flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-muted-foreground group';
        btn.onclick = () => {
            currentView = cat.id;
            document.getElementById('view-title').innerText = cat.name;
            renderNotes();
        };

        btn.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full" style="background-color: ${cat.color}"></div>
                <span class="truncate">${cat.name}</span>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${cat.passwordHash ? '<i data-lucide="lock" class="w-3 h-3"></i>' : ''}
                <i data-lucide="more-horizontal" class="w-3 h-3 edit-cat-btn" data-id="${cat.id}"></i>
            </div>
        `;
        sidebar.appendChild(btn);

        // Select
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.innerText = cat.name;
        select.appendChild(opt);
    });
    lucide.createIcons();
}

/** --- Drag & Drop --- **/
function initSortable() {
    Sortable.create(document.getElementById('notes-grid'), {
        animation: 250,
        ghostClass: 'opacity-50',
        onEnd: () => {
            const newOrder = [];
            document.querySelectorAll('.note-card').forEach(el => {
                const note = notes.find(n => n.id === el.dataset.id);
                if (note) newOrder.push(note);
            });
            // Update the state with new order. We must handle pinned logic if mixed.
            notes = newOrder;
            saveLocal();
        }
    });
}

/** --- Navigation / Popovers --- **/
function togglePopover(e, id) {
    e.stopPropagation();
    const pop = document.getElementById(id);
    const trigger = e.currentTarget;
    const rect = trigger.getBoundingClientRect();

    hidePopovers(id);
    pop.classList.toggle('hidden');
    pop.style.top = `${rect.bottom + 8}px`;
    pop.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
}

function hidePopovers(exceptId = null) {
    ['color-popover', 'emoji-popover'].forEach(id => {
        if (id !== exceptId) document.getElementById(id).classList.add('hidden');
    });
}

/** --- Helpers --- **/
function updatePinStatus(active) {
    const btn = document.getElementById('toggle-pin');
    btn.dataset.active = active;
    btn.className = active
        ? 'h-8 w-8 inline-flex items-center justify-center rounded-md border border-brand bg-brand/10 text-brand'
        : 'h-8 w-8 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent text-muted-foreground';
}

function updateLockStatus(active) {
    const btn = document.getElementById('toggle-lock');
    btn.dataset.active = active;
    btn.className = active
        ? 'h-8 w-8 inline-flex items-center justify-center rounded-md border border-brand bg-brand/10 text-brand'
        : 'h-8 w-8 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent text-muted-foreground';
}

document.getElementById('toggle-pin').onclick = function () {
    updatePinStatus(this.dataset.active !== 'true');
};

document.getElementById('toggle-lock').onclick = function () {
    updateLockStatus(this.dataset.active !== 'true');
};

/** --- Categories Pro --- **/
async function promptNewCategory() {
    const name = prompt('Nombre de la categoría:');
    if (!name) return;

    const color = PALETTE[Math.floor(Math.random() * 12) + 14]; // Use deeper colors
    let passwordHash = null;

    if (confirm('¿Deseas proteger esta categoría con contraseña?')) {
        const pass = prompt('Password de categoría:');
        if (pass) passwordHash = await Security.hashPassword(pass);
    }

    categories.push({ id: Date.now().toString(), name, color, passwordHash });
    saveLocal();
    renderCategories();
}

async function editCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    const newName = prompt('Nuevo nombre:', cat.name);
    if (newName === null) return;

    if (confirm('¿Quieres cambiar/quitar la protección de contraseña?')) {
        if (confirm('¿Quitar contraseña?')) {
            cat.passwordHash = null;
        } else {
            const pass = prompt('Nueva password:');
            if (pass) cat.passwordHash = await Security.hashPassword(pass);
        }
    }

    cat.name = newName || cat.name;
    saveLocal();
    renderCategories();
    renderNotes();
}

/** --- Event Delegation for Categories --- **/
document.addEventListener('click', (e) => {
    if (e.target.closest('.edit-cat-btn')) {
        e.stopPropagation();
        const id = e.target.closest('.edit-cat-btn').dataset.id;
        editCategory(id);
    }
});

/** --- Sync & Cloud --- **/
async function handleSync() {
    if (!gapiLoaded) return showToast('Dispositivo no vinculado a Google');

    showToast('Sincronizando con la nube...');
    try {
        const drive = new DriveSync('notev3_', settings.drivePath);
        const folderId = await drive.getOrCreateFolder(settings.drivePath);

        const encrypted = await Security.encrypt({ notes, categories }, sessionStorage.getItem('cn_pass_plain_v3'));
        await drive.saveChunks(encrypted, folderId);

        showToast('Nube actualizada correctamente');
    } catch (err) {
        showToast('Error en la sincronización');
    }
}

function initGapi() {
    // We expect gapi and google to be available from scripts in index.html
    const checkGapi = setInterval(() => {
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
            clearInterval(checkGapi);
            gapi.load('client', async () => {
                await gapi.client.init({
                    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
                });
                gapiLoaded = true;

                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: "https://www.googleapis.com/auth/drive.file",
                    callback: (resp) => {
                        if (resp.error) return;
                        showToast('Vinculado con Google Drive');
                    },
                });
            });
        }
    }, 500);
}

/** --- Misc Helpers --- **/
function applyTheme() {
    document.documentElement.className = settings.theme;
}

function setTheme(t) {
    settings.theme = t;
    applyTheme();
    saveLocal();
}

function saveLocal() {
    localStorage.setItem('cn_notes_v3', JSON.stringify(notes));
    localStorage.setItem('cn_categories_v3', JSON.stringify(categories));
    localStorage.setItem('cn_settings_v3', JSON.stringify(settings));
}

function saveSettings() {
    settings.drivePath = document.getElementById('config-drive-path').value;
    settings.algo = document.getElementById('config-algo').value;
    saveLocal();
    showToast('Configuración guardada');
    document.getElementById('settings-modal').classList.add('hidden');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.querySelector('div').innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

// Global scope for HTML handlers
window.deleteNote = (id) => { /* logic inside renderNotes */ };
const CLIENT_ID = '974464877836-721dprai6taijtuufmrkh438q68e97sp.apps.googleusercontent.com';
