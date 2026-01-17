export function getLayoutTemplate() {
    return `
    <div id="app" class="flex h-screen overflow-hidden opacity-100 transition-opacity duration-300">
        <!-- Sidebar Desktop -->
        <aside class="w-64 hidden md:flex flex-col border-r bg-sidebar">
            <style>
                @keyframes logo-rainbow {
                    0% { color: #6366f1; filter: drop-shadow(0 0 2px #6366f1); }
                    33% { color: #ec4899; filter: drop-shadow(0 0 2px #ec4899); }
                    66% { color: #10b981; filter: drop-shadow(0 0 2px #10b981); }
                    100% { color: #6366f1; filter: drop-shadow(0 0 2px #6366f1); }
                }
                .logo-animate { animation: logo-rainbow 8s infinite linear; }
            </style>
            <div class="p-6 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 overflow-hidden" id="sidebar-logo-container">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2 flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" class="w-full h-full logo-animate" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <div class="sidebar-title-text transition-opacity duration-300">
                        <h1 class="text-sm font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">Private Notes</h1>
                    </div>
                </div>
                <button id="sidebar-collapse-btn" class="p-2 hover:bg-accent rounded-md text-muted-foreground transition-all shrink-0" title="Contraer menú">
                    <i data-lucide="chevrons-left" class="w-4 h-4" id="sidebar-collapse-icon"></i>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto px-4 space-y-8">
                <div class="space-y-1">
                    <button class="nav-link w-full" data-view="all">
                        <i data-lucide="layout-grid" class="w-4 h-4"></i> <span class="sidebar-label text-foreground/90 font-bold">Todas las notas</span>
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center justify-between px-4" id="sidebar-categories-header">
                        <h3 class="sidebar-section-title text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Etiquetas</h3>
                    </div>
                    <div id="sidebar-categories" class="space-y-1"></div>
                </div>
            </div>

            <div class="p-6 space-y-2 mt-auto">
                <button id="sidebar-manage-cats" class="nav-link w-full text-xs opacity-60 hover:opacity-100">
                    <i data-lucide="tag" class="w-3.5 h-3.5"></i> <span class="sidebar-label">Gestionar Etiquetas</span>
                </button>
                <button id="settings-trigger" class="nav-link w-full text-xs opacity-60 hover:opacity-100">
                    <i data-lucide="settings" class="w-3.5 h-3.5"></i> <span class="sidebar-label">Configuración</span>
                </button>
                <button id="sidebar-pwa-install-btn" class="hidden flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
                    <i data-lucide="download" class="w-4 h-4"></i> <span class="sidebar-label">Instalar Aplicación</span>
                </button>
                <div class="mt-auto pt-4 border-t border-border/20 px-4">
                    <div id="app-version" class="text-[9px] text-muted-foreground font-mono opacity-50">v3.6.0</div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col bg-background relative overflow-hidden h-full">
            <!-- Desktop Header -->
            <header class="hidden md:flex h-16 items-center justify-between px-8 border-b shrink-0">
                <div class="flex items-center gap-4 flex-1">
                    <div class="relative w-full max-w-sm">
                        <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
                        <input type="text" id="search-input" placeholder="Buscar notas..." class="pl-12 h-9 w-full" autocomplete="off">
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button id="sync-btn" class="p-2 hover:bg-accent rounded-md text-muted-foreground transition-colors" title="Sincronizar ahora">
                        <i data-lucide="refresh-cw" class="w-5 h-5" id="sync-icon"></i>
                    </button>
                    <button id="pwa-install-btn" class="hidden btn-shad btn-shad-outline h-9 px-3">
                        <i data-lucide="download" class="w-4 h-4 mr-2"></i> Instalar
                    </button>
                    <button id="add-note-btn" class="btn-shad btn-shad-primary h-9">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Nueva Nota
                    </button>
                </div>
            </header>

            <!-- Mobile Top Bar Removed -->

            <!-- Grid -->
            <div id="notes-viewport" class="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                <div class="max-w-7xl mx-auto space-y-8">
                    <div class="flex items-end justify-between">
                        <div>
                            <h1 id="view-title" class="text-3xl font-bold tracking-tight">Todas las notas</h1>
                        </div>
                    </div>
                    <div id="notes-grid" class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>
                </div>
            </div>

            <!-- Mobile Bottom Nav -->
            <nav class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-2xl border-t flex items-center justify-around z-40 pb-safe">
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-sidebar-trigger-bottom">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors nav-link-mobile" data-view="all">
                    <i data-lucide="home" class="w-6 h-6"></i>
                </button>
                <button class="flex items-center justify-center relative w-full h-full" id="mobile-add-btn">
                    <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center transform -translate-y-5 hover:scale-105 active:scale-90 transition-all">
                        <i data-lucide="plus" class="w-8 h-8"></i>
                    </div>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-sync-btn-bottom">
                    <i data-lucide="refresh-cw" class="w-6 h-6"></i>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-search-trigger">
                    <i data-lucide="search" class="w-6 h-6"></i>
                </button>
            </nav>
        </main>

        <!-- Mobile Sidebar Drawer -->
        <div id="mobile-sidebar-overlay" class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] hidden">
            <div id="mobile-sidebar-drawer" class="w-[80vw] h-full bg-card border-r flex flex-col animate-in slide-in-from-left duration-300">
                <div class="p-6 flex items-center justify-between border-b">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2 flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" class="w-full h-full logo-animate" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <h1 class="text-sm font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">Private Notes</h1>
                    </div>
                    <button id="close-mobile-sidebar" class="p-2 hover:bg-accent rounded-md">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-8">
                    <div class="space-y-1">
                        <button class="nav-link-mobile-drawer w-full" data-view="all">
                            <i data-lucide="layout-grid" class="w-4 h-4"></i> Todas las notas
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between px-2" id="mobile-sidebar-categories-header">
                            <h3 class="sidebar-section-title">Etiquetas</h3>
                        </div>
                        <div id="mobile-sidebar-categories" class="space-y-1 px-2"></div>
                    </div>
                </div>
                <div class="p-6 border-t space-y-2">
                    <button id="mobile-pwa-install-btn" class="hidden flex items-center gap-3 w-full p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30">
                        <i data-lucide="download" class="w-5 h-5"></i> Instalar Aplicación
                    </button>
                    <button id="mobile-manage-cats" class="flex items-center gap-3 w-full p-3 rounded-md hover:bg-accent text-sm">
                        <i data-lucide="tag" class="w-4 h-4"></i> Gestionar Etiquetas
                    </button>
                    <button id="mobile-settings-btn" class="flex items-center gap-3 w-full p-3 rounded-md hover:bg-accent text-sm">
                        <i data-lucide="settings" class="w-4 h-4"></i> Configuración
                    </button>
                    <div class="pt-4 border-t space-y-3">
                        <div class="flex items-center justify-between px-3">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Sistema</span>
                            <span id="mobile-app-version" class="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">v3.6.0</span>
                        </div>
                        <button id="mobile-force-reload-btn" class="flex items-center gap-3 w-full p-3 rounded-md bg-destructive/5 text-destructive text-sm font-medium border border-destructive/10">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Forzar Limpieza y Recarga
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}
