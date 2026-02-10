import { t } from '../i18n.js';

export function getLayoutTemplate() {
    return `
    <div id="app" class="flex h-screen overflow-hidden opacity-100 transition-opacity duration-300">
        <!-- Sidebar Desktop -->
        <aside class="w-60 hidden md:flex flex-col border-r bg-sidebar">
            <div class="p-5 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 overflow-hidden" id="sidebar-logo-container">
                    <div class="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center shrink-0">
                        <img src="./favicon.png" alt="Logo" class="w-full h-full object-contain">
                    </div>
                    <div class="sidebar-title-text transition-opacity duration-300">
                        <h1 class="text-xs font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">${t('app_name')}</h1>
                    </div>
                </div>
                <button id="sidebar-collapse-btn" class="p-1.5 hover:bg-accent rounded-md text-muted-foreground transition-all shrink-0" title="Contraer menú">
                    <i data-lucide="chevrons-left" class="w-3.5 h-3.5" id="sidebar-collapse-icon"></i>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto px-3 space-y-6">
                <div class="space-y-0.5">
                    <button class="nav-link w-full" data-view="all">
                        <div class="flex items-center gap-3">
                            <i data-lucide="layout-grid" class="w-4 h-4"></i>
                            <span class="sidebar-label text-foreground/90 font-bold">${t('sidebar.all_notes')}</span>
                        </div>
                    </button>
                </div>

                <div class="space-y-3">
                    <div id="sidebar-categories" class="space-y-0.5"></div>
                </div>

                <div class="space-y-0.5 pt-4 border-t border-border/10">
                    <button id="sidebar-sync-btn" class="nav-link w-full text-[11px] opacity-70 hover:opacity-100 group">
                        <div class="flex items-center gap-3">
                            <i data-lucide="refresh-cw" class="w-4 h-4 group-active:animate-spin"></i>
                            <span class="sidebar-label font-bold">${t('header.sync')}</span>
                        </div>
                    </button>
                </div>
            </div>

            <div class="p-4 space-y-1.5 mt-auto">
                <button id="sidebar-manage-cats" class="nav-link w-full text-[11px] opacity-70 hover:opacity-100">
                    <div class="flex items-center gap-3">
                        <i data-lucide="tag" class="w-4 h-4"></i>
                        <span class="sidebar-label">${t('sidebar.manage_tags')}</span>
                    </div>
                </button>
                <button id="sidebar-pwa-install-btn" class="nav-link w-full text-[11px] opacity-70 hover:opacity-100 hidden">
                    <div class="flex items-center gap-3">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        <span class="sidebar-label">${t('sidebar.install_app')}</span>
                    </div>
                </button>
                <button id="settings-trigger" class="nav-link w-full text-[11px] opacity-70 hover:opacity-100">
                    <div class="flex items-center gap-3">
                        <i data-lucide="settings" class="w-4 h-4"></i>
                        <span class="sidebar-label">${t('sidebar.settings')}</span>
                    </div>
                </button>
                <div class="pt-3 border-t border-border/10 px-3">
                    <div id="app-version" class="text-[8px] text-muted-foreground font-mono opacity-40">v4.0.0</div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col bg-background relative overflow-hidden h-full">
            <!-- Desktop Header -->
            <header class="hidden md:flex h-14 items-center justify-between px-6 border-b shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                <div class="flex items-center gap-4 flex-1">
                    <div class="relative w-full max-w-xs">
                        <input type="text" id="search-notes" placeholder="${t('header.search_placeholder')}" 
                               class="h-9 w-full rounded-full bg-muted/50 border-none pl-4 pr-10 text-xs focus:ring-1 focus:ring-violet-500/50 transition-all">
                        <i data-lucide="search" class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button id="pwa-install-btn" class="p-1.5 hover:bg-accent rounded-md text-muted-foreground transition-colors hidden" title="${t('header.install')}">
                        <i data-lucide="download" class="w-4 h-4"></i>
                    </button>
                    <button id="add-note-btn" class="btn-shad btn-shad-primary h-8 px-4 text-xs font-bold">
                        <i data-lucide="plus" class="w-3.5 h-3.5 mr-2"></i> ${t('header.new_note')}
                    </button>
                </div>
            </header>

            <!-- Grid -->
            <div id="notes-viewport" class="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
                <div class="max-w-6xl mx-auto space-y-6">
                    <div class="flex items-end justify-between">
                        <div>
                            <h1 id="view-title" class="text-2xl font-bold tracking-tight">${t('header.view_title_all')}</h1>
                        </div>
                    </div>
                    <div id="notes-grid" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"></div>
                </div>
            </div>

            <!-- Mobile Bottom Nav -->
            <nav class="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-2xl border-t flex items-center justify-around z-40 pb-safe">
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-sidebar-trigger-bottom">
                    <i data-lucide="menu" class="w-5 h-5"></i>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors nav-link-mobile" data-view="all">
                    <i data-lucide="home" class="w-5 h-5"></i>
                </button>
                <button class="flex items-center justify-center relative w-full h-full" id="mobile-add-btn">
                    <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center transform -translate-y-4 hover:scale-105 active:scale-90 transition-all">
                        <i data-lucide="plus" class="w-7 h-7"></i>
                    </div>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-search-trigger">
                    <i data-lucide="search" class="w-5 h-5"></i>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-settings-btn-nav">
                    <i data-lucide="settings" class="w-5 h-5"></i>
                </button>
            </nav>
        </main>

        <!-- Mobile Sidebar Drawer -->
        <div id="mobile-sidebar-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] hidden">
            <div id="mobile-sidebar-drawer" class="w-[75vw] max-w-[300px] h-full bg-card border-r flex flex-col animate-in slide-in-from-left duration-300">
                <div class="p-4 flex items-center justify-between border-b">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center shrink-0">
                            <img src="./favicon.png" alt="Logo" class="w-full h-full object-contain">
                        </div>
                        <h1 class="text-xs font-bold tracking-tight">${t('app_name')}</h1>
                    </div>
                    <button id="close-mobile-sidebar" class="p-2 hover:bg-accent rounded-md">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-3 space-y-6">
                    <div class="space-y-0.5">
                        <button class="nav-link-mobile-drawer w-full" data-view="all">
                            <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> ${t('sidebar.all_notes')}
                        </button>
                    </div>
                    <div class="space-y-3">
                        <div id="mobile-sidebar-categories" class="space-y-0.5"></div>
                    </div>
                </div>
                <div class="p-4 border-t space-y-1.5">
                    <button id="mobile-sync-btn" class="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-accent text-xs font-bold text-primary bg-primary/5">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> ${t('header.sync')}
                    </button>
                    <button id="mobile-manage-cats" class="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-accent text-xs">
                        <i data-lucide="tag" class="w-3.5 h-3.5"></i> ${t('sidebar.manage_tags')}
                    </button>
                    <button id="mobile-pwa-install-btn" class="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-accent text-xs hidden">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i> ${t('sidebar.install_app')}
                    </button>
                    <button id="mobile-settings-btn" class="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-accent text-xs">
                        <i data-lucide="settings" class="w-3.5 h-3.5"></i> ${t('sidebar.settings')}
                    </button>
                    <div class="pt-3 border-t space-y-2">
                        <div class="flex items-center justify-between px-2">
                            <span class="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">${t('sidebar.system')}</span>
                            <span id="mobile-app-version" class="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">v4.0.0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}
