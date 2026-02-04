import './style.css';
import { state, saveLocal, loadSettings } from './src/state.js';
import { APP_VERSION, KEYS } from './src/constants.js';
import { showToast, safeCreateIcons, openPrompt } from './src/ui-utils.js';
import { SecurityService as Security } from './src/security.js';
import { DriveSync } from './src/drive.js';
import { AuthService } from './src/auth.js';

const CLIENT_ID = '974464877836-721dprai6taijtuufmrkh438q68e97sp.apps.googleusercontent.com';
let deferredPrompt = null;
let syncDebounce = null;

// Components
import { getAuthShieldTemplate, checkAuthStatus, handleMasterAuth } from './src/components/AuthShield.js';
import { getLayoutTemplate } from './src/components/Layout.js';
import { getEditorTemplate, initEditor, openEditor, saveActiveNote } from './src/components/Editor.js';
import { getCategoryManagerTemplate, renderCategoryManager } from './src/components/CategoryManager.js';
import { getSettingsTemplate, initSettings, handleForceReload } from './src/components/Settings.js';
import { getCommonUITemplate } from './src/components/CommonUI.js';
import { renderCategories } from './src/components/Sidebar.js';
import { renderNotes } from './src/components/NotesGrid.js';
import { initI18n, t } from './src/i18n.js';
import { BackupService } from './src/backup.js';

