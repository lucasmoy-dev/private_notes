import { state, saveLocal } from '../state.js';
import { CAT_ICONS } from '../constants.js';
import { safeCreateIcons, showToast, openPrompt } from '../ui-utils.js';
import { SecurityService as Security } from '../security.js';
import { t } from '../i18n.js';

let selectedNewIcon = 'tag';

export function getCategoryManagerTemplate() {
    return `
    <div id="categories-modal" class="fixed inset-0 z-[70] hidden">
        <div class="dialog-overlay close-categories"></div>
        <div class="dialog-content w-full h-full md:max-w-xl md:h-[550px] md:rounded-3xl rounded-none flex flex-col shadow-2xl p-0 overflow-hidden">
            <div class="p-5 md:p-6 flex justify-between items-center border-b bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h2 class="text-xl md:text-2xl font-bold text-foreground">${t('categories.title')}</h2>
                </div>
                <button class="close-categories p-2 hover:bg-accent rounded-full transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>

            <div class="p-4 md:p-5 bg-muted/20 border-b">
                <div class="flex items-center gap-3 max-w-xl mx-auto w-full">
                    <button id="new-cat-icon-trigger" class="w-10 h-10 md:w-11 md:h-11 bg-background border flex items-center justify-center rounded-xl hover:bg-accent transition-all shrink-0">
                        <i data-lucide="tag" id="new-cat-icon-preview" class="w-4 h-4 md:w-5 md:h-5 text-foreground/50"></i>
                    </button>
                    <div class="relative flex-1">
                        <input type="text" id="new-cat-name" placeholder="${t('categories.add_new')}..." 
                               class="h-10 md:h-11 w-full px-4 bg-background border-none ring-1 ring-border focus:ring-2 focus:ring-violet-500 rounded-xl transition-all text-sm md:text-base" autocomplete="off">
                    </div>
                    <button id="add-cat-btn" class="btn-shad btn-shad-primary h-10 md:h-11 px-6 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        <span>${t('common.confirm')}</span>
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5 max-w-xl mx-auto w-full" id="cat-manager-list">
                <!-- Items injected here -->
            </div>
            
            <div class="p-4 border-t bg-background/50 backdrop-blur-md sticky bottom-0">
                <button class="close-categories w-full md:max-w-[200px] mx-auto block h-11 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all text-sm underline">Cerrar</button>
            </div>
        </div>
        <div id="cat-icon-picker" class="fixed z-[80] hidden popover-content p-4 w-72 max-h-80 overflow-y-auto bg-popover border shadow-2xl rounded-3xl backdrop-blur-3xl">
            <div class="grid grid-cols-5 gap-3 p-1" id="cat-icons-grid"></div>
        </div>
    </div>`;
}

