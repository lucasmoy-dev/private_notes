import { state, saveLocal } from '../state.js';
import { PALETTE } from '../constants.js';
import { safeCreateIcons, showToast, openPrompt } from '../ui-utils.js';
import { Security } from '../auth.js';

export function getCategoryManagerTemplate() {
    return `
    <div id="categories-modal" class="fixed inset-0 z-[70] hidden">
        <div class="dialog-overlay"></div>
        <div class="dialog-content max-w-lg p-0 overflow-hidden h-[500px] flex flex-col">
            <div class="p-6 flex justify-between items-center border-b">
                <div>
                    <h2 class="text-lg font-semibold text-foreground">Gestionar Etiquetas</h2>
                    <p class="text-xs text-muted-foreground">Organiza tus notas con categorías personalizadas</p>
                </div>
                <button class="close-categories p-2 hover:bg-accent rounded-md transition-colors"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>

            <div class="p-4 bg-muted/30 border-b">
                <div class="flex items-center gap-2">
                    <div class="relative flex-1">
                        <i data-lucide="tag" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
                        <input type="text" id="new-cat-name" placeholder="Nueva etiqueta..." 
                               class="pl-12 h-10 w-full bg-background" autocomplete="off">
                    </div>
                    <button id="add-cat-btn" class="btn-shad btn-shad-primary h-10 px-6">Crear</button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-2" id="cat-manager-list">
                <!-- Items injected here -->
            </div>
        </div>
        <!-- Color Picker Popover -->
        <div id="cat-color-picker" class="fixed z-[80] hidden popover-content p-2">
            <div class="grid grid-cols-5 gap-2" id="cat-palette-grid"></div>
        </div>
    </div>`;
}

export function renderCategoryManager(onRefreshSidebar, categories = null) {
    const list = document.getElementById('cat-manager-list');
    if (!list) return;
    list.innerHTML = '';

    // SYNC STATE: If categories passed from main.js, update local state reference
    if (categories) state.categories = categories;

    // Sort categories by creation (Date.now) is implied by array order if we push
    state.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-3 p-2 rounded-lg border bg-card/50 hover:bg-accent/30 transition-all group';

        item.innerHTML = `
            <div class="w-8 h-8 rounded-md cursor-pointer hover:scale-110 transition-transform shadow-sm flex-shrink-0 flex items-center justify-center border" 
                 style="background-color: ${cat.color};"
                 id="cp-${cat.id}" title="Cambiar color">
            </div>
            
            <input type="text" value="${cat.name}" 
                   class="bg-transparent border-none outline-none font-medium text-sm flex-1 focus:ring-0 transition-colors h-9 px-2 rounded hover:bg-background/50 focus:bg-background"
                   id="cn-${cat.id}" autocomplete="off">
            
            <div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button class="p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition-all ${cat.passwordHash ? 'text-primary' : 'text-muted-foreground'}"
                        id="lock-${cat.id}" title="${cat.passwordHash ? 'Protegido' : 'Protección'}">
                    <i data-lucide="${cat.passwordHash ? 'lock' : 'unlock'}" class="w-4 h-4"></i>
                </button>
                <button class="p-2 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                        id="del-${cat.id}" title="Eliminar">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        list.appendChild(item);

        // Bind events
        document.getElementById(`cp-${cat.id}`).onclick = (e) => {
            e.stopPropagation();
            changeColor(cat.id, onRefreshSidebar, e.currentTarget);
        };

        const nameInput = document.getElementById(`cn-${cat.id}`);
        // Real-time update in state, but save on blur/change
        nameInput.oninput = (e) => {
            cat.name = e.target.value;
            // Immediate reflection in sidebar without saving yet (for performance)
            onRefreshSidebar();
        };

        nameInput.onchange = async () => {
            await saveLocal();
            onRefreshSidebar();
            if (window.triggerAutoSync) window.triggerAutoSync();
        };

        document.getElementById(`lock-${cat.id}`).onclick = () => toggleLock(cat.id, onRefreshSidebar);
        document.getElementById(`del-${cat.id}`).onclick = () => deleteCat(cat.id, onRefreshSidebar);
    });

    safeCreateIcons();
}

async function changeColor(id, onRefresh, triggerEl) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    const picker = document.getElementById('cat-color-picker');
    const grid = document.getElementById('cat-palette-grid');
    grid.innerHTML = '';

    PALETTE.forEach(color => {
        const div = document.createElement('div');
        div.className = 'w-6 h-6 rounded-md cursor-pointer border hover:scale-110 transition-transform';
        div.style.backgroundColor = color;
        div.onclick = async () => {
            cat.color = color;
            await saveLocal();
            renderCategoryManager(onRefresh);
            onRefresh();
            picker.classList.add('hidden');
            if (window.triggerAutoSync) window.triggerAutoSync();
        };
        grid.appendChild(div);
    });

    const rect = triggerEl.getBoundingClientRect();
    picker.style.top = `${rect.bottom + 8}px`;
    picker.style.left = `${rect.left}px`;
    picker.classList.remove('hidden');

    const clickOutside = (e) => {
        if (!picker.contains(e.target) && e.target !== triggerEl) {
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
        const pass = await openPrompt('Seguridad', 'Etiqueta protegida. Ingresa contraseña para eliminar:');
        if (!pass) return;
        const hash = await Security.hashPassword(pass);
        if (hash !== cat.passwordHash) return showToast('❌ Error: Contraseña incorrecta');
    }

    if (confirm(`¿Eliminar la etiqueta "${cat.name}"? Las notas no se borrarán.`)) {
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
        const pass = await openPrompt('Seguridad', 'Ingresa la contraseña para quitar la protección:');
        if (!pass) return;
        const hash = await Security.hashPassword(pass);
        if (hash !== cat.passwordHash) return showToast('❌ Error: Contraseña incorrecta');
        cat.passwordHash = null;
        showToast('🔓 Protección quitada');
    } else {
        const pass = await openPrompt('Seguridad', 'Define una contraseña para proteger esta etiqueta:');
        if (pass) {
            cat.passwordHash = await Security.hashPassword(pass);
            showToast('🔒 Etiqueta protegida');
        }
    }

    await saveLocal();
    renderCategoryManager(onRefresh);
    onRefresh();
    if (window.triggerAutoSync) window.triggerAutoSync();
}