// --- Initialization ---
async function initApp() {
    console.log("Iniciando aplicación modular...");

    // Init I18n first
    initI18n();

    // 0. Migration - Before anything else
    migrateLegacyStorage();

    // 0. Security Cleanup - Only removed if not remembered
    const rememberedKey = localStorage.getItem(KEYS.VAULT_KEY);
    if (rememberedKey) {
        sessionStorage.setItem(KEYS.VAULT_KEY, rememberedKey);
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
    const lastVersion = localStorage.getItem(KEYS.LAST_VERSION);
    if (lastVersion && lastVersion !== APP_VERSION) {
        localStorage.setItem(KEYS.LAST_VERSION, APP_VERSION);
        console.log(`Nueva versión detectada (${APP_VERSION}). Recargando...`);
        showToast('🚀 Actualizando a la última versión...');
        setTimeout(() => location.reload(true), 1500);
        return;
    }
    localStorage.setItem(KEYS.LAST_VERSION, APP_VERSION);

    // 6. Auth Check
    await checkAuthStatus(refreshUI);
    BackupService.runAutoBackup();

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

function refreshUI(animate = true) {
    renderNotes(openEditor, animate);
    renderCategories(onViewChange, state.categories);
    updateViewHeader();
    safeCreateIcons();
}

function onViewChange(viewId, title) {
    state.currentView = viewId;
    updateViewHeader(title);
    renderNotes(openEditor, false); // No animation on view change for speed

    // Global UI update for navigation links
    document.querySelectorAll('[data-view]').forEach(l => {
        l.classList.toggle('active', l.dataset.view === viewId);
    });

    // Refresh sidebar to ensure category list is correct (though onViewChange handles most)
    renderCategories(onViewChange);
}

function updateViewHeader(title = null) {
    const titleEl = document.getElementById('view-title');
    const descEl = document.getElementById('view-desc');
    if (!titleEl) return;

    const currentCat = state.categories.find(c => c.id === state.currentView);
    const resolvedTitle = title || (currentCat ? currentCat.name : t('header.view_title_all'));

    titleEl.innerText = resolvedTitle;

    // Hide description for specific categories as requested
    if (descEl) {
        descEl.innerText = state.currentView === 'all'
            ? "Organiza tus pensamientos y protege tu privacidad."
            : "";
        descEl.style.display = state.currentView === 'all' ? 'block' : 'none';
    }
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
        state.settings.notesPerChunk = parseInt(document.getElementById('config-notes-per-chunk').value) || 50;
        state.settings.clientSecret = document.getElementById('config-client-secret').value;
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
            const currentCat = state.categories.find(c => c.id === viewId);
            const title = currentCat ? currentCat.name : (viewId === 'all' ? t('header.view_title_all') : '');

            onViewChange(viewId, title);
            closeMobileSidebar();
        };
    });

    // Mobile Category Links (specific handling for active state)
    document.querySelectorAll('.nav-link-mobile-drawer[data-category]').forEach(link => {
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
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('ov-hidden');
        }
    };
    document.querySelectorAll('.close-modal, .close-settings, .close-categories, .close-editor').forEach(btn => {
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

    // Bind Biometric Button
    bindClick('auth-biometric', () => {
        import('./src/components/AuthShield.js').then(module => {
            module.handleBiometricAuth(refreshUI);
        });
    });

    const resetConfirmInput = document.getElementById('factory-reset-confirm');
    const resetBtn = document.getElementById('factory-reset');

    if (resetConfirmInput && resetBtn) {
        const keyword = t('settings.reset_keyword').toLowerCase();
        resetConfirmInput.oninput = () => {
            resetBtn.disabled = resetConfirmInput.value.toLowerCase() !== keyword;
        };

        resetBtn.onclick = () => {
            if (resetConfirmInput.value.toLowerCase() === keyword) {
                localStorage.clear();
                sessionStorage.clear();
                location.reload();
            }
        };
    }

    window.triggerAutoSync = () => {
        clearTimeout(syncDebounce);
        syncDebounce = setTimeout(handleSync, 2000); // Reduced from 5s to 2s
    };
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

    bindClick('mobile-search-trigger', async () => {
        const term = await openPrompt('Buscar Notas', 'Ingresa término de búsqueda:', false);
        if (term !== null) {
            const desktopSearch = document.getElementById('search-input');
            if (desktopSearch) {
                desktopSearch.value = term;
                desktopSearch.dispatchEvent(new Event('input'));
                // Scroll to top to see results
                const viewport = document.getElementById('notes-viewport');
                if (viewport) viewport.scrollTop = 0;
            }
        }
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
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined' && google.accounts) {
            clearInterval(checkGapi);
            gapi.load('client', async () => {
                await gapi.client.init({
                    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
                });
                state.gapiLoaded = true;

                state.codeClient = google.accounts.oauth2.initCodeClient({
                    client_id: CLIENT_ID,
                    scope: "https://www.googleapis.com/auth/drive.file",
                    ux_mode: 'popup',
                    access_type: 'offline',
                    prompt: 'consent',
                    callback: async (resp) => {
                        if (resp.error) return showToast('❌ Error de vinculación: ' + resp.error);

                        if (resp.code) {
                            try {
                                const verifier = sessionStorage.getItem('pkce_verifier');
                                const secret = state.settings.clientSecret;
                                const tokens = await AuthService.exchangeCodeForTokens(resp.code, verifier, CLIENT_ID, secret);

                                if (tokens.refresh_token) {
                                    await AuthService.saveRefreshToken(tokens.refresh_token);
                                }

                                localStorage.setItem(KEYS.DRIVE_TOKEN, JSON.stringify(tokens));
                                gapi.client.setToken(tokens);
                                updateDriveStatus(true);
                                showToast('✅ Google Drive vinculado correctamente');
                                handleSync();
                            } catch (err) {
                                console.error('Token exchange error:', err);
                                showToast('❌ Error al canjear código. Revisa la consola.');
                            }
                        }
                    },
                });

                // Check if we already have a token
                const hasToken = localStorage.getItem(KEYS.DRIVE_TOKEN);
                if (hasToken) {
                    const token = JSON.parse(hasToken);
                    gapi.client.setToken(token);
                    updateDriveStatus(true);
                } else {
                    updateDriveStatus(false);
                }
            });
        }
    }, 500);
}

