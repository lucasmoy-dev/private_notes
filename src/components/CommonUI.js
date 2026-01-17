export function getCommonUITemplate() {
    return `
    <!-- Prompt Modal -->
    <div id="prompt-modal" class="fixed inset-0 z-[250] hidden flex items-start justify-center pt-24 md:pt-0 md:items-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-[340px] bg-card border shadow-2xl rounded-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div class="space-y-2">
                <h2 id="prompt-title" class="text-xl font-bold tracking-tight">Seguridad</h2>
                <p id="prompt-desc" class="text-sm text-muted-foreground leading-relaxed">Ingresa la contraseña para continuar</p>
            </div>
            <div class="space-y-4">
                <div class="relative group">
                    <input type="password" id="prompt-input" placeholder="Tu contraseña"
                        class="h-12 w-full text-center tracking-widest outline-none pr-12 bg-muted/50 border border-border focus:border-indigo-500/50 transition-all rounded-xl">
                    <button type="button"
                        class="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass"
                        data-target="prompt-input">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex gap-3 pt-2">
                    <button id="prompt-cancel" class="h-11 px-4 rounded-xl border bg-background hover:bg-accent text-sm font-medium flex-1">Cancelar</button>
                    <button id="prompt-confirm" class="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex-1 shadow-lg shadow-indigo-500/20">Confirmar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast">
        <div class="border">
            ¡Acción completada!
        </div>
    </div>`;
}
