import { state, saveLocal } from '../state.js';
import { NOTE_THEMES, PALETTE, EMOJIS } from '../constants.js';
import { isColorDark, safeCreateIcons, showToast, openPrompt } from '../ui-utils.js';
import { Security } from '../auth.js';

let lastSelectedRange = null;

export function getEditorTemplate() {
    return `
    <div id="editor-modal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-background/80 backdrop-blur-sm dialog-overlay"></div>
        <div class="dialog-content max-w-2xl h-[80vh] flex flex-col">
            <div class="flex items-center justify-between border-b pb-4">
                <input type="text" id="edit-title" placeholder="Título de la nota"
                    class="bg-transparent text-xl font-bold outline-none border-none placeholder:text-muted-foreground w-full">
                <button id="close-editor" class="text-muted-foreground hover:text-foreground"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>

            <div class="flex-1 py-4 overflow-y-auto">
                <div class="flex items-center gap-1 mb-4 p-1 border rounded-md bg-muted/30 w-fit">
                    <button class="editor-tool" data-cmd="bold"><i data-lucide="bold" class="w-4 h-4"></i></button>
                    <button id="open-text-colors" class="editor-tool" title="Color de texto"><i data-lucide="type" class="w-4 h-4"></i></button>
                    <div class="w-px h-4 bg-border mx-1"></div>
                    <button class="editor-tool" data-cmd="italic"><i data-lucide="italic" class="w-4 h-4"></i></button>
                    <button class="editor-tool" data-cmd="underline"><i data-lucide="underline" class="w-4 h-4"></i></button>
                    <div class="w-px h-4 bg-border mx-1"></div>
                    <button id="open-emojis" class="editor-tool"><i data-lucide="smile" class="w-4 h-4"></i></button>
                </div>

                <div id="edit-content" contenteditable="true"
                    class="min-h-[200px] outline-none text-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none"
                    placeholder="Empieza a escribir..."></div>
            </div>

            <div class="border-t pt-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="flex items-center bg-muted/30 p-1 rounded-md border mr-2">
                        <button id="open-colors" class="editor-tool" title="Color de fondo"><i data-lucide="palette" class="w-4 h-4"></i></button>
                    </div>

                    <div class="relative group" id="cat-select-wrapper">
                        <button id="cat-dropdown-trigger"
                            class="h-9 px-3 rounded-md border border-input bg-background/50 text-xs flex items-center gap-2 hover:bg-accent transition-all">
                            <span id="selected-cat-label">Sin categoría</span>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-muted-foreground"></i>
                        </button>
                        <div id="cat-dropdown-menu"
                            class="absolute bottom-full mb-2 left-0 w-48 bg-popover border rounded-md shadow-xl hidden z-50 py-1 overflow-hidden">
                        </div>
                        <select id="edit-category" class="hidden">
                            <option value="">Sin categoría</option>
                        </select>
                    </div>
                    <button id="toggle-pin" class="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-all">
                        <i data-lucide="pin" class="w-4 h-4"></i>
                    </button>
                    <button id="toggle-lock" class="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-all">
                        <i data-lucide="lock" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex gap-2">
                    <button id="delete-note" class="btn-shad bg-destructive/10 text-destructive hover:bg-destructive hover:text-white h-9 px-3" title="Eliminar nota">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                    <button id="save-note" class="btn-shad btn-shad-primary h-9">Guardar Nota</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Popovers -->
    <div id="color-popover" class="fixed z-[60] hidden popover-content">
        <div class="grid grid-cols-6 gap-2" id="bg-color-grid"></div>
    </div>
    <div id="text-color-popover" class="fixed z-[60] hidden popover-content">
        <div class="grid grid-cols-6 gap-2" id="text-color-grid"></div>
    </div>
    <div id="emoji-popover" class="fixed z-[60] hidden popover-content w-80">
        <div class="grid grid-cols-8 gap-2 h-64 overflow-y-auto" id="emoji-grid"></div>
    </div>`;
}

export function initEditor(onSave) {
    const modal = document.getElementById('editor-modal');
    const titleEl = document.getElementById('edit-title');
    const contentEl = document.getElementById('edit-content');
    const closeBtn = document.getElementById('close-editor');
    const saveBtn = document.getElementById('save-note');
    const deleteBtn = document.getElementById('delete-note');

    closeBtn.onclick = closeEditor;
    saveBtn.onclick = async () => {
        await saveActiveNote();
        onSave();
    };
    deleteBtn.onclick = async () => {
        if (state.editingNoteId && confirm('¿Eliminar esta nota?')) {
            state.notes = state.notes.filter(n => n.id !== state.editingNoteId);
            await saveLocal();
            closeEditor();
            onSave();
        }
    };

    document.querySelectorAll('.editor-tool').forEach(btn => {
        if (btn.dataset.cmd) {
            btn.onmousedown = (e) => {
                e.preventDefault();
                restoreSelection();
                document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
                updateToolsUI();
            };
        }
    });

    initPopovers();
    contentEl.onkeyup = () => { saveSelection(); updateToolsUI(); };
    contentEl.onmouseup = () => { saveSelection(); updateToolsUI(); };
    contentEl.onfocus = () => { saveSelection(); updateToolsUI(); };
}

