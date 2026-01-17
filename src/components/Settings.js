import { safeCreateIcons } from '../ui-utils.js';

export function getSettingsTemplate() {
    return `
    <div id="settings-modal" class="fixed inset-0 z-[80] hidden">
        <div class="dialog-overlay"></div>
        <div class="dialog-content max-w-2xl p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[500px]">
            <!-- Sidebar Settings -->
            <div id="settings-sidebar" class="w-full md:w-48 bg-muted/50 border-b md:border-b-0 md:border-r p-4 flex flex-col gap-1 overflow-y-auto">
                <div class="flex items-center justify-between mb-2 md:hidden">
                    <h3 class="font-bold text-lg">Configuración</h3>
                    <button class="close-settings p-2 hover:bg-accent rounded-md">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <button class="settings-tab" data-tab="appearance">
                    <i data-lucide="palette" class="w-4 h-4"></i> General
                </button>
                <button class="settings-tab" data-tab="sync">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i> Sincronización
                </button>
                <button class="settings-tab" data-tab="security">
                    <i data-lucide="shield" class="w-4 h-4"></i> Seguridad
                </button>
                <button class="settings-tab text-destructive mt-auto" data-tab="danger">
                    <i data-lucide="alert-triangle" class="w-4 h-4"></i> Zona Peligrosa
                </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col min-w-0" id="settings-content-area">
                <div class="p-4 border-b flex items-center gap-3">
                    <button class="md:hidden p-2 hover:bg-accent rounded-md group" id="settings-back-btn">
                        <i data-lucide="arrow-left" class="w-5 h-5 text-muted-foreground group-hover:text-foreground"></i>
                    </button>
                    <h2 id="settings-tab-title" class="font-bold flex-1">Configuración</h2>
                    <button class="close-settings p-2 hover:bg-accent rounded-md group">
                        <i data-lucide="x" class="w-5 h-5 text-muted-foreground group-hover:text-foreground"></i>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-6" id="settings-panels">
                    <!-- Panel: Apariencia -->
                    <div id="panel-appearance" class="settings-panel space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tema Visual</h3>
                            <div class="grid grid-cols-2 gap-3">
                                <button id="theme-light" class="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-all group">
                                    <div class="w-full aspect-video bg-zinc-100 rounded border flex items-center justify-center">
                                         <div class="w-1/2 h-2 bg-zinc-300 rounded"></div>
                                    </div>
                                    <span class="text-xs font-medium">Claro</span>
                                </button>
                                <button id="theme-dark" class="flex flex-col items-center gap-2 p-4 rounded-lg border bg-zinc-950 hover:bg-zinc-900 transition-all group ring-primary">
                                    <div class="w-full aspect-video bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center">
                                         <div class="w-1/2 h-2 bg-zinc-600 rounded"></div>
                                    </div>
                                    <span class="text-xs font-medium text-white">Oscuro</span>
                                </button>
                            </div>
                        </section>

                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mantenimiento</h3>
                            <div class="p-4 rounded-lg border bg-primary/5 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-medium">Versión Instalada</span>
                                    <span class="text-xs font-bold font-mono text-primary" id="settings-version-display">v3.6.0</span>
                                </div>
                                <p class="text-[10px] text-muted-foreground">Si la aplicación no se actualiza o ves errores visuales, usa el botón de abajo para forzar una limpieza del sistema.</p>
                                <button id="force-reload-btn" class="btn-shad btn-shad-outline w-full h-10 flex items-center justify-center gap-2 group">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"></i>
                                    Forzar Actualización Completa
                                </button>
                            </div>
                        </section>
                    </div>

                    <!-- Panel: Sincronización -->
                    <div id="panel-sync" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Google Drive</h3>
                                <div id="drive-status" class="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase">Desconectado</div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-xs font-medium">Nombre de carpeta en Drive</label>
                                <input type="text" id="config-drive-path" class="h-10 px-4 w-full" placeholder="p.ej. CloudNotesV3" autocomplete="off">
                                <p class="text-[10px] text-muted-foreground">Las notas se guardarán encriptadas dentro de esta carpeta.</p>
                            </div>
                            <button id="connect-drive-btn" class="btn-shad btn-shad-outline w-full h-10 flex items-center justify-center gap-2">
                                <i data-lucide="link" class="w-4 h-4"></i> Conectar con Google Drive
                            </button>
                            <button id="save-sync-config" class="btn-shad btn-shad-primary w-full h-10">Guardar Cambios</button>
                        </section>
                    </div>

                    <!-- Panel: Seguridad -->
                    <div id="panel-security" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Seguridad de la Sesión</h3>
                            <div class="p-4 rounded-lg border bg-muted/20 space-y-3">
                                <p class="text-xs text-muted-foreground">Cerrar la sesión actual eliminará la clave de acceso de la memoria y te llevará a la pantalla de desbloqueo.</p>
                                <button id="logout-btn" class="btn-shad bg-destructive/10 text-destructive hover:bg-destructive hover:text-white w-full h-10 flex items-center justify-center gap-2 transition-all">
                                    <i data-lucide="log-out" class="w-4 h-4"></i> Cerrar Sesión
                                </button>
                            </div>
                        </section>
                        
                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Encriptación</h3>
                            <div class="space-y-2">
                                <label class="text-xs font-medium">Algoritmo preferido</label>
                                <select id="config-algo" class="h-10 w-full px-3">
                                    <option value="aes-256-gcm">AES-256-GCM (Recomendado)</option>
                                    <option value="kyber">CRYSTALS-Kyber (Experimental)</option>
                                </select>
                            </div>
                             <button id="save-security-config" class="btn-shad btn-shad-primary w-full h-10">Actualizar Algoritmo</button>
                        </section>
                    </div>

                    <!-- Panel: Danger Zone -->
                    <div id="panel-danger" class="settings-panel hidden space-y-6">
                        <section class="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-4">
                            <h3 class="text-sm font-semibold text-destructive uppercase tracking-wider">Restablecer Aplicación</h3>
                            <p class="text-xs text-muted-foreground underline">Esta acción borrará permanentemente todas las notas y categorías almacenadas localmente en este navegador.</p>
                            <div class="space-y-2">
                                <label class="text-[10px] uppercase font-bold text-destructive/70">Para confirmar, escribe "confirmar" a continuación:</label>
                                <input type="text" id="factory-reset-confirm" class="h-10 px-4 mt-1 w-full border rounded-md" placeholder="Escribe la palabra..." autocomplete="off">
                            </div>
                            <button id="factory-reset" class="btn-shad bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full h-10 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                <i data-lucide="trash-2" class="w-4 h-4 mr-2"></i> Eliminar todos los datos locales
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
            appearance: 'General',
            sync: 'Sincronización Cloud',
            security: 'Seguridad y Sesión',
            danger: 'Zona Peligrosa'
        };
        title.innerText = titles[target] || 'Configuración';

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
    } else {
        updateView('appearance');
    }

    // Force Reload Logic
    const reloadBtn = document.getElementById('force-reload-btn');
    if (reloadBtn) {
        reloadBtn.onclick = handleForceReload;
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
