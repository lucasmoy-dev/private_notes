import './style.css';
import { state, saveLocal, loadSettings } from './src/state.js';
import { APP_VERSION } from './src/constants.js';
import { showToast, safeCreateIcons } from './src/ui-utils.js';
import { Security } from './src/auth.js';
import { DriveSync } from './src/drive.js';

const CLIENT_ID = '974464877836-721dprai6taijtuufmrkh438q68e97sp.apps.googleusercontent.com';
let deferredPrompt = null;

// Components
import { getAuthShieldTemplate, checkAuthStatus, handleMasterAuth } from './src/components/AuthShield.js';
import { getLayoutTemplate } from './src/components/Layout.js';
import { getEditorTemplate, initEditor, openEditor } from './src/components/Editor.js';
import { getCategoryManagerTemplate, renderCategoryManager } from './src/components/CategoryManager.js';
import { getSettingsTemplate, initSettings } from './src/components/Settings.js';
import { getCommonUITemplate } from './src/components/CommonUI.js';
import { renderCategories } from './src/components/Sidebar.js';
import { renderNotes } from './src/components/NotesGrid.js';

// --- Initialization ---
async function initApp() {
    console.log("Iniciando aplicación modular...");

    // 0. Security Cleanup
    localStorage.removeItem('cn_pass_plain_v3');

    // 1. Inject UI Structure IMMEDIATELY
    injectAppStructure();

    // 2. Load Core Data
    loadSettings();
    applyTheme();

    // 3. Initialize Components
    initEditor(refreshUI);
    initSettings();

    // 4. Setup Global Events
    setupGlobalEvents();

    // 5. Auth Check
    await checkAuthStatus(refreshUI);

    // 6. Final UI Polish
    initSearch();
    initMobileNav();
    initPWA();
    initGapi();
    registerSW();
    injectVersion();
    safeCreateIcons();

    console.log("Aplicación lista.");
}

// Run immediately since it's a module and structure is needed for everything else
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function injectAppStructure() {
    const root = document.getElementById('root');
    if (!root) return console.error("No se encontró el elemento #root");

    root.innerHTML = `
        ${getAuthShieldTemplate()}
        ${getLayoutTemplate()}
        ${getEditorTemplate()}
        ${getCategoryManagerTemplate()}
        ${getSettingsTemplate()}
        ${getCommonUITemplate()}
    `;
    console.log("Estructura inyectada.");
}

function refreshUI() {
    renderNotes(openEditor);
    renderCategories(onViewChange, state.categories);
    updateViewHeader();
    safeCreateIcons();
}

function onViewChange(viewId, title) {
    state.currentView = viewId;
    updateViewHeader(title);
    renderNotes(openEditor);
}

function updateViewHeader(title = null) {
    const titleEl = document.getElementById('view-title');
    const descEl = document.getElementById('view-desc');
    if (!titleEl || !descEl) return;

    const currentCat = state.categories.find(c => c.id === state.currentView);
    const resolvedTitle = title || (currentCat ? currentCat.name : 'Todas las notas');

    titleEl.innerText = resolvedTitle;
    descEl.innerText = state.currentView === 'all'
        ? "Organiza tus pensamientos y protege tu privacidad."
        : `Mostrando notas en "${resolvedTitle}".`;
}

function applyTheme() {
    const isDark = state.settings.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
}

function bindClick(id, fn) {
    const el = document.getElementById(id);
    if (el) {
        el.onclick = fn;
    } else {
        // console.warn(`Botón no encontrado: ${id}`);
    }
}