function updateToolsUI() {
    document.querySelectorAll('.editor-tool[data-cmd]').forEach(btn => {
        const cmd = btn.dataset.cmd;
        const active = document.queryCommandState(cmd);
        btn.classList.toggle('bg-primary/20', active);
        btn.classList.toggle('text-primary', active);
    });
}

export function openEditor(note = null) {
    const modal = document.getElementById('editor-modal');
    const titleEl = document.getElementById('edit-title');
    const contentEl = document.getElementById('edit-content');
    const catSelect = document.getElementById('edit-category');
    const dialogContent = modal.querySelector('.dialog-content');

    state.editingNoteId = note ? note.id : null;
    titleEl.value = note ? note.title : '';
    contentEl.innerHTML = note ? note.content : '';

    let defaultCat = '';
    if (!note && state.currentView !== 'all') defaultCat = state.currentView;
    catSelect.value = note ? (note.categoryId || '') : defaultCat;

    const theme = NOTE_THEMES.find(t => t.id === (note ? note.themeId : 'default')) || NOTE_THEMES[0];
    const bgColor = (state.settings.theme === 'dark') ? theme.dark : theme.light;
    const isDark = (theme.id === 'default') ? (state.settings.theme === 'dark') : isColorDark(bgColor);

    dialogContent.style.backgroundColor = bgColor;
    dialogContent.style.color = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
    dialogContent.dataset.themeId = theme.id;

    titleEl.style.color = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
    contentEl.style.color = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';

    const tools = modal.querySelectorAll('.editor-tool, #cat-dropdown-trigger, #toggle-pin, #toggle-lock');
    tools.forEach(tool => {
        tool.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
        tool.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        tool.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    });

    updatePinUI(note ? note.pinned : false);
    updateLockUI(note ? !!note.passwordHash : false);
    updateCategoryUI();

    modal.classList.remove('hidden');
    contentEl.focus();
}

function closeEditor() {
    document.getElementById('editor-modal').classList.add('hidden');
    state.editingNoteId = null;
}

async function saveActiveNote() {
    let title = document.getElementById('edit-title').value.trim();
    const content = document.getElementById('edit-content').innerHTML;
    const catId = document.getElementById('edit-category').value;
    const isPinned = document.getElementById('toggle-pin').dataset.active === 'true';
    const hasLock = document.getElementById('toggle-lock').dataset.active === 'true';
    const themeId = document.querySelector('#editor-modal .dialog-content').dataset.themeId;

    if (!title) title = new Date().toLocaleString();
    if (!content.trim()) return showToast('La nota está vacía');

    const noteIndex = state.notes.findIndex(n => n.id === state.editingNoteId);
    const noteData = {
        id: state.editingNoteId || Date.now().toString(),
        title,
        content,
        categoryId: catId || null,
        pinned: isPinned,
        themeId: themeId || 'default',
        passwordHash: hasLock ? (noteIndex >= 0 ? state.notes[noteIndex].passwordHash : null) : null,
        updatedAt: Date.now()
    };

    if (hasLock && !noteData.passwordHash) {
        const pass = await openPrompt('Seguridad', 'Establece una contraseña para esta nota:');
        if (pass) noteData.passwordHash = await Security.hashPassword(pass);
        else return;
    }

    if (noteIndex >= 0) state.notes[noteIndex] = noteData;
    else state.notes.unshift(noteData);

    await saveLocal();
    closeEditor();
    if (window.triggerAutoSync) window.triggerAutoSync();
}

function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) lastSelectedRange = sel.getRangeAt(0);
}

function restoreSelection() {
    if (lastSelectedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(lastSelectedRange);
    }
}

function updateCategoryUI() {
    const catId = document.getElementById('edit-category').value;
    const cat = state.categories.find(c => c.id === catId);
    if (document.getElementById('selected-cat-label')) {
        document.getElementById('selected-cat-label').innerText = cat ? cat.name : 'Sin categoría';
    }
}

function updatePinUI(active) {
    const btn = document.getElementById('toggle-pin');
    btn.dataset.active = active;
    btn.className = active
        ? 'h-9 w-9 inline-flex items-center justify-center rounded-md border border-primary bg-primary/20 text-primary shadow-inner'
        : 'h-9 w-9 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent text-muted-foreground';
}