async function handleGoogleAuth() {
    if (!state.codeClient) {
        if (typeof gapi === 'undefined' || typeof google === 'undefined') {
            return showToast('⏳ Cargando librerías de Google...');
        }
        return showToast('⏳ Inicializando API de Google...');
    }

    const { verifier, challenge } = await AuthService.generatePKCE();
    sessionStorage.setItem('pkce_verifier', verifier);
    state.codeClient.requestCode({
        code_challenge: challenge,
        code_challenge_method: 'S256'
    });
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
    const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
    if (!vaultKey) return;

    const syncIcons = document.querySelectorAll('#sync-icon, [data-lucide="refresh-cw"]');
    const syncButtons = document.querySelectorAll('#sync-btn, #mobile-sync-btn, #mobile-sync-btn-bottom');

    isSyncing = true;
    syncIcons.forEach(i => i.classList.add('animate-spin'));
    syncButtons.forEach(b => b.classList.add('text-primary'));

    try {
        // Silent token check/refresh if expired
        const hasToken = localStorage.getItem(KEYS.DRIVE_TOKEN);
        if (hasToken) {
            let token = JSON.parse(hasToken);
            const now = Date.now();

            // If token expires in less than 5 mins, or we don't know, refresh it
            if (!token.expires_at || now > (token.expires_at - 300000)) {
                console.log("[Sync] Access token expired or near expiry, attempting refresh...");
                const refreshToken = await AuthService.getRefreshToken();

                if (refreshToken) {
                    try {
                        const secret = state.settings.clientSecret;
                        const newTokens = await AuthService.refreshAccessToken(refreshToken, CLIENT_ID, secret);
                        // Merge new tokens with old ones (to keep the refresh token if not rotated)
                        token = { ...token, ...newTokens };
                        localStorage.setItem(KEYS.DRIVE_TOKEN, JSON.stringify(token));
                        gapi.client.setToken(token);
                        console.log("[Sync] Token refreshed successfully.");
                    } catch (err) {
                        console.error("[Sync] Token refresh failed:", err);
                        // If refresh fails, we might need to re-auth
                        showToast('⚠️ Sesión de Drive expirada. Reconectando...');
                        handleGoogleAuth();
                        return;
                    }
                } else {
                    console.warn("[Sync] No refresh token found, requesting new access...");
                    handleGoogleAuth();
                    return;
                }
            }
        }

        const drive = new DriveSync('notev3_', state.settings.drivePath, state.settings.notesPerChunk);
        const folderId = await drive.getOrCreateFolder(state.settings.drivePath);

        // 1. Download & Merge (Pull)
        const cloudData = await drive.loadChunks(folderId, vaultKey);
        if (cloudData) {
            try {
                if (cloudData && Array.isArray(cloudData.notes)) {
                    // ... (rest of the logic)
                    // Simple Merge: Last write wins (respecting deleted flag)
                    // Simple Merge: Last write wins (respecting deleted flag)
                    const cloudNotesMap = new Map(cloudData.notes.map(n => [n.id, n]));

                    // CRITICAL: Re-read state.notes right before merging to avoid losing 
                    // changes made while downloading/decrypting from cloud
                    const localNotesMap = new Map(state.notes.map(n => [n.id, n]));

                    // Combine all IDs
                    const allIds = new Set([...cloudNotesMap.keys(), ...localNotesMap.keys()]);
                    const mergedNotes = Array.from(allIds).map(id => {
                        // Refresh local reference here too if possible, but localNotesMap is enough
                        const local = localNotesMap.get(id);
                        const cloud = cloudNotesMap.get(id);

                        // If only one exists, use it
                        if (!local) return cloud;
                        if (!cloud) return local;

                        // Both exist: use the one with the most recent updatedAt
                        // This properly handles deleted notes since the deleted flag
                        // is part of the note object with the latest timestamp
                        // Content-Aware Merge Strategy (Expanded & Aggressive)
                        const localContent = (local.content || '').trim().replace(/\r\n/g, '\n');
                        const cloudContent = (cloud.content || '').trim().replace(/\r\n/g, '\n');

                        if (localContent === cloudContent) {
                            // Content is identical (ignoring whitespace/line-endings).
                            // Conflict is strictly Metadata (Category, Pin, Lock) or Deletion.

                            // 1. Deletion Priority
                            if (local.deleted !== !!cloud.deleted) {
                                return local.deleted ? local : cloud;
                            }

                            // 2. Metadata Priority (Category, Pin, Lock)
                            // If content is visually identical, we prioritize LOCAL changes.
                            // We only yield to Cloud if it is objectively "From the future" (> 24 hours),
                            // which would suggest a significant clock error or a completely different session.
                            // This 24h window fixes all typical "Category Revert" issues caused by clock skew.
                            const diff = cloud.updatedAt - local.updatedAt;
                            if (diff < 86400000) { // 24 hours tolerance
                                return local;
                            }
                        }

                        // Standard Timestamp Logic for other cases (edits vs edits, or edit vs delete)
                        if (cloud.updatedAt > local.updatedAt) {
                            // Anti-Resurrection Shield:
                            // If local is deleted, but cloud is active and slightly newer (clock skew),
                            // prioritize deletion.
                            const diff = cloud.updatedAt - local.updatedAt;
                            if (local.deleted && !cloud.deleted && diff < 120000) { // 2 mins tolerance
                                return local;
                            }
                            return cloud;
                        }
                        return local;
                    });

                    state.notes = mergedNotes.sort((a, b) => b.updatedAt - a.updatedAt);

                    // Merge categories prioritizing LOCAL ORDER and PRIVATE STATUS
                    const cloudCatsMap = new Map(cloudData.categories.map(c => [c.id, c]));
                    const localCatsMap = new Map(state.categories.map(c => [c.id, c]));

                    const allCatIds = new Set([...localCatsMap.keys(), ...cloudCatsMap.keys()]);
                    state.categories = Array.from(allCatIds).map(id => {
                        const local = localCatsMap.get(id);
                        const cloud = cloudCatsMap.get(id);
                        if (!local) return cloud;
                        if (!cloud) return local;

                        // Conflict: Same ID. Prefer Local for Order/Name, 
                        // but if either is private, keep it private.
                        return {
                            ...local,
                            passwordHash: local.passwordHash || cloud.passwordHash
                        };
                    });

                    await saveLocal();
                    refreshUI();
                }
            } catch (e) {
                console.error('Decryption failed during sync pull', e);
                showToast('⚠️ No se pudo descargar: Contraseña no coincide');
            }
        }

        // 2. Upload (Push) - Include deleted notes (tombstones) to propagate deletion
        const activeNotes = state.notes;
        await drive.saveChunks(activeNotes, state.categories, vaultKey, folderId);

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
        const syncIcons = document.querySelectorAll('#sync-icon, [data-lucide="refresh-cw"]');
        const syncButtons = document.querySelectorAll('#sync-btn, #mobile-sync-btn, #mobile-sync-btn-bottom');
        syncIcons.forEach(i => i.classList.remove('animate-spin'));
        syncButtons.forEach(b => b.classList.remove('text-primary'));
    }
}

