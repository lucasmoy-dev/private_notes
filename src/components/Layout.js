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
            <div class="p-6 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2 flex items-center justify-center border border-primary/20 shadow-inner">
                    <svg viewBox="0 0 24 24" fill="none" class="w-full h-full logo-animate" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                </div>
                <div>
                    <h1 class="text-sm font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Private Notes</h1>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto px-4 space-y-8">
                <div class="space-y-1">
                    <button class="nav-link active w-full" data-view="all">
                        <i data-lucide="layout-grid" class="w-4 h-4"></i> Todas las notas
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
                    <i data-lucide="tag" class="w-3.5 h-3.5"></i> Gestionar Etiquetas
                </button>
                <button id="settings-trigger" class="nav-link w-full text-xs opacity-60 hover:opacity-100">
                    <i data-lucide="settings" class="w-3.5 h-3.5"></i> Configuración
                </button>
                <button id="sidebar-pwa-install-btn" class="hidden nav-link w-full text-xs opacity-60 hover:opacity-100">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i> Instalar Aplicación
                </button>
                <div class="mt-auto pt-4 border-t border-border/20 px-4">
                    <div id="app-version" class="text-[9px] text-muted-foreground font-mono opacity-30">v3.5.1</div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col bg-background relative overflow-hidden h-full">
            <!-- Desktop Header -->
            <header class="hidden md:flex h-16 items-center justify-between px-8 border-b">
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

            <!-- Mobile Top Bar -->
            <div class="md:hidden h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div class="flex items-center gap-3">
                    <button id="mobile-sidebar-trigger" class="p-2 -ml-2 hover:bg-accent rounded-md">
                        <i data-lucide="menu" class="w-5 h-5"></i>
                    </button>
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-1 flex items-center justify-center border border-primary/20 shadow-inner">
                            <svg viewBox="0 0 24 24" fill="none" class="w-full h-full text-primary" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <span class="font-bold tracking-tight text-lg">Private Notes</span>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <button id="mobile-search-btn" class="p-2 hover:bg-accent rounded-md">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </button>
                </div>
                <div id="mobile-search-bar" class="absolute inset-0 bg-background flex items-center px-4 gap-2 hidden animate-in slide-in-from-top duration-200">
                    <i data-lucide="search" class="w-4 h-4 text-muted-foreground"></i>
                    <input type="text" id="mobile-search-input-top" placeholder="Buscar en tus notas..." class="flex-1 bg-transparent border-none outline-none text-sm h-full" autocomplete="off">
                    <button id="close-mobile-search" class="p-2 hover:bg-accent rounded-md">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <!-- Grid -->
            <div id="notes-viewport" class="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                <div class="max-w-7xl mx-auto space-y-8">
                    <div class="flex items-end justify-between">
                        <div>
                            <h1 id="view-title" class="text-3xl font-bold tracking-tight">Todas las notas</h1>
                            <p id="view-desc" class="text-sm text-muted-foreground mt-1">Organiza tus pensamientos y protege tu privacidad.</p>
                        </div>
                    </div>
                    <div id="notes-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>
                </div>
            </div>

            <!-- Mobile Bottom Nav -->
            <nav class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-2xl border-t flex items-center justify-around z-40 pb-safe">
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-sidebar-trigger-bottom">
                    <i data-lucide="menu" class="w-5 h-5"></i>
                    <span class="text-[10px] font-medium">Menú</span>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors nav-link-mobile" data-view="all">
                    <i data-lucide="home" class="w-5 h-5"></i>
                    <span class="text-[10px] font-medium">Inicio</span>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-content text-muted-foreground active:text-primary transition-colors relative" id="mobile-add-btn">
                    <div class="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform -translate-y-4 border-4 border-background">
                        <i data-lucide="plus" class="w-6 h-6"></i>
                    </div>
                    <span class="text-[10px] font-medium absolute -bottom-1">Crear</span>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-sync-btn-bottom">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                    <span class="text-[10px] font-medium">Sincronizar</span>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-search-trigger">
                    <i data-lucide="search" class="w-5 h-5"></i>
                    <span class="text-[10px] font-medium">Buscar</span>
                </button>
            </nav>
        </main>

        <!-- Mobile Sidebar Drawer -->
        <div id="mobile-sidebar-overlay" class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] hidden">
            <div id="mobile-sidebar-drawer" class="w-[80vw] h-full bg-card border-r flex flex-col animate-in slide-in-from-left duration-300">
                <div class="p-6 flex items-center justify-between border-b">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 p-1 flex items-center justify-center border border-primary/20 shadow-inner">
                            <svg viewBox="0 0 24 24" fill="none" class="w-full h-full text-primary" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <span class="font-bold tracking-tight">Private Notes</span>
                    </div>
                    <button id="close-mobile-sidebar" class="p-2 hover:bg-accent rounded-md">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-8">
                    <div class="space-y-1">
                        <button class="nav-link-mobile-drawer active w-full" data-view="all">
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
                    <button id="mobile-pwa-install-btn" class="hidden flex items-center gap-3 w-full p-3 rounded-md bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                        <i data-lucide="download" class="w-4 h-4"></i> Instalar Aplicación
                    </button>
                    <button id="mobile-manage-cats" class="flex items-center gap-3 w-full p-3 rounded-md hover:bg-accent text-sm">
                        <i data-lucide="tag" class="w-4 h-4"></i> Gestionar Etiquetas
                    </button>
                    <button id="mobile-settings-btn" class="flex items-center gap-3 w-full p-3 rounded-md hover:bg-accent text-sm">
                        <i data-lucide="settings" class="w-4 h-4"></i> Configuración
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}