function setupGlobalEvents() {
    // Standard Buttons - Use delegation for more robustness or direct binding after injection
    // Standard Buttons
    bindClick('add-note-btn', openEditor);
    bindClick('mobile-add-btn', openEditor);
    bindClick('sync-btn', handleSync);
    bindClick('mobile-sync-btn', handleSync);
    bindClick('settings-trigger', openSettings);
    bindClick('logout-btn', handleLogout);
    bindClick('mobile-logout-btn', handleLogout);

    // Settings Logic - Unified Save
    const saveSettings = async () => {
        state.settings.drivePath = document.getElementById('config-drive-path').value;
        state.settings.algo = document.getElementById('config-algo').value;
        await saveLocal();
        showToast('✅ Configuración guardada');
        triggerAutoSync();
    };

    bindClick('save-sync-config', saveSettings);
    bindClick('save-security-config', saveSettings);
    bindClick('connect-drive-btn', handleGoogleAuth);

    bindClick('theme-light', () => setTheme('light'));
    bindClick('theme-dark', () => setTheme('dark'));

    // Navigation (Requires re-binding if categories change, but static links are here)
    document.querySelectorAll('.nav-link[data-view], .nav-link-mobile[data-view], .nav-link-mobile-drawer[data-view]').forEach(btn => {
        btn.onclick = () => {
            const viewId = btn.dataset.view;
            onViewChange(viewId, viewId === 'all' ? 'Todas las notas' : '');
            closeMobileSidebar();
        };
    });

    // Category Manager
    bindClick('sidebar-manage-cats', openCategoryManager);
    bindClick('mobile-manage-cats', () => {
        closeMobileSidebar();
        openCategoryManager();
    });
    bindClick('add-cat-btn', addCategory);

    // Modal Close Logic
    const closeModals = (e) => {
        const modal = e.target.closest('#settings-modal, #categories-modal, #editor-modal');
        if (modal) modal.classList.add('hidden');
    };
    document.querySelectorAll('.close-modal, .close-settings, .close-categories').forEach(btn => {
        btn.onclick = closeModals;
    });

    // Password Visibility Toggles
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-pass');
        if (!btn) return;
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';

        const icon = btn.querySelector('[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
            safeCreateIcons();
        }
    });

    // Auth Submission
    bindClick('auth-submit', () => handleMasterAuth(refreshUI));

    // Factory Reset
    bindClick('factory-reset', () => {
        if (confirm('⚠️ ¿BORRAR TODO? Esto eliminará todas las notas guardadas en este navegador localmente.')) {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        }
    });

    window.triggerAutoSync = triggerAutoSync;

    // Global Exposure
    window.handleLogout = handleLogout;
    window.openEditor = openEditor;
}

function initSearch() {
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.note-card');
        cards.forEach(card => {
            const note = state.notes.find(n => n.id === card.dataset.id);
            if (!note) return;
            const match = note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
            card.classList.toggle('hidden', !match);
        });
    };
    const desktopSearch = document.getElementById('search-input');
    const mobileSearch = document.getElementById('mobile-search-input-top');
    if (desktopSearch) desktopSearch.oninput = handleSearch;
    if (mobileSearch) mobileSearch.oninput = handleSearch;
}

function initMobileNav() {
    const overlay = document.getElementById('mobile-sidebar-overlay');
    bindClick('mobile-sidebar-trigger', () => {
        overlay?.classList.remove('hidden');
        renderCategories(onViewChange, state.categories);
    });
    bindClick('close-mobile-sidebar', closeMobileSidebar);
    bindClick('mobile-menu-trigger', () => {
        overlay?.classList.remove('hidden');
        renderCategories(onViewChange, state.categories);
    });

    const searchBar = document.getElementById('mobile-search-bar');
    const searchInput = document.getElementById('mobile-search-input-top');
    bindClick('mobile-search-btn', () => {
        searchBar?.classList.remove('hidden');
        searchInput?.focus();
    });
    bindClick('close-mobile-search', () => {
        if (searchBar) searchBar.classList.add('hidden');
        if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
    });

    bindClick('mobile-search-trigger', () => {
        searchBar?.classList.remove('hidden');
        searchInput?.focus();
    });
}

function registerSW() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swPath = import.meta.env.DEV ? '/sw.js' : './sw.js';
            navigator.serviceWorker.register(swPath).then(reg => {
                console.log('SW registrado corectamente:', reg.scope);
            }).catch(err => {
                console.log('Fallo al registrar SW:', err);
            });
        });
    }
}

function initPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('pwa-install-btn')?.classList.remove('hidden');
        document.getElementById('sidebar-pwa-install-btn')?.classList.remove('hidden');
    });

    const installLogic = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('pwa-install-btn')?.classList.add('hidden');
            document.getElementById('sidebar-pwa-install-btn')?.classList.add('hidden');
        }
        deferredPrompt = null;
    };

    bindClick('pwa-install-btn', installLogic);
    bindClick('sidebar-pwa-install-btn', installLogic);
}

function initGapi() {
    const checkGapi = setInterval(() => {
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
            clearInterval(checkGapi);
            gapi.load('client', async () => {
                await gapi.client.init({
                    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
                });
                state.gapiLoaded = true;

                state.tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: "https://www.googleapis.com/auth/drive.file",
                    callback: (resp) => {
                        if (resp.error) return showToast('❌ Error de vinculación');
                        updateDriveStatus(true);
                        showToast('✅ Vinculado con Google Drive');
                    },
                });

                // Check if we already have a token
                const hasToken = gapi.auth.getToken() !== null;
                updateDriveStatus(hasToken);
            });
        }
    }, 500);
}

function handleGoogleAuth() {
    if (!state.tokenClient) return showToast('Google API no lista');
    state.tokenClient.requestAccessToken({ prompt: 'consent' });
}

function updateDriveStatus(connected) {
    const el = document.getElementById('drive-status');
    if (!el) return;
    el.innerText = connected ? 'Conectado' : 'Desconectado';
    el.className = connected
        ? 'text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase'
        : 'text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold uppercase';
}

async function handleSync() {
    const pass = sessionStorage.getItem('cn_pass_plain_v3');
    if (!pass) return; // Silent if no active session

    const icon = document.getElementById('sync-icon');
    if (icon) icon.classList.add('animate-spin', 'text-primary');

    try {
        const drive = new DriveSync('notev3_', state.settings.drivePath);
        const folderId = await drive.getOrCreateFolder(state.settings.drivePath);
        const encrypted = await Security.encrypt({ notes: state.notes, categories: state.categories }, pass);
        await drive.saveChunks(encrypted, folderId);
        showToast('✅ Sincronización completada');
    } catch (err) {
        console.error('Sync error:', err);
        showToast('❌ Error en la sincronización');
    } finally {
        if (icon) {
            setTimeout(() => {
                icon.classList.remove('animate-spin', 'text-primary');
            }, 500);
        }
    }
}

function triggerAutoSync() {
    if (state.gapiLoaded && gapi.auth.getToken()) {
        handleSync();
    }
}

function openCategoryManager() {
    const modal = document.getElementById('categories-modal');
    if (modal) {
        modal.classList.remove('hidden');
        renderCategoryManager(refreshUI, state.categories);
    }
}

function closeMobileSidebar() {
    const el = document.getElementById('mobile-sidebar-overlay');
    if (el) el.classList.add('hidden');
}

async function addCategory() {
    const input = document.getElementById('new-cat-name');
    const name = input?.value.trim();
    if (!name) return;
    state.categories.push({ id: 'cat_' + Date.now(), name, color: '#aecbfa', passwordHash: null });
    await saveLocal();
    if (input) input.value = '';
    renderCategoryManager(refreshUI, state.categories);
    refreshUI();
    triggerAutoSync();
}

function handleLogout() {
    localStorage.removeItem('cn_pass_plain_v3');
    sessionStorage.removeItem('cn_pass_plain_v3');
    location.reload();
}

function injectVersion() {
    const el = document.getElementById('app-version');
    if (el) el.innerText = APP_VERSION;
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('config-drive-path').value = state.settings.drivePath;
        document.getElementById('config-algo').value = state.settings.algo;

        // Reset to first tab
        const firstTab = modal.querySelector('.settings-tab[data-tab="appearance"]');
        if (firstTab) firstTab.click();
    }
}

function setTheme(t) {
    state.settings.theme = t;
    applyTheme();
    saveLocal();
}
