import { safeCreateIcons } from '../ui-utils.js';

export function getSettingsTemplate() {
    return `
    <div id="settings-modal" class="fixed inset-0 z-[80] hidden">
        <div class="dialog-overlay"></div>
        <div class="dialog-content max-w-2xl p-0 overflow-hidden flex flex-col md:flex-row h-[500px]">
            <!-- Sidebar Settings -->
            <div class="w-full md:w-48 bg-muted/50 border-b md:border-b-0 md:border-r p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                <button class="settings-tab active" data-tab="appearance">
                    <i data-lucide="palette" class="w-4 h-4"></i> Apariencia
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
            <div class="flex-1 flex flex-col min-w-0">
                <div class="p-4 border-b flex justify-between items-center">
                    <h2 id="settings-tab-title" class="font-bold">Configuración</h2>
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
                    </div>

                    <!-- Panel: Sincronización -->
                    <div id="panel-sync" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Google Drive</h3>
                                <span id="drive-status" class="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold uppercase">Desconectado</span>
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
                            <h3 class="text-sm font-semibold text-destructive uppercase tracking-wider">Acciones Irreversibles</h3>
                            <p class="text-xs text-muted-foreground">Al restaurar de fábrica se borrarán todas las notas, categorías y configuraciones de este navegador.</p>
                            <button id="factory-reset" class="btn-shad bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full h-10">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-2"></i> Borrar Todo Localmente
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

    tabs.forEach(tab => {
        tab.onclick = () => {
            const target = tab.dataset.tab;

            // UI Update
            tabs.forEach(t => t.classList.toggle('active', t === tab));
            panels.forEach(p => p.classList.toggle('hidden', p.id !== `panel-${target}`));

            // Title mapping
            const titles = {
                appearance: 'Apariencia y Temas',
                sync: 'Sincronización Cloud',
                security: 'Seguridad y Cifrado',
                danger: 'Zona Peligrosa'
            };
            title.innerText = titles[target] || 'Configuración';
            safeCreateIcons();
        };
    });
}
