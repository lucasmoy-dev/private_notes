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
import { getEditorTemplate, initEditor, openEditor, saveActiveNote } from './src/components/Editor.js';
import { getCategoryManagerTemplate, renderCategoryManager } from './src/components/CategoryManager.js';
import { getSettingsTemplate, initSettings, handleForceReload } from './src/components/Settings.js';
import { getCommonUITemplate } from './src/components/CommonUI.js';
import { renderCategories } from './src/components/Sidebar.js';
import { renderNotes } from './src/components/NotesGrid.js';

// --- Initialization ---
async function initApp() {
    console.log("Iniciando aplicación modular...");

    // 0. Security Cleanup - Only removed if not remembered
    const rememberedPass = localStorage.getItem('cn_pass_plain_v3');
    if (rememberedPass) {
        sessionStorage.setItem('cn_pass_plain_v3', rememberedPass);
    }

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

    // 5. Version check for auto-update
    const lastVersion = localStorage.getItem('cn_last_version');
    if (lastVersion && lastVersion !== APP_VERSION) {
        localStorage.setItem('cn_last_version', APP_VERSION);
        console.log(`Nueva versión detectada (${APP_VERSION}). Recargando...`);
        showToast('🚀 Actualizando a la última versión...');
        setTimeout(() => location.reload(true), 1500);
        return;
    }
    localStorage.setItem('cn_last_version', APP_VERSION);

    // 6. Auth Check
    await checkAuthStatus(refreshUI);

    // 7. Final UI Polish
    initSearch();
    initMobileNav();
    initPWA();
    initGapi();
    registerSW();
    injectVersion();
    applySidebarState();
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
    bindClick('add-note-btn', () => openEditor());
    bindClick('mobile-add-btn', () => openEditor());
    bindClick('sync-btn', handleSync);
    bindClick('mobile-sync-btn', handleSync);
    bindClick('mobile-sync-btn-bottom', handleSync);
    bindClick('settings-trigger', openSettings);
    bindClick('mobile-settings-btn', () => {
        closeMobileSidebar();
        openSettings();
    });
    bindClick('sidebar-collapse-btn', () => {
        const sidebar = document.querySelector('aside');
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar_collapsed', isCollapsed);
        updateSidebarUI();
    });

    bindClick('mobile-force-reload-btn', handleForceReload);

    document.body.addEventListener('click', (e) => {
        const logoutBtn = e.target.closest('#logout-btn, #mobile-logout-btn');
        if (logoutBtn) handleLogout();

        // Close mobile sidebar on backdrop click
        if (e.target.id === 'mobile-sidebar-overlay') {
            closeMobileSidebar();
        }
    });

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

    // Navigation
    const navLinks = document.querySelectorAll('.nav-link[data-view], .nav-link-mobile[data-view], .nav-link-mobile-drawer[data-view]');
    navLinks.forEach(btn => {
        btn.onclick = () => {
            const viewId = btn.dataset.view;

            // UI Update for active state
            navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === viewId));
            // Also deselect categories in Sidebar.js logic
            document.querySelectorAll('#sidebar-categories .nav-link').forEach(l => l.classList.remove('active'));
            // Ensure mobile category links are deselected when a general view is selected
            document.querySelectorAll('.nav-link-mobile-drawer').forEach(l => {
                l.classList.remove('active');
                const icon = l.querySelector('i');
                if (icon) icon.classList.remove('text-primary');
                const span = l.querySelector('span');
                if (span) span.classList.remove('text-primary');
            });


            onViewChange(viewId, viewId === 'all' ? 'Todas las notas' : '');
            closeMobileSidebar();
        };
    });

    // Mobile Category Links (specific handling for active state)
    document.querySelectorAll('.nav-link-mobile-drawer').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const catId = link.dataset.category;
            state.currentView = catId; // Update currentView for category

            // UI Update for active state
            // Deselect all general nav links
            document.querySelectorAll('.nav-link[data-view], .nav-link-mobile[data-view]').forEach(l => l.classList.remove('active'));
            // Deselect all desktop category links
            document.querySelectorAll('#sidebar-categories .nav-link').forEach(l => l.classList.remove('active'));

            // Set active for mobile category links
            document.querySelectorAll('.nav-link-mobile-drawer').forEach(l => {
                const isActive = l.dataset.category === catId;
                l.classList.toggle('active', isActive);
                const icon = l.querySelector('i');
                if (icon) icon.classList.toggle('text-primary', isActive);
                const span = l.querySelector('span');
                if (span) span.classList.toggle('text-primary', isActive);
            });

            closeMobileSidebar();
            refreshUI();
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

        // Re-create icon logic
        btn.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
        safeCreateIcons();
    });

    // Add Enter key listener for master password
    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const shield = document.getElementById('auth-shield');
            if (shield && !shield.classList.contains('hidden')) {
                const passInput = document.getElementById('master-password');
                const confirmInput = document.getElementById('confirm-password');
                if (document.activeElement === passInput || document.activeElement === confirmInput) {
                    handleMasterAuth(refreshUI);
                }
            }
        }
    });

    // Auth Submission
    bindClick('auth-submit', () => handleMasterAuth(refreshUI));

    bindClick('factory-reset', () => {
        const confirmInput = document.getElementById('factory-reset-confirm');
        if (confirmInput?.value.toLowerCase() === 'confirmar') {
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
    const trigger = () => {
        overlay?.classList.remove('hidden');
        renderCategories(onViewChange, state.categories);
    };
    bindClick('mobile-sidebar-trigger', trigger);
    bindClick('mobile-sidebar-trigger-bottom', trigger);

    bindClick('close-mobile-sidebar', closeMobileSidebar);

    const searchBar = document.getElementById('mobile-search-bar');
    const searchInput = document.getElementById('mobile-search-input-top');

    const openSearch = () => {
        searchBar?.classList.remove('hidden');
        searchInput?.focus();
    };

    bindClick('mobile-search-btn', openSearch);
    bindClick('mobile-search-trigger', openSearch);
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
        const btns = ['pwa-install-btn', 'sidebar-pwa-install-btn', 'mobile-pwa-install-btn'];
        btns.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
    });

    const installLogic = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            const btns = ['pwa-install-btn', 'sidebar-pwa-install-btn', 'mobile-pwa-install-btn'];
            btns.forEach(id => document.getElementById(id)?.classList.add('hidden'));
        }
        deferredPrompt = null;
    };

    bindClick('pwa-install-btn', installLogic);
    bindClick('sidebar-pwa-install-btn', installLogic);
    bindClick('mobile-pwa-install-btn', installLogic);
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
                    callback: async (resp) => {
                        if (resp.error) return showToast('❌ Error de vinculación');

                        // Verify existing data on connect
                        const pass = sessionStorage.getItem('cn_pass_plain_v3');
                        if (!pass) return showToast('❌ Error: Sesión no válida');

                        try {
                            const drive = new DriveSync('notev3_', state.settings.drivePath);
                            const folderId = await drive.getOrCreateFolder(state.settings.drivePath);
                            const cloudData = await drive.loadChunks(folderId);

                            if (cloudData) {
                                try {
                                    await Security.decrypt(cloudData, pass);
                                    // If we are here, password is correct
                                    showToast('✅ Drive verificado: Contraseña correcta');
                                } catch (e) {
                                    showToast('❌ Contraseña de Bóveda no coincide con Drive');
                                    return; // Don't persist token
                                }
                            }

                            localStorage.setItem('gdrive_token_v3', JSON.stringify(resp));
                            gapi.client.setToken(resp);
                            updateDriveStatus(true);
                            showToast('✅ Vinculado con Google Drive');
                            handleSync(); // Sync immediately on first connect
                        } catch (err) {
                            console.error('Drive connection error:', err);
                            showToast('❌ Error al verificar Drive');
                        }
                    },
                });

                // Check if we already have a token
                const hasToken = localStorage.getItem('gdrive_token_v3');
                if (hasToken) {
                    const token = JSON.parse(hasToken);
                    gapi.client.setToken(token);
                    // Update multiple times to ensure the UI is ready
                    updateDriveStatus(true);
                    setTimeout(() => updateDriveStatus(true), 500);
                    setTimeout(() => updateDriveStatus(true), 2000);
                } else {
                    updateDriveStatus(false);
                }
            });
        }
    }, 500);
}

