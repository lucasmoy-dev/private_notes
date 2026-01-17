import { safeCreateIcons } from '../ui-utils.js';
import { t, currentLang, setLanguage } from '../i18n.js';

export function getSettingsTemplate() {
    return `
    <div id="settings-modal" class="fixed inset-0 z-[80] hidden">
        <div class="dialog-overlay"></div>
        <div class="dialog-content w-full h-full md:w-auto md:max-w-2xl md:h-[500px] p-0 overflow-hidden flex flex-col md:flex-row rounded-none md:rounded-xl">
            <!-- Sidebar Settings -->
            <div id="settings-sidebar" class="w-full md:w-48 bg-muted/50 border-b md:border-b-0 md:border-r p-4 flex flex-col gap-2 overflow-y-auto">
                <div class="flex items-center justify-between mb-4 md:hidden">
                    <h3 class="font-bold text-2xl">${t('settings.title')}</h3>
                    <button class="close-settings p-2 hover:bg-accent rounded-full">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <button class="settings-tab py-3 px-4 text-base" data-tab="appearance">
                    <i data-lucide="palette" class="w-5 h-5"></i> ${t('settings.general')}
                </button>
                <button class="settings-tab py-3 px-4 text-base" data-tab="sync">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i> ${t('settings.sync')}
                </button>
                <button class="settings-tab py-3 px-4 text-base" data-tab="security">
                    <i data-lucide="shield" class="w-5 h-5"></i> ${t('settings.security')}
                </button>
                <button class="settings-tab text-destructive mt-auto py-3 px-4 text-base" data-tab="danger">
                    <i data-lucide="alert-triangle" class="w-5 h-5"></i> ${t('settings.danger')}
                </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col min-w-0" id="settings-content-area">
                <div class="p-4 border-b flex items-center gap-3">
                    <button class="md:hidden p-2 hover:bg-accent rounded-md group" id="settings-back-btn">
                        <i data-lucide="arrow-left" class="w-5 h-5 text-muted-foreground group-hover:text-foreground"></i>
                    </button>
                    <h2 id="settings-tab-title" class="font-bold flex-1">${t('settings.title')}</h2>
                    <button class="close-settings p-2 hover:bg-accent rounded-md group">
                        <i data-lucide="x" class="w-5 h-5 text-muted-foreground group-hover:text-foreground"></i>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-6" id="settings-panels">
                    <!-- Panel: Apariencia -->
                    <div id="panel-appearance" class="settings-panel space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('settings.lang')}</h3>
                            <div class="grid grid-cols-2 gap-3">
                                <button class="lang-btn flex items-center justify-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent ${currentLang === 'en' ? 'ring-2 ring-primary' : ''}" data-lang="en">
                                    <span class="text-xl">🇺🇸</span> <span class="text-sm font-medium">English</span>
                                </button>
                                <button class="lang-btn flex items-center justify-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent ${currentLang === 'es' ? 'ring-2 ring-primary' : ''}" data-lang="es">
                                    <span class="text-xl">🇪🇸</span> <span class="text-sm font-medium">Español</span>
                                </button>
                            </div>
                        </section>

                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('settings.theme')}</h3>
                            <div class="grid grid-cols-2 gap-3">
                                <button id="theme-light" class="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-all group">
                                    <div class="w-full aspect-video bg-zinc-100 rounded border flex items-center justify-center">
                                         <div class="w-1/2 h-2 bg-zinc-300 rounded"></div>
                                    </div>
                                    <span class="text-xs font-medium">${t('settings.light')}</span>
                                </button>
                                <button id="theme-dark" class="flex flex-col items-center gap-2 p-4 rounded-lg border bg-zinc-950 hover:bg-zinc-900 transition-all group ring-primary">
                                    <div class="w-full aspect-video bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center">
                                         <div class="w-1/2 h-2 bg-zinc-600 rounded"></div>
                                    </div>
                                    <span class="text-xs font-medium text-white">${t('settings.dark')}</span>
                                </button>
                            </div>
                        </section>

                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('settings.maintenance')}</h3>
                            <div class="p-4 rounded-lg border bg-primary/5 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-medium">${t('settings.installed_version')}</span>
                                    <span class="text-xs font-bold font-mono text-primary" id="settings-version-display">v3.6.0</span>
                                </div>
                                <p class="text-[10px] text-muted-foreground">Force update if issues occur.</p>
                                <button id="force-reload-btn" class="btn-shad btn-shad-outline w-full h-10 flex items-center justify-center gap-2 group">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"></i>
                                    ${t('sidebar.force_reload')}
                                </button>
                            </div>
                        </section>
                    </div>

                    <!-- Panel: Sincronización -->
                    <!-- Panel: Sincronización -->
                    <div id="panel-sync" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Google Drive</h3>
                                <div id="drive-status" class="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase">${t('settings.sync_status.disconnected')}</div>
                            </div>
                            
                            <button id="connect-drive-btn" class="btn-shad btn-shad-outline w-full h-10 flex items-center justify-center gap-2">
                                <i data-lucide="link" class="w-4 h-4"></i> ${t('settings.connect_drive')}
                            </button>

                            <div class="space-y-2 pt-4 border-t border-dashed">
                                <label class="text-xs font-medium">${t('settings.drive_folder')}</label>
                                <input type="text" id="config-drive-path" class="h-10 px-4 w-full" placeholder="p.ej. CloudNotesV3" autocomplete="off">
                                <p class="text-[10px] text-muted-foreground">${t('settings.drive_folder_hint')}</p>
                            </div>
                            <div class="space-y-2">
                                <label class="text-xs font-medium">${t('settings.notes_per_chunk')}</label>
                                <div class="flex items-center gap-3">
                                    <input type="number" id="config-notes-per-chunk" class="h-10 px-4 w-full" placeholder="50" min="10" max="500">
                                    <span class="text-xs text-muted-foreground shrink-0 font-bold">NOTES</span>
                                </div>
                                <p class="text-[10px] text-muted-foreground">${t('settings.notes_per_chunk_hint')}</p>
                            </div>
                            <button id="save-sync-config" class="btn-shad btn-shad-primary w-full h-10">${t('settings.save_changes')}</button>
                        </section>
                    </div>

                    <!-- Panel: Seguridad -->
                    <div id="panel-security" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('settings.session_security')}</h3>
                            <div class="p-4 rounded-lg border bg-muted/20 space-y-3">
                                <p class="text-xs text-muted-foreground">${t('settings.logout_hint')}</p>
                                <button id="logout-btn" class="btn-shad bg-destructive/10 text-destructive hover:bg-destructive hover:text-white w-full h-10 flex items-center justify-center gap-2 transition-all">
                                    <i data-lucide="log-out" class="w-4 h-4"></i> ${t('settings.logout')}
                                </button>
                            </div>
                        </section>
                        
                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">${t('settings.encryption')}</h3>
                            <div class="space-y-2">
                                <label class="text-xs font-medium">${t('settings.algo')}</label>
                                <select id="config-algo" class="h-10 w-full px-3">
                                    <option value="aes-256-gcm">AES-256-GCM (Recommended)</option>
                                    <option value="kyber">CRYSTALS-Kyber (Experimental)</option>
                                </select>
                            </div>
                             <button id="save-security-config" class="btn-shad btn-shad-primary w-full h-10">${t('settings.update_algo')}</button>
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

    // Force Reload Logic
    const reloadBtn = document.getElementById('force-reload-btn');
    if (reloadBtn) {
        reloadBtn.onclick = handleForceReload;
    }

    // Language Switcher Logic
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.onclick = () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
        };
    });
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