function updateLockUI(active) {
    const btn = document.getElementById('toggle-lock');
    btn.dataset.active = active;
    btn.className = active
        ? 'h-9 w-9 inline-flex items-center justify-center rounded-md border border-primary bg-primary/10 text-primary'
        : 'h-9 w-9 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent text-muted-foreground';

    const icon = btn.querySelector('[data-lucide]');
    if (icon) {
        icon.setAttribute('data-lucide', active ? 'lock' : 'lock-open');
        safeCreateIcons();
    }
}

function initPopovers() {
    document.getElementById('open-colors').onclick = (e) => togglePopover(e, 'color-popover');
    document.getElementById('open-text-colors').onmousedown = (e) => { e.preventDefault(); saveSelection(); };
    document.getElementById('open-text-colors').onclick = (e) => togglePopover(e, 'text-color-popover');
    document.getElementById('open-emojis').onmousedown = (e) => { e.preventDefault(); saveSelection(); };
    document.getElementById('open-emojis').onclick = (e) => togglePopover(e, 'emoji-popover');

    const bgGrid = document.getElementById('bg-color-grid');
    NOTE_THEMES.forEach(theme => {
        const div = document.createElement('div');
        div.className = 'w-8 h-8 rounded-full cursor-pointer border hover:scale-110 transition-transform';
        div.style.backgroundColor = (state.settings.theme === 'dark') ? theme.dark : theme.light;
        div.onclick = () => {
            const content = document.querySelector('#editor-modal .dialog-content');
            content.style.backgroundColor = (state.settings.theme === 'dark') ? theme.dark : theme.light;
            content.dataset.themeId = theme.id;
            hidePopovers();
        };
        bgGrid.appendChild(div);
    });

    const textGrid = document.getElementById('text-color-grid');
    PALETTE.forEach(color => {
        const div = document.createElement('div');
        div.className = 'w-8 h-8 rounded-full cursor-pointer border hover:scale-110 transition-transform';
        div.style.backgroundColor = color;
        div.onmousedown = (e) => e.preventDefault();
        div.onclick = () => {
            restoreSelection();
            document.execCommand('foreColor', false, color);
            hidePopovers();
        };
        textGrid.appendChild(div);
    });

    const emojiGrid = document.getElementById('emoji-grid');
    EMOJIS.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'cursor-pointer hover:bg-accent p-2 rounded text-xl text-center';
        span.innerText = emoji;
        span.onclick = () => {
            restoreSelection();
            document.execCommand('insertHTML', false, emoji);
            hidePopovers();
        };
        emojiGrid.appendChild(span);
    });

    document.getElementById('toggle-pin').onclick = function () {
        const newState = this.dataset.active !== 'true';
        updatePinUI(newState);
    };
    document.getElementById('toggle-lock').onclick = async function () {
        const isCurrentlyLocked = this.dataset.active === 'true';
        if (!isCurrentlyLocked) {
            const pass = await openPrompt('Proteger Nota', 'Establece una contraseña para esta nota (déjala vacía para cancelar):');
            if (pass) {
                const note = state.notes.find(n => n.id === state.editingNoteId);
                const hash = await Security.hashPassword(pass);
                if (note) {
                    note.passwordHash = hash;
                }
                // If it's a new note, we'll store the hash in the dataset or a temporary place
                // But for now let's assume we want to apply it to state if possible
                this.dataset.tempHash = hash;
                updateLockUI(true);
                showToast('🔑 Contraseña establecida');
            }
        } else {
            if (confirm('¿Quitar la protección de contraseña de esta nota?')) {
                const note = state.notes.find(n => n.id === state.editingNoteId);
                if (note) note.passwordHash = null;
                delete this.dataset.tempHash;
                updateLockUI(false);
                showToast('🔓 Protección quitada');
            }
        }
    };

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.editor-tool') && !e.target.closest('.popover-content') && !e.target.closest('#cat-dropdown-trigger')) {
            hidePopovers();
        }
    });

    const catTrigger = document.getElementById('cat-dropdown-trigger');
    catTrigger.onclick = (e) => {
        e.stopPropagation();
        document.getElementById('cat-dropdown-menu').classList.toggle('hidden');
    };
}

function togglePopover(e, id) {
    e.stopPropagation();
    const pop = document.getElementById(id);
    const rect = e.currentTarget.getBoundingClientRect();
    hidePopovers(id);
    pop.classList.remove('hidden');
    pop.style.top = `${rect.bottom + 8}px`;
    pop.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
}

function hidePopovers(exceptId = null) {
    ['color-popover', 'text-color-popover', 'emoji-popover', 'cat-dropdown-menu'].forEach(id => {
        const el = document.getElementById(id);
        if (id !== exceptId && el) el.classList.add('hidden');
    });
}