function triggerAutoSync() {
    const hasToken = localStorage.getItem(KEYS.DRIVE_TOKEN);
    const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
    if (state.gapiLoaded && hasToken && vaultKey) {
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
    const overlay = document.getElementById('mobile-sidebar-overlay');
    const drawer = document.getElementById('mobile-sidebar-drawer');
    if (!overlay || overlay.classList.contains('hidden')) return;

    if (drawer) {
        drawer.classList.add('animate-out', 'slide-out-to-left');
        overlay.classList.add('fade-out'); // We can add a simple fade out too if needed

        setTimeout(() => {
            overlay.classList.add('hidden');
            drawer.classList.remove('animate-out', 'slide-out-to-left');
        }, 200);
    } else {
        overlay.classList.add('hidden');
    }
}

async function addCategory() {
    const input = document.getElementById('new-cat-name');
    const name = input?.value.trim();
    if (!name) return;

    const iconPreview = document.getElementById('new-cat-icon-preview');
    const icon = iconPreview ? iconPreview.getAttribute('data-lucide') : 'tag';

    // Add to state
    const newCat = { id: 'cat_' + Date.now(), name, icon, passwordHash: null };
    state.categories.push(newCat);

    // Save and Refresh
    await saveLocal();
    if (input) input.value = '';

    // Re-render both manager and sidebar
    renderCategoryManager(refreshUI, state.categories);
    refreshUI();

    // Auto-sync if connected
    const hasToken = localStorage.getItem(KEYS.DRIVE_TOKEN);
    if (hasToken) handleSync();
}


async function handleLogout() {
    localStorage.removeItem(KEYS.VAULT_KEY);
    sessionStorage.removeItem(KEYS.VAULT_KEY);
    await AuthService.clearTokens();
    // Legacy cleanup
    localStorage.removeItem('cn_pass_plain_v3');
    sessionStorage.removeItem('cn_pass_plain_v3');
    location.reload();
}

function injectVersion() {
    ['app-version', 'settings-version-display', 'mobile-app-version'].forEach(id => {
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
        document.getElementById('config-client-secret').value = state.settings.clientSecret || '';
        if (document.getElementById('config-sync-chunk-size')) {
            document.getElementById('config-sync-chunk-size').value = state.settings.syncChunkSize || 500;
        }

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

function migrateLegacyStorage() {
    const mapping = {
        'cn_master_hash_v3': KEYS.MASTER_HASH,
        'cn_notes_v3_enc': KEYS.NOTES_ENC,
        'cn_categories_v3_enc': KEYS.CATEGORIES_ENC,
        'cn_vault_key_v3': KEYS.VAULT_KEY,
        'cn_settings_v3': KEYS.SETTINGS,
        'gdrive_token_v3': KEYS.DRIVE_TOKEN,
        'cn_bio_enabled_v3': KEYS.BIO_ENABLED,
        'cn_remember_me_v3': KEYS.REMEMBER_ME,
        'cn_last_version_v3': KEYS.LAST_VERSION,
        'cn_backups_v3': KEYS.BACKUPS
    };

    let migrated = false;

    // Recovery: Check for encrypted data in plain keys (Bad migration fix)
    try {
        const plainNotes = localStorage.getItem(KEYS.NOTES);
        if (plainNotes && plainNotes.includes('"payload":')) {
            console.log('[Migration] Recovering encrypted notes from plain key...');
            localStorage.setItem(KEYS.NOTES_ENC, plainNotes);
            localStorage.removeItem(KEYS.NOTES);
            migrated = true;
        }

        const plainCats = localStorage.getItem(KEYS.CATEGORIES);
        if (plainCats && plainCats.includes('"payload":')) {
            console.log('[Migration] Recovering encrypted categories from plain key...');
            localStorage.setItem(KEYS.CATEGORIES_ENC, plainCats);
            localStorage.removeItem(KEYS.CATEGORIES);
            migrated = true;
        }
    } catch (e) {
        console.error('[Migration] Recovery check failed', e);
    }

    // Local Storage - Non-destructive copy
    for (const [oldKey, newKey] of Object.entries(mapping)) {
        if (!newKey) continue;
        const value = localStorage.getItem(oldKey);
        // Only migrate if new key is empty to avoid overwriting newer data
        if (value && !localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, value);
            migrated = true;
            console.log(`[Migration] Migrated ${oldKey} -> ${newKey} (localStorage)`);
        }
    }

    // Session Storage
    const oldSessionKey = 'cn_vault_key_v3';
    const newSessionKey = KEYS.VAULT_KEY;
    const sessionValue = sessionStorage.getItem(oldSessionKey);
    if (sessionValue && !sessionStorage.getItem(newSessionKey)) {
        sessionStorage.setItem(newSessionKey, sessionValue);
        migrated = true;
        console.log(`[Migration] Migrated ${oldSessionKey} -> ${newSessionKey} (sessionStorage)`);
    }

    if (migrated) {
        console.log("[Migration] Storage migration completed.");
    }
}