function handleGoogleAuth() {
    if (!state.tokenClient) return showToast('Google API no lista');
    state.tokenClient.requestAccessToken({ prompt: '' });
}

function updateDriveStatus(connected) {
    const status = document.getElementById('drive-status');
    const syncBtn = document.getElementById('sync-btn');

    if (status) {
        status.innerHTML = connected
            ? '<span class="flex items-center gap-2 text-green-500 font-bold"><i data-lucide="check-circle" class="w-4 h-4"></i> Conectado</span>'
            : '<span class="flex items-center gap-2 text-muted-foreground font-bold font-mono uppercase"><i data-lucide="x-circle" class="w-4 h-4"></i> No conectado</span>';
        status.className = connected
            ? 'text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary'
            : 'text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground';
    }

    if (syncBtn) {
        syncBtn.style.opacity = connected ? '1' : '0.3';
        syncBtn.style.pointerEvents = connected ? 'auto' : 'none';
    }
    safeCreateIcons();
}

let isSyncing = false;
async function handleSync() {
    if (isSyncing) return;
    const pass = sessionStorage.getItem('cn_pass_plain_v3');
    if (!pass) return;

    const icon = document.getElementById('sync-icon');
    const btn = document.getElementById('sync-btn');

    isSyncing = true;
    if (icon) icon.classList.add('animate-spin');
    if (btn) btn.classList.add('text-primary');

    try {
        const drive = new DriveSync('notev3_', state.settings.drivePath);
        const folderId = await drive.getOrCreateFolder(state.settings.drivePath);

        // 1. Download & Merge (Pull)
        const cloudEncrypted = await drive.loadChunks(folderId);
        if (cloudEncrypted) {
            try {
                const cloudData = await Security.decrypt(cloudEncrypted, pass);
                if (cloudData && Array.isArray(cloudData.notes)) {
                    // Simple Merge: Last write wins
                    const cloudNotesMap = new Map(cloudData.notes.map(n => [n.id, n]));
                    const localNotesMap = new Map(state.notes.map(n => [n.id, n]));

                    // Combine all IDs
                    const allIds = new Set([...cloudNotesMap.keys(), ...localNotesMap.keys()]);
                    const mergedNotes = Array.from(allIds).map(id => {
                        const local = localNotesMap.get(id);
                        const cloud = cloudNotesMap.get(id);
                        if (!local) return cloud;
                        if (!cloud) return local;
                        return (cloud.updatedAt > local.updatedAt) ? cloud : local;
                    });

                    state.notes = mergedNotes.sort((a, b) => b.updatedAt - a.updatedAt);

                    // Merge categories similarly
                    const cloudCatsMap = new Map(cloudData.categories.map(c => [c.id, c]));
                    const localCatsMap = new Map(state.categories.map(c => [c.id, c]));
                    const allCatIds = new Set([...cloudCatsMap.keys(), ...localCatsMap.keys()]);
                    state.categories = Array.from(allCatIds).map(id => localCatsMap.get(id) || cloudCatsMap.get(id));

                    await saveLocal();
                    refreshUI();
                }
            } catch (e) {
                console.error('Decryption failed during sync pull', e);
                showToast('⚠️ No se pudo descargar: Contraseña no coincide');
            }
        }

        // 2. Upload (Push)
        const encrypted = await Security.encrypt({ notes: state.notes, categories: state.categories }, pass);
        await drive.saveChunks(encrypted, folderId);

        showToast('✅ Sincronización completa');
    } catch (err) {
        console.error('Sync error:', err);
        // Handle 401 (Unauthorized)
        if (err.status === 401 || (err.result && err.result.error && err.result.error.code === 401)) {
            showToast('⚠️ Sesión de Drive expirada. Re-conectando...');
            handleGoogleAuth();
        } else {
            showToast('❌ Error de sincronización');
        }
    } finally {
        isSyncing = false;
        if (icon) icon.classList.remove('animate-spin');
        if (btn) btn.classList.remove('text-primary');
    }
}