export function renderCategoryManager(onRefreshSidebar, categories = null) {
    const list = document.getElementById('cat-manager-list');
    if (!list) return;
    list.innerHTML = '';

    if (categories) state.categories = categories;

    state.categories.forEach((cat, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2 p-1.5 rounded-xl border bg-card/50 hover:bg-accent/30 transition-all group';

        item.innerHTML = `
            <div class="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-1 hover:bg-accent rounded-lg move-up" data-id="${cat.id}"><i data-lucide="chevron-up" class="w-4 h-4 text-muted-foreground"></i></button>
                <button class="p-1 hover:bg-accent rounded-lg move-down" data-id="${cat.id}"><i data-lucide="chevron-down" class="w-4 h-4 text-muted-foreground"></i></button>
            </div>

            <div class="w-10 h-10 rounded-xl cursor-pointer hover:bg-accent border bg-background flex items-center justify-center shrink-0 transition-all active:scale-95" 
                 id="icon-trigger-${cat.id}" title="Cambiar icono">
                 <i data-lucide="${cat.icon || 'tag'}" class="w-4 h-4 text-foreground/80"></i>
            </div>
            
            <div class="flex flex-col flex-1 min-w-0">
                <input type="text" value="${cat.name}" 
                       class="bg-transparent border-none outline-none font-bold text-sm w-full focus:ring-0 transition-colors h-6 px-0 rounded"
                       id="cn-${cat.id}" autocomplete="off">
                <span class="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">${cat.passwordHash ? 'Restringida' : 'Pública'}</span>
            </div>
            
            <div class="flex items-center gap-1">
                <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-500/10 transition-all ${cat.passwordHash ? 'text-violet-500 bg-violet-500/5 border border-violet-500/20' : 'text-muted-foreground border border-transparent'}"
                        id="lock-${cat.id}" title="${cat.passwordHash ? 'Restringida' : 'Restricción'}">
                    <i data-lucide="${cat.passwordHash ? 'lock' : 'unlock'}" class="w-4 h-4"></i>
                </button>
                <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground border border-transparent transition-all"
                        id="del-${cat.id}" title="Eliminar">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        list.appendChild(item);

        // Bind events
        document.getElementById(`icon-trigger-${cat.id}`).onclick = (e) => {
            e.stopPropagation();
            changeIcon(cat.id, onRefreshSidebar, e.currentTarget);
        };

        const nameInput = document.getElementById(`cn-${cat.id}`);
        nameInput.oninput = (e) => {
            cat.name = e.target.value;
            onRefreshSidebar();
        };
        nameInput.onchange = async () => {
            await saveLocal();
            onRefreshSidebar();
            if (window.triggerAutoSync) window.triggerAutoSync();
        };

        const moveUpBtn = item.querySelector('.move-up');
        const moveDownBtn = item.querySelector('.move-down');
        moveUpBtn.onclick = () => moveUp(cat.id, onRefreshSidebar);
        moveDownBtn.onclick = () => moveDown(cat.id, onRefreshSidebar);

        document.getElementById(`lock-${cat.id}`).onclick = () => toggleLock(cat.id, onRefreshSidebar);
        document.getElementById(`del-${cat.id}`).onclick = () => deleteCat(cat.id, onRefreshSidebar);
    });

    const newCatIconBtn = document.getElementById('new-cat-icon-trigger');
    if (newCatIconBtn) {
        newCatIconBtn.onclick = (e) => {
            e.stopPropagation();
            openIconPickerForNew(newCatIconBtn);
        };
    }

    safeCreateIcons();
}

async function moveUp(id, onRefresh) {
    const index = state.categories.findIndex(c => c.id === id);
    if (index > 0) {
        const temp = state.categories[index];
        state.categories[index] = state.categories[index - 1];
        state.categories[index - 1] = temp;
        await saveLocal();
        renderCategoryManager(onRefresh);
        onRefresh();
        if (window.triggerAutoSync) window.triggerAutoSync();
    }
}

async function moveDown(id, onRefresh) {
    const index = state.categories.findIndex(c => c.id === id);
    if (index < state.categories.length - 1) {
        const temp = state.categories[index];
        state.categories[index] = state.categories[index + 1];
        state.categories[index + 1] = temp;
        await saveLocal();
        renderCategoryManager(onRefresh);
        onRefresh();
        if (window.triggerAutoSync) window.triggerAutoSync();
    }
}

async function openIconPickerForNew(triggerEl) {
    const picker = document.getElementById('cat-icon-picker');
    const grid = document.getElementById('cat-icons-grid');
    grid.innerHTML = '';

    CAT_ICONS.forEach(iconName => {
        const btn = document.createElement('button');
        btn.className = 'w-9 h-9 flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground';
        btn.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
        btn.onclick = () => {
            selectedNewIcon = iconName;
            const trigger = document.getElementById('new-cat-icon-trigger');
            if (trigger) {
                trigger.innerHTML = `<i data-lucide="${iconName}" id="new-cat-icon-preview" class="w-5 h-5 md:w-6 md:h-6 text-foreground/50"></i>`;
                safeCreateIcons();
            }
            picker.classList.add('hidden');
        };
        grid.appendChild(btn);
    });

    safeCreateIcons();
    const rect = triggerEl.getBoundingClientRect();
    picker.style.top = `${rect.bottom + 8}px`;
    picker.style.left = `${rect.left}px`;
    picker.classList.remove('hidden');

    const clickOutside = (e) => {
        if (!picker.contains(e.target) && !triggerEl.contains(e.target)) {
            picker.classList.add('hidden');
            document.removeEventListener('click', clickOutside);
        }
    };
    setTimeout(() => document.addEventListener('click', clickOutside), 10);
}

async function changeIcon(id, onRefresh, triggerEl) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    const picker = document.getElementById('cat-icon-picker');
    const grid = document.getElementById('cat-icons-grid');
    grid.innerHTML = '';

    CAT_ICONS.forEach(iconName => {
        const btn = document.createElement('button');
        btn.className = 'w-9 h-9 flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground';
        btn.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
        btn.onclick = async () => {
            cat.icon = iconName;
            await saveLocal();
            renderCategoryManager(onRefresh);
            onRefresh();
            picker.classList.add('hidden');
            if (window.triggerAutoSync) window.triggerAutoSync();
        };
        grid.appendChild(btn);
    });

    safeCreateIcons();

    const rect = triggerEl.getBoundingClientRect();
    picker.style.top = `${rect.bottom + 8}px`;
    picker.style.left = `${rect.left}px`;
    picker.classList.remove('hidden');

    const clickOutside = (e) => {
        if (!picker.contains(e.target) && !triggerEl.contains(e.target)) {
            picker.classList.add('hidden');
            document.removeEventListener('click', clickOutside);
        }
    };
    setTimeout(() => document.addEventListener('click', clickOutside), 10);
}

async function updateName(id, newName, onRefresh) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat || !newName.trim()) return renderCategoryManager(onRefresh);

    cat.name = newName;
    await saveLocal();
    onRefresh();
}

async function deleteCat(id, onRefresh) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    if (cat.passwordHash) {
        const result = await openPrompt('Seguridad', `Ingresa tu clave para eliminar "${cat.name}":`, true);
        if (!result) return;

        let isValid = false;
        if (typeof result === 'object' && result.biometric) {
            isValid = true;
        } else {
            const hash = await Security.hash(result);
            if (hash === (cat.passwordHash === 'MASTER' ? localStorage.getItem('cn_master_hash_v3') : cat.passwordHash)) {
                isValid = true;
            }
        }
        if (!isValid) return showToast('❌ Clave incorrecta');
    }

    if (confirm(`¿Eliminar la categoría "${cat.name}"? Las notas no se borrarán.`)) {
        state.categories = state.categories.filter(c => c.id !== id);
        state.notes.forEach(n => { if (n.categoryId === id) n.categoryId = null; });
        if (state.currentView === id) state.currentView = 'all';
        await saveLocal();
        renderCategoryManager(onRefresh);
        onRefresh();
        if (window.triggerAutoSync) window.triggerAutoSync();
    }
}

async function toggleLock(id, onRefresh) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    if (cat.passwordHash) {
        const result = await openPrompt('Seguridad', 'Confirma tu sesión para quitar la restricción:', true);
        if (!result) return;

        let isValid = false;
        if (typeof result === 'object' && result.biometric) {
            isValid = true;
        } else {
            const hash = await Security.hash(result);
            if (hash === (cat.passwordHash === 'MASTER' ? localStorage.getItem('cn_master_hash_v3') : cat.passwordHash)) {
                isValid = true;
            }
        }

        if (isValid) {
            cat.passwordHash = null;
            showToast('🔓 Restricción quitada');
        } else {
            return showToast('❌ Clave incorrecta');
        }
    } else {
        cat.passwordHash = 'MASTER';
        showToast('🔒 Categoría restringida (usa tu clave maestra)');
    }

    await saveLocal();
    renderCategoryManager(onRefresh);
    onRefresh();
    if (window.triggerAutoSync) window.triggerAutoSync();
}
