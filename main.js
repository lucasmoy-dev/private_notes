import './style.css';
import { state, saveLocal, loadSettings } from './src/state.js';
import { APP_VERSION, KEYS } from './src/constants.js';
import { showToast, safeCreateIcons, openPrompt } from './src/ui-utils.js';
import { SecurityService as Security } from './src/security.js';

let deferredPrompt = null;
let syncDebounce = null;

// Components
import { getAuthShieldTemplate, checkAuthStatus, handleMasterAuth, lockApp } from './src/components/AuthShield.js';
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
    localStorage.setItem(KEYS.LAST_VERSION, APP_VERSION);

    // 6. Auth Check
    await checkAuthStatus(async () => {
        refreshUI();
        const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
        if (vaultKey) {
            await restoreDraft(vaultKey);

            // Auto-Sync from Folder if connected
            try {
                const { FileStorage } = await import('./src/file-storage.js');
                const handle = await FileStorage.getHandle(false); // Check without prompt first
                if (handle && state.notes.length === 0) {
                    console.log('[Sync] Folder connected and app empty. Pulling data...');
                    const result = await FileStorage.pullData(vaultKey);
                    if (result && result.notes.length > 0) {
                        state.notes = result.notes;
                        state.categories = result.categories || [];
                        await saveLocal();
                        refreshUI();
                        showToast('✅ Datos sincronizados desde la carpeta');
                    }
                }
            } catch (e) {
                console.warn('[Sync] Auto-pull failed', e);
            }
        }
    });
    BackupService.runAutoBackup();

    // 7. Final UI Polish
    initSearch();
    initMobileNav();
    initPWA();
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
    // bindClick('sync-btn', handleSync); // Removed for Local Folder Sync
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
        state.settings.algo = document.getElementById('config-algo').value;
        await saveLocal();
        showToast('✅ Configuración guardada');
    };

    bindClick('save-security-config', saveSettings);

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

    // Auth Maintenance Actions
    bindClick('auth-options-toggle', () => {
        const menu = document.getElementById('auth-maintenance-menu');
        if (menu) menu.classList.toggle('hidden');
    });

    bindClick('auth-reload-btn', handleForceReload);

    bindClick('auth-reset-btn', async () => {
        if (confirm(t('settings.reset_warning'))) {
            const keyword = t('settings.reset_keyword');
            const userConfirm = prompt(t('settings.reset_confirm_label'));
            if (userConfirm === keyword) {
                localStorage.clear();
                sessionStorage.clear();
                // Clear IndexedDB
                if (window.indexedDB.databases) {
                    const dbs = await window.indexedDB.databases();
                    dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));
                }
                location.reload();
            }
        }
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

    // App Lock on Resume
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
            if (vaultKey) {
                const lockEnabled = localStorage.getItem(KEYS.APP_LOCK) !== 'false';
                if (lockEnabled) {
                    console.log("[Lock] App re-focused, locking...");
                    lockApp();
                }
            }
        }
    });

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

async function restoreDraft(vaultKey) {
    const encrypted = localStorage.getItem(KEYS.DRAFT);
    if (!encrypted) return;

    try {
        const draft = await Security.decrypt(JSON.parse(encrypted), vaultKey);
        if (draft) {
            console.log("Restaurando borrador localizado...");
            const noteIndex = state.notes.findIndex(n => n.id === draft.id);
            if (noteIndex >= 0) {
                if (draft.updatedAt > state.notes[noteIndex].updatedAt) {
                    state.notes[noteIndex] = { ...state.notes[noteIndex], ...draft };
                }
            } else {
                state.notes.unshift({
                    ...draft,
                    pinned: draft.pinned || false,
                    passwordHash: draft.passwordHash || null,
                    createdAt: draft.createdAt || draft.updatedAt,
                    deleted: false
                });
            }
            await saveLocal();
            localStorage.removeItem(KEYS.DRAFT);
            showToast('📝 Borrador recuperado automáticamente');
            refreshUI();
        }
    } catch (e) {
        console.error('Error al restaurar borrador (posiblemente contraseña diferente):', e);
        // If decryption fails, the draft is likely from another session/password, keep it or clear it?
        // User might have changed password. Better keep it for a while or clear if it's junk.
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
}


async function handleLogout() {
    localStorage.removeItem(KEYS.VAULT_KEY);
    sessionStorage.removeItem(KEYS.VAULT_KEY);
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

function migrateLegacyStorage() {
    const mapping = {
        'cn_master_hash_v3': KEYS.MASTER_HASH,
        'cn_notes_v3_enc': KEYS.NOTES_ENC,
        'cn_categories_v3_enc': KEYS.CATEGORIES_ENC,
        'cn_vault_key_v3': KEYS.VAULT_KEY,
        'cn_settings_v3': KEYS.SETTINGS,
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