function triggerAutoSync() {
    const hasToken = localStorage.getItem('gdrive_token_v3');
    if (state.gapiLoaded && hasToken && sessionStorage.getItem('cn_pass_plain_v3')) {
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

    // Add to state
    const newCat = { id: 'cat_' + Date.now(), name, icon: 'tag', passwordHash: null };
    state.categories.push(newCat);

    // Save and Refresh
    await saveLocal();
    if (input) input.value = '';

    // Re-render both manager and sidebar
    renderCategoryManager(refreshUI, state.categories);
    refreshUI();

    // Auto-sync if connected
    const hasToken = localStorage.getItem('gdrive_token_v3');
    if (hasToken) handleSync();
}


function handleLogout() {
    localStorage.removeItem('cn_pass_plain_v3');
    sessionStorage.removeItem('cn_pass_plain_v3');
    location.reload();
}

function injectVersion() {
    ['app-version', 'settings-version-display'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = APP_VERSION;
    });
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('config-drive-path').value = state.settings.drivePath;
        document.getElementById('config-algo').value = state.settings.algo;

        // Reset to first tab
        const firstTab = modal.querySelector('.settings-tab[data-tab="appearance"]');
        if (firstTab && window.innerWidth >= 768) firstTab.click();

        // Reset mobile view state
        if (window.innerWidth < 768) {
            const sidebar = document.getElementById('settings-sidebar');
            const content = document.getElementById('settings-content-area');
            if (sidebar && content) {
                sidebar.classList.remove('hidden');
                content.classList.add('hidden');
            }
        }
    }
}

function applySidebarState() {
    const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    const sidebar = document.querySelector('aside');
    if (sidebar && isCollapsed) {
        sidebar.classList.add('collapsed');
        updateSidebarUI();
    }
}

function updateSidebarUI() {
    const sidebar = document.querySelector('aside');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.contains('collapsed');
    const icon = document.getElementById('sidebar-collapse-icon');
    if (icon) {
        icon.setAttribute('data-lucide', isCollapsed ? 'chevrons-right' : 'chevrons-left');
        safeCreateIcons();
    }
}

function setTheme(t) {
    state.settings.theme = t;
    applyTheme();
    saveLocal();
}
