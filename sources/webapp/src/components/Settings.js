import { state, saveLocal } from '../state.js';
import { safeCreateIcons, showToast, openPrompt, isCapacitor } from '../ui-utils.js';
import { t, currentLang, setLanguage } from '../i18n.js';
import { KEYS } from '../constants.js';

export function getSettingsTemplate() {
    return `
    <div id="settings-modal" class="fixed inset-0 z-[80] hidden">
        <div class="dialog-overlay"></div>
        <div class="dialog-content w-full h-full md:w-full md:max-w-5xl md:h-[min(700px,90vh)] p-0 overflow-hidden flex flex-col md:flex-row rounded-none md:rounded-3xl shadow-2xl">
            <!-- Sidebar Settings -->
            <div id="settings-sidebar" class="w-full md:w-64 bg-muted/50 border-b md:border-b-0 md:border-r p-4 flex flex-col gap-2 overflow-y-auto">
                <div class="flex items-center justify-between mb-2 md:hidden">
                    <h3 class="font-bold text-xl">${t('settings.title')}</h3>
                    <button class="close-settings p-2 hover:bg-accent rounded-full">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <button class="settings-tab py-3 md:py-2.5 px-4 text-base md:text-sm flex items-center gap-3 md:gap-2 active-highlight" data-tab="appearance">
                    <i data-lucide="palette" class="w-5 h-5"></i> ${t('settings.general')}
                </button>
                <button class="settings-tab py-3 md:py-2.5 px-4 text-base md:text-sm flex items-center gap-3 md:gap-2" data-tab="sync">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i> ${t('settings.sync')}
                </button>
                <button class="settings-tab py-3 md:py-2.5 px-4 text-base md:text-sm flex items-center gap-3 md:gap-2" data-tab="security">
                    <i data-lucide="shield" class="w-5 h-5"></i> ${t('settings.security')}
                </button>
                <button class="settings-tab py-3 md:py-2.5 px-4 text-base md:text-sm flex items-center gap-3 md:gap-2" data-tab="backups">
                    <i data-lucide="database" class="w-5 h-5"></i> ${t('backups.title')}
                </button>
                <button class="settings-tab text-destructive mt-auto py-3 md:py-2.5 px-4 text-base md:text-sm flex items-center gap-3 md:gap-2" data-tab="danger">
                    <i data-lucide="alert-triangle" class="w-5 h-5"></i> ${t('settings.danger')}
                </button>
                <div class="pt-2 border-t border-border/10">
                    <button id="logout-btn" class="w-full h-11 flex items-center gap-3 px-4 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-all font-bold">
                        <i data-lucide="log-out" class="w-4 h-4"></i> ${t('settings.logout')}
                    </button>
                </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col min-w-0" id="settings-content-area">
                <div class="p-4 md:p-3 border-b flex items-center gap-2">
                    <button class="md:hidden p-2 hover:bg-accent rounded-xl group" id="settings-back-btn">
                        <i data-lucide="arrow-left" class="w-5 h-5 text-muted-foreground group-hover:text-foreground"></i>
                    </button>
                    <h2 id="settings-tab-title" class="font-bold text-lg md:text-sm flex-1">${t('settings.title')}</h2>
                    <button class="close-settings p-2 hover:bg-accent rounded-xl group">
                        <i data-lucide="x" class="w-5 h-5 text-muted-foreground group-hover:text-foreground"></i>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-6" id="settings-panels">
                    <!-- Panel: Apariencia -->
                    <div id="panel-appearance" class="settings-panel space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('settings.lang')}</h3>
                            <div class="space-y-2">
                            <div class="relative w-full max-w-sm">
                                <button id="lang-picker-btn" class="w-full h-11 px-4 rounded-xl border bg-card flex items-center justify-between hover:bg-accent transition-all">
                                    <div class="flex items-center gap-3">
                                        <span id="current-lang-flag" class="text-xl flag-icon font-normal">🇺🇸</span>
                                        <span id="current-lang-name" class="text-sm font-medium">English</span>
                                    </div>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-muted-foreground"></i>
                                </button>
                                <div id="lang-picker-dropdown" class="absolute top-full left-0 w-full mt-2 bg-popover border rounded-xl shadow-2xl hidden z-50 py-1 max-h-[300px] overflow-y-auto">
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="en">
                                        <span class="text-xl flag-icon font-normal">🇺🇸</span> <span class="text-sm">English</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="es">
                                        <span class="text-xl flag-icon font-normal">🇪🇸</span> <span class="text-sm">Español</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="fr">
                                        <span class="text-xl flag-icon font-normal">🇫🇷</span> <span class="text-sm">Français</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="de">
                                        <span class="text-xl flag-icon font-normal">🇩🇪</span> <span class="text-sm">Deutsch</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="it">
                                        <span class="text-xl flag-icon font-normal">🇮🇹</span> <span class="text-sm">Italiano</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="pt">
                                        <span class="text-xl flag-icon font-normal">🇵🇹</span> <span class="text-sm">Português</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="ru">
                                        <span class="text-xl flag-icon font-normal">🇷🇺</span> <span class="text-sm">Русский</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="zh">
                                        <span class="text-xl flag-icon font-normal">🇨🇳</span> <span class="text-sm">中文</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="ja">
                                        <span class="text-xl flag-icon font-normal">🇯🇵</span> <span class="text-sm">日本語</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="ko">
                                        <span class="text-xl flag-icon font-normal">🇰🇷</span> <span class="text-sm">한국어</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="ar">
                                        <span class="text-xl flag-icon font-normal">🇸🇦</span> <span class="text-sm">العربية</span>
                                    </button>
                                    <button class="lang-item w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-all" data-value="hi">
                                        <span class="text-xl flag-icon font-normal">🇮🇳</span> <span class="text-sm">ヒンディー語</span>
                                    </button>
                                </div>
                            </div>
                            </div>
                        </section>

                        <section class="space-y-3 pt-4 border-t">
                            <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">${t('settings.theme')}</h3>
                            <div class="flex gap-2">
                                <button id="theme-light" class="flex-1 h-9 rounded-lg border bg-card hover:bg-accent transition-all flex items-center justify-center gap-2 group ring-primary">
                                    <div class="w-3 h-3 rounded-full bg-zinc-200 border border-zinc-300"></div>
                                    <span class="text-[10px] font-bold uppercase tracking-wider">${t('settings.light')}</span>
                                </button>
                                <button id="theme-dark" class="flex-1 h-9 rounded-lg border bg-zinc-950 hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 group ring-primary">
                                    <div class="w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600"></div>
                                    <span class="text-[10px] font-bold uppercase tracking-wider text-white">${t('settings.dark')}</span>
                                </button>
                            </div>
                        </section>

                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('settings.maintenance')}</h3>
                            <div class="p-4 rounded-xl border bg-primary/5 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-medium">${t('settings.installed_version')}</span>
                                    <span class="text-xs font-bold font-mono text-primary" id="settings-version-display">v4.0.0</span>
                                </div>
                                <button id="force-reload-btn-settings" class="btn-shad btn-shad-outline w-full h-10 flex items-center justify-center gap-2 group text-sm rounded-lg">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"></i>
                                    ${t('sidebar.force_reload')}
                                </button>
                            </div>
                        </section>
                    </div>

                    <!-- Panel: Sincronización (Local Folder) -->
                    <div id="panel-sync" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${isCapacitor() ? 'Memoria del Teléfono' : t('settings.local_folder')}</h3>
                                <div id="folder-status" class="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase">${t('settings.sync_status.disconnected')}</div>
                            </div>
                            
                            <p class="text-xs text-muted-foreground">
                                ${isCapacitor()
            ? 'Las notas se guardarán en la carpeta "PrivateNotes" de tus documentos. Puedes sincronizar esta carpeta con otros dispositivos usando apps como Syncthing o FolderSync.'
            : 'Selecciona una carpeta local para sincronizar tus notas. Ideal para usar con servicios de nube como Dropbox o OneDrive.'}
                            </p>

                            <button id="connect-folder-btn" class="btn-shad btn-shad-outline w-full h-12 flex items-center justify-center gap-2 text-base rounded-xl">
                                <i data-lucide="${isCapacitor() ? 'smartphone' : 'folder-plus'}" class="w-5 h-5"></i> ${isCapacitor() ? 'Activar modo local' : t('settings.connect_folder')}
                            </button>


                            <div class="pt-6 border-t border-dashed space-y-4">
                                <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Migración (v3 a v4)</h3>
                                <p class="text-[10px] text-muted-foreground">
                                    Si tienes un backup (.cnb) de la versión anterior, úsalo aquí para migrar tus notas a la nueva estructura de carpetas.
                                </p>
                                <label class="btn-shad btn-shad-primary w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm cursor-pointer shadow-lg shadow-primary/20">
                                    <i data-lucide="import" class="w-4 h-4"></i> Importar Backup (.cnb)
                                    <input type="file" id="migrate-cnb-input" class="hidden" accept=".cnb">
                                </label>
                            </div>
                        </section>
                    </div>

                    <!-- Panel: Seguridad -->
                    <div id="panel-security" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('biometrics.title')}</h3>
                            <div class="p-6 rounded-2xl border space-y-4" id="bio-settings-container">
                                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div class="flex-1">
                                        <p class="text-lg font-bold md:text-base">${t('biometrics.title')}</p>
                                        <p class="text-sm text-muted-foreground mt-1">${t('biometrics.desc')}</p>
                                        <div class="mt-3 flex items-center gap-2">
                                            <div id="bio-status-badge" class="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-bold uppercase tracking-wider">
                                                ${t('biometrics.disabled')}
                                            </div>
                                        </div>
                                    </div>
                                    <button id="toggle-biometric-btn" class="btn-shad btn-shad-primary w-full md:w-auto h-14 md:h-11 px-8 flex items-center justify-center gap-3 shrink-0 rounded-2xl md:rounded-xl text-lg md:text-sm font-bold shadow-lg shadow-primary/20 active:scale-95">
                                        <i data-lucide="fingerprint" class="w-6 h-6 md:w-5 md:h-5"></i>
                                        <span id="bio-toggle-text">${t('biometrics.enable_btn')}</span>
                                    </button>
                                </div>
                            </div>
                        </section>
                        
                        <section class="space-y-4 pt-4 border-t">
                            <label for="config-app-lock" class="flex items-center justify-between cursor-pointer group">
                                <div>
                                    <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">${t('settings.app_lock')}</h3>
                                    <p class="text-[10px] text-muted-foreground">${t('settings.app_lock_hint')}</p>
                                </div>
                                <div class="relative inline-flex items-center pointer-events-none">
                                    <input type="checkbox" id="config-app-lock" class="sr-only peer">
                                    <div class="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                            </label>
                        </section>

                        
                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('settings.encryption')}</h3>
                            <div class="space-y-3">
                                <label class="text-sm font-medium">${t('settings.algo')}</label>
                                <select id="config-algo" class="h-12 md:h-10 w-full px-4 rounded-xl">
                                    <option value="aes-256-gcm">AES-256-GCM (Recommended)</option>
                                    <option value="kyber">CRYSTALS-Kyber (Experimental)</option>
                                </select>
                            </div>
                             <button id="save-security-config" class="btn-shad btn-shad-primary w-full h-14 font-bold rounded-2xl text-lg shadow-lg shadow-primary/20 transition-all active:scale-95">${t('settings.update_algo')}</button>
                        </section>
                    </div>

                    <!-- Panel: Backups -->
                    <div id="panel-backups" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('backups.title')}</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button id="export-db-btn" class="btn-shad btn-shad-outline h-14 flex items-center justify-center gap-3 rounded-2xl font-bold">
                                    <i data-lucide="download" class="w-5 h-5"></i> ${t('backups.export_btn')}
                                </button>
                                
                                <label class="btn-shad btn-shad-outline h-14 flex items-center justify-center gap-3 rounded-2xl font-bold cursor-pointer hover:bg-accent transition-all">
                                    <i data-lucide="upload" class="w-5 h-5"></i> ${t('backups.import_btn')}
                                    <input type="file" id="import-db-input" class="hidden" accept=".cnb">
                                </label>
                            </div>
                        </section>

                        <section class="space-y-4 pt-4 border-t">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('backups.local_backups')}</h3>
                                <button id="clear-backups-btn" class="text-[10px] text-destructive hover:underline uppercase font-bold tracking-tight">${t('backups.delete_all')}</button>
                            </div>
                            <p class="text-xs text-muted-foreground">${t('backups.auto_backup_desc')}</p>
                            
                            <div id="local-backups-list" class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                <div class="text-center py-8 text-muted-foreground text-sm opacity-50">${t('backups.no_backups')}</div>
                            </div>
                        </section>
                    </div>

                    <!-- Panel: Danger Zone -->
                    <div id="panel-danger" class="settings-panel hidden space-y-6">
                        <section class="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-4">
                            <h3 class="text-sm font-semibold text-destructive uppercase tracking-wider">${t('settings.reset_app')}</h3>
                            <p class="text-xs text-muted-foreground underline">${t('settings.reset_warning')}</p>
                            <div class="space-y-2">
                                <label class="text-[10px] uppercase font-bold text-destructive/70">${t('settings.reset_confirm_label')}</label>
                                <input type="text" id="factory-reset-confirm" class="h-10 px-4 mt-1 w-full border rounded-md" placeholder="${t('settings.reset_keyword')}" autocomplete="off">
                            </div>
                            <button id="factory-reset" class="btn-shad bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full h-10 disabled:opacity-50 disabled:cursor-not-allowed">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-2"></i> ${t('settings.reset_btn')}
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

export function initSettings() {
    const panels = document.querySelectorAll('.settings-panel');
    const tabs = document.querySelectorAll('.settings-tab');
    const title = document.getElementById('settings-tab-title');

    const sidebar = document.getElementById('settings-sidebar');
    const content = sidebar.nextElementSibling;
    const backBtn = document.getElementById('settings-back-btn');

    const updateView = (target) => {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
        panels.forEach(p => p.classList.toggle('hidden', p.id !== `panel-${target}`));

        const titles = {
            appearance: t('settings.general'),
            sync: t('settings.sync'),
            security: t('settings.security'),
            backups: t('backups.title'),
            danger: t('settings.danger')
        };
        title.innerText = titles[target] || t('settings.title');

        if (window.innerWidth < 768) {
            sidebar.classList.add('hidden');
            content.classList.remove('hidden');
            backBtn.classList.remove('hidden');
        }
        safeCreateIcons();
    };

    tabs.forEach(tab => {
        tab.onclick = () => updateView(tab.dataset.tab);
    });

    backBtn.onclick = () => {
        sidebar.classList.remove('hidden');
        content.classList.add('hidden');
        backBtn.classList.add('hidden');
        title.innerText = 'Configuración';
    };

    // Initialize state
    if (window.innerWidth < 768) {
        content.classList.add('hidden');
        backBtn.classList.add('hidden');
        // Ensure no tab is active on mobile init
        tabs.forEach(t => t.classList.remove('active'));
    } else {
        updateView('appearance');
    }

    // --- Sync Panel Logic ---
    const updateFolderStatus = async () => {
        const { FileStorage } = await import('../file-storage.js');
        const status = await FileStorage.getHandleStatus();
        const statusEl = document.getElementById('folder-status');
        const connectBtn = document.getElementById('connect-folder-btn');

        if (statusEl) {
            if (status.permission === 'granted') {
                statusEl.innerText = t('settings.sync_status.connected').toUpperCase();
                statusEl.classList.replace('bg-muted', 'bg-emerald-500/20');
                statusEl.classList.replace('text-muted-foreground', 'text-emerald-500');
                if (connectBtn) {
                    connectBtn.innerHTML = `<i data-lucide="folder-check" class="w-5 h-5"></i> Cambiar Carpeta`;
                    connectBtn.classList.remove('btn-shad-primary');
                    connectBtn.classList.add('btn-shad-outline');
                }
            } else if (status.hasHandle) {
                // We have the handle but need permission (Mobile common case)
                statusEl.innerText = "PERMISO REQUERIDO";
                statusEl.classList.remove('bg-emerald-500/20', 'text-emerald-500');
                statusEl.classList.add('bg-amber-500/20', 'text-amber-500');
                if (connectBtn) {
                    connectBtn.innerHTML = `<i data-lucide="unlock" class="w-5 h-5"></i> Reactivar Sincronización`;
                    connectBtn.classList.remove('btn-shad-outline');
                    connectBtn.classList.add('btn-shad-primary');
                }
            } else {
                statusEl.innerText = t('settings.sync_status.disconnected').toUpperCase();
                statusEl.classList.remove('bg-emerald-500/20', 'text-emerald-500', 'bg-amber-500/20', 'text-amber-500');
                statusEl.classList.add('bg-muted', 'text-muted-foreground');
                if (connectBtn) {
                    connectBtn.innerHTML = `<i data-lucide="folder-plus" class="w-5 h-5"></i> ${t('settings.connect_folder')}`;
                    connectBtn.classList.remove('btn-shad-primary');
                    connectBtn.classList.add('btn-shad-outline');
                }
            }
            safeCreateIcons();
        }
    };

    updateFolderStatus();

    const connectFolderBtn = document.getElementById('connect-folder-btn');
    if (connectFolderBtn) {
        connectFolderBtn.onclick = async () => {
            const { FileStorage } = await import('../file-storage.js');
            const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
            const status = await FileStorage.getHandleStatus();

            try {
                if (status.hasHandle && status.permission !== 'granted') {
                    // Just request permission for the existing handle
                    const handle = await FileStorage.getHandle(true);
                    if (handle) {
                        showToast('✅ Sincronización reactivada');
                    }
                } else {
                    // Connect new folder
                    await FileStorage.connectFolder();
                    showToast('✅ Carpeta conectada');
                }

                updateFolderStatus();

                // If app is empty, try to pull immediately
                if (state.notes.length === 0) {
                    showToast('📥 Recuperando notas de la carpeta...');
                    const result = await FileStorage.pullData(vaultKey);
                    if (result && result.notes.length > 0) {
                        state.notes = result.notes;
                        state.categories = result.categories || [];
                        await saveLocal();
                        setTimeout(() => location.reload(), 1000);
                    }
                }
            } catch (e) {
                console.error(e);
                showToast('❌ Error al conectar');
            }
        };
    }

    // Theme Selection Logic
    const themeLight = document.getElementById('theme-light');
    const themeDark = document.getElementById('theme-dark');

    const updateThemeUI = () => {
        const currentTheme = state.settings.theme;
        if (themeLight) themeLight.classList.toggle('ring-2', currentTheme === 'light');
        if (themeDark) themeDark.classList.toggle('ring-2', currentTheme === 'dark');
    };
    updateThemeUI();

    if (themeLight) themeLight.onclick = () => {
        state.settings.theme = 'light';
        document.documentElement.classList.remove('dark');
        saveLocal();
        updateThemeUI();
    };
    if (themeDark) themeDark.onclick = () => {
        state.settings.theme = 'dark';
        document.documentElement.classList.add('dark');
        saveLocal();
        updateThemeUI();
    };

    // Factory Reset Logic
    const resetInput = document.getElementById('factory-reset-confirm');
    const resetBtn = document.getElementById('factory-reset');
    if (resetInput && resetBtn) {
        resetBtn.disabled = true;
        resetInput.oninput = () => {
            resetBtn.disabled = resetInput.value !== t('settings.reset_keyword');
        };
        resetBtn.onclick = async () => {
            if (confirm(t('settings.reset_warning'))) {
                localStorage.clear();
                sessionStorage.clear();
                // Clear IndexedDB
                const dbs = await window.indexedDB.databases();
                dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));
                window.location.reload();
            }
        };
    }

    const migrateInput = document.getElementById('migrate-cnb-input');
    if (migrateInput) {
        migrateInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const { FileStorage } = await import('../file-storage.js');
            const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);

            try {
                showToast('⚡ Migrando datos...');
                const data = await FileStorage.migrateFromCNB(file, vaultKey);
                state.notes = data.notes;
                state.categories = data.categories || [];
                await saveLocal();
                showToast('✅ Migración completa. Recargando...');
                setTimeout(() => location.reload(), 1500);
            } catch (err) {
                showToast('❌ Error en la migración: ' + err.message);
            }
        };
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm(t('settings.logout_hint'))) {
                window.handleLogout();
            }
        };
    }

    // Force Reload Logic
    const reloadBtn = document.getElementById('force-reload-btn'); // Global one
    const reloadBtnSettings = document.getElementById('force-reload-btn-settings');
    if (reloadBtn) reloadBtn.onclick = handleForceReload;
    if (reloadBtnSettings) reloadBtnSettings.onclick = handleForceReload;

    // Language Switcher (Custom Selectpicker)
    const langPickerBtn = document.getElementById('lang-picker-btn');
    const langPickerDropdown = document.getElementById('lang-picker-dropdown');
    const langItems = document.querySelectorAll('.lang-item');

    if (langPickerBtn) {
        const updatePickerUI = (lang) => {
            const item = Array.from(langItems).find(i => i.dataset.value === lang);
            if (item) {
                document.getElementById('current-lang-flag').innerText = item.querySelector('span:first-child').innerText;
                document.getElementById('current-lang-name').innerText = item.querySelector('span:last-child').innerText;
                langItems.forEach(i => i.classList.toggle('bg-primary/10', i.dataset.value === lang));
            }
        };

        updatePickerUI(currentLang);

        langPickerBtn.onclick = (e) => {
            e.stopPropagation();
            langPickerDropdown.classList.toggle('hidden');
        };

        langItems.forEach(item => {
            item.onclick = () => {
                const val = item.dataset.value;
                setLanguage(val);
                updatePickerUI(val);
                langPickerDropdown.classList.add('hidden');
            };
        });

        document.addEventListener('click', () => {
            langPickerDropdown.classList.add('hidden');
        });
    }

    // Biometric Toggle Logic
    const toggleBioBtn = document.getElementById('toggle-biometric-btn');
    const bioStatusBadge = document.getElementById('bio-status-badge');
    const bioToggleText = document.getElementById('bio-toggle-text');
    const bioContainer = document.getElementById('bio-settings-container');

    if (toggleBioBtn) {
        const updateBioUI = () => {
            const isEnabled = localStorage.getItem(KEYS.BIO_ENABLED) === 'true';
            if (isEnabled) {
                bioStatusBadge.textContent = t('biometrics.enabled');
                bioStatusBadge.classList.remove('bg-muted', 'text-muted-foreground');
                bioStatusBadge.classList.add('bg-primary/20', 'text-primary');
                bioToggleText.textContent = t('biometrics.disable_btn');
                toggleBioBtn.classList.remove('btn-shad-primary');
                toggleBioBtn.classList.add('btn-shad-outline');
                bioContainer.classList.add('bg-primary/5');
            } else {
                bioStatusBadge.textContent = t('biometrics.disabled');
                bioStatusBadge.classList.remove('bg-primary/20', 'text-primary');
                bioStatusBadge.classList.add('bg-muted', 'text-muted-foreground');
                bioToggleText.textContent = t('biometrics.enable_btn');
                toggleBioBtn.classList.remove('btn-shad-outline');
                toggleBioBtn.classList.add('btn-shad-primary');
                bioContainer.classList.remove('bg-primary/5');
            }
            safeCreateIcons();
        };

        updateBioUI();

        toggleBioBtn.onclick = async () => {
            const isEnabled = localStorage.getItem(KEYS.BIO_ENABLED) === 'true';

            if (isEnabled) {
                localStorage.setItem(KEYS.BIO_ENABLED, 'false');
                // IMPORTANT: When disabling bio, we should also remove the saved key from localStorage 
                // IF we want to strictly require password.
                // localStorage.removeItem('cn_vault_key_v3'); 

                updateBioUI();
                const { showToast } = await import('../ui-utils.js');
                showToast(t('biometrics.success_disable'));
            } else {
                const { showToast, openPrompt } = await import('../ui-utils.js');

                if (!window.PublicKeyCredential) {
                    return showToast(t('biometrics.not_supported'));
                }

                try {
                    const pass = await openPrompt(t('biometrics.setup_prompt'), true);
                    if (!pass || pass.biometric) return;

                    const { SecurityService } = await import('../security.js');
                    const authHash = await SecurityService.hash(pass);
                    const existingHash = localStorage.getItem(KEYS.MASTER_HASH);

                    if (authHash !== existingHash) {
                        return showToast(t('biometrics.incorrect_pass'));
                    }

                    // Create credential
                    const challenge = new Uint8Array(32);
                    window.crypto.getRandomValues(challenge);

                    await navigator.credentials.create({
                        publicKey: {
                            challenge,
                            rp: { name: t('app_name'), id: window.location.hostname },
                            user: {
                                id: new Uint8Array(16),
                                name: "user",
                                displayName: "User"
                            },
                            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                            timeout: 60000,
                            authenticatorSelection: {
                                authenticatorAttachment: "platform",
                                residentKey: "preferred",
                                requireResidentKey: false
                            },
                            attestation: "none"
                        }
                    });

                    const vaultKey = await SecurityService.deriveVaultKey(pass);
                    localStorage.setItem(KEYS.VAULT_KEY, vaultKey);
                    localStorage.setItem(KEYS.BIO_ENABLED, 'true');

                    updateBioUI();
                    showToast(t('biometrics.success_enable'));
                } catch (e) {
                    console.error(e);
                    showToast(t('biometrics.fail_enable') + ': ' + e.message);
                }
            }
        };
    }

    // Backup Tab Logic
    const exportBtn = document.getElementById('export-db-btn');
    const importInput = document.getElementById('import-db-input');
    const clearBackupsBtn = document.getElementById('clear-backups-btn');
    const backupsList = document.getElementById('local-backups-list');

    if (exportBtn) {
        exportBtn.onclick = async () => {
            const { BackupService } = await import('../backup.js');
            const { showToast } = await import('../ui-utils.js');
            try {
                await BackupService.exportToFile();
                showToast(t('backups.export_success'));
            } catch (e) {
                showToast('❌ ' + e.message);
            }
        };
    }

    if (importInput) {
        importInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const { BackupService } = await import('../backup.js');
            const { showToast } = await import('../ui-utils.js');
            try {
                await BackupService.importFromFile(file);
                showToast(t('backups.import_success'));
                window.location.reload(); // Reload to apply data
            } catch (err) {
                showToast(t('backups.import_fail'));
                console.error(err);
            }
        };
    }

    const renderLocalBackups = async () => {
        if (!backupsList) return;
        const { BackupService } = await import('../backup.js');
        const backups = BackupService.getLocalBackups();

        if (backups.length === 0) {
            backupsList.innerHTML = `<div class="text-center py-8 text-muted-foreground text-sm opacity-50">${t('backups.no_backups')}</div>`;
            return;
        }

        backupsList.innerHTML = backups.map(bak => {
            const date = new Date(bak.timestamp).toLocaleString();
            return `
                <div class="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-all group">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <p class="text-xs font-bold">${date}</p>
                            <p class="text-[10px] text-muted-foreground">ID: ${bak.id}</p>
                        </div>
                    </div>
                    <button class="restore-bak-btn h-8 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-[10px] font-bold transition-all" data-id="${bak.id}">
                        ${t('backups.restore')}
                    </button>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.restore-bak-btn').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm(t('backups.confirm_restore'))) return;
                try {
                    const { BackupService } = await import('../backup.js');
                    await BackupService.restoreFromLocal(btn.dataset.id);
                    window.location.reload();
                } catch (err) {
                    const { showToast } = await import('../ui-utils.js');
                    showToast('❌ ' + err.message);
                }
            };
        });
        safeCreateIcons();
    };

    if (clearBackupsBtn) {
        clearBackupsBtn.onclick = async () => {
            if (!confirm('¿Eliminar todas las copias de seguridad locales?')) return;
            const { BackupService } = await import('../backup.js');
            BackupService.clearAllBackups();
            renderLocalBackups();
        };
    }

    // Initial render of backups when panel might be visible
    document.querySelector('[data-tab="backups"]').addEventListener('click', renderLocalBackups);

    // App Lock Toggle Logic
    const appLockToggle = document.getElementById('config-app-lock');
    if (appLockToggle) {
        // Default to true if not set
        const isLocked = localStorage.getItem(KEYS.APP_LOCK) !== 'false';
        appLockToggle.checked = isLocked;

        appLockToggle.onchange = () => {
            localStorage.setItem(KEYS.APP_LOCK, appLockToggle.checked);
        };
    }
}

export async function handleForceReload() {
    if (!confirm('Esto reiniciará la aplicación, limpiará la caché y eliminará el Service Worker para forzar la última versión. ¿Continuar?')) return;

    try {
        // 1. Unregister Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }

        // 2. Clear Caches
        if ('caches' in window) {
            const keys = await caches.keys();
            for (const key of keys) {
                await caches.delete(key);
            }
        }

        // 3. Clear session storage
        sessionStorage.clear();

        // 4. Hard reload with cache buster
        const url = new URL(window.location.href);
        url.searchParams.set('t', Date.now());
        window.location.href = url.toString();
    } catch (e) {
        console.error("Error clearing cache:", e);
        window.location.reload();
    }
}
