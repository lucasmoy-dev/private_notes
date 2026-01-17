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
                <div class="editor-toolbar-container mb-4 overflow-x-auto no-scrollbar">
                    <div class="flex items-center gap-1 p-1 border rounded-md bg-muted/30 w-fit shrink-0">
                        <button class="editor-tool" data-cmd="bold" title="Negrita"><i data-lucide="bold" class="w-4 h-4"></i></button>
                        <button class="editor-tool" data-cmd="italic" title="Cursiva"><i data-lucide="italic" class="w-4 h-4"></i></button>
                        <button class="editor-tool" data-cmd="underline" title="Subrayado"><i data-lucide="underline" class="w-4 h-4"></i></button>
                        <div class="w-px h-4 bg-border mx-1"></div>
                        <button class="editor-tool" data-cmd="insertUnorderedList" title="Lista"><i data-lucide="list" class="w-4 h-4"></i></button>
                        <button class="editor-tool" data-cmd="insertOrderedList" title="Lista numerada"><i data-lucide="list-ordered" class="w-4 h-4"></i></button>
                        <button id="add-checklist" class="editor-tool" title="Checklist"><i data-lucide="list-checks" class="w-4 h-4"></i></button>
                        <div class="w-px h-4 bg-border mx-1"></div>
                        <button id="add-link" class="editor-tool" title="Insertar enlace"><i data-lucide="link" class="w-4 h-4"></i></button>
                        <button id="open-text-colors" class="editor-tool" title="Color de texto"><i data-lucide="type" class="w-4 h-4"></i></button>
                        <button id="open-emojis" class="editor-tool" title="Emojis"><i data-lucide="smile" class="w-4 h-4"></i></button>
                    </div>
                </div>

                <div id="edit-content" contenteditable="true"
                    class="min-h-[200px] outline-none text-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none"
                    placeholder="Empieza a escribir..."></div>
            </div>

            <div class="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 editor-bottom-bar overflow-y-auto max-h-[30vh]">
                <div class="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <div class="flex items-center bg-muted/30 p-1 rounded-md border shrink-0">
                        <button id="open-colors" class="editor-tool" title="Color de fondo"><i data-lucide="palette" class="w-4 h-4"></i></button>
                    </div>

                    <div class="relative group" id="cat-select-wrapper">
                        <button id="cat-dropdown-trigger"
                            class="h-9 px-3 rounded-md border border-input bg-background/50 text-[10px] md:text-xs flex items-center gap-2 hover:bg-accent transition-all truncate max-w-[120px]">
                            <span id="selected-cat-label" class="truncate">Sin categoría</span>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-muted-foreground shrink-0"></i>
                        </button>
                        <div id="cat-dropdown-menu"
                            class="absolute bottom-full mb-2 left-0 w-48 bg-popover border rounded-md shadow-xl hidden z-50 py-1 overflow-hidden">
                        </div>
                    </div>
                    <button id="toggle-pin" class="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-all shrink-0">
                        <i data-lucide="pin" class="w-4 h-4"></i>
                    </button>
                    <button id="toggle-lock" class="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-all shrink-0">
                        <i data-lucide="lock" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex gap-2 w-full sm:w-auto">
                    <button id="delete-note" class="flex-1 sm:flex-none btn-shad bg-destructive/10 text-destructive hover:bg-destructive hover:text-white h-9 px-3" title="Eliminar nota">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                    <button id="save-note" class="flex-[2] sm:flex-none btn-shad btn-shad-primary h-9">Guardar</button>
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
    contentEl.onkeyup = () => { saveSelection(); updateToolsUI(); handleAutoLinks(); };
    contentEl.onmouseup = () => { saveSelection(); updateToolsUI(); };
    contentEl.onfocus = () => { saveSelection(); updateToolsUI(); };



    document.getElementById('add-link').onclick = async () => {
        const url = await openPrompt('Insertar Enlace', 'Ingresa la URL:', false);
        if (url) {
            restoreSelection();
            document.execCommand('createLink', false, url.startsWith('http') ? url : 'https://' + url);
            // Fix links to open in new tab
            const links = contentEl.querySelectorAll('a');
            links.forEach(l => l.target = '_blank');
        }
    };

    // Tab for indentation
    contentEl.onkeydown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) document.execCommand('outdent');
            else document.execCommand('indent');
        }
    };

    // Checklist handler
    contentEl.addEventListener('click', (e) => {
        const li = e.target.closest('.checklist li');
        if (li && (e.offsetX < 30)) { // If clicked near the custom checkbox
            li.dataset.checked = li.dataset.checked === 'true' ? 'false' : 'true';
            saveSelection();
            updateToolsUI();
        }
    });

    document.getElementById('add-checklist').onclick = () => {
        restoreSelection();
        document.execCommand('insertUnorderedList');
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            let node = selection.focusNode;
            while (node && node.nodeName !== 'UL') node = node.parentNode;
            if (node) {
                node.classList.add('checklist');
                node.querySelectorAll('li').forEach(li => li.dataset.checked = 'false');
            }
        }
        updateToolsUI();
    };

    // Close on overlay click
    modal.querySelector('.dialog-overlay').onclick = closeEditor;
}



function handleAutoLinks() {
    // Simple auto-linker on space or enter
    // For performance, we don't do complex regex on every keyup, 
    // but just let the browser handle it or use a simpler marker.
}

function updateToolsUI() {
    document.querySelectorAll('.editor-tool[data-cmd]').forEach(btn => {
        const cmd = btn.dataset.cmd;
        try {
            const active = document.queryCommandState(cmd);
            btn.classList.toggle('active', active);
        } catch (e) { }
    });
}

export function openEditor(note = null) {
    const modal = document.getElementById('editor-modal');
    const titleEl = document.getElementById('edit-title');
    const contentEl = document.getElementById('edit-content');
    const catSelect = document.getElementById('edit-category');
    const dialogContent = modal.querySelector('.dialog-content');

    state.editingNoteId = note ? note.id : null;
    titleEl.value = note?.title || '';
    contentEl.innerHTML = (note?.content === undefined || note?.content === 'undefined') ? '' : (note?.content || '');

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
    if (state.editingNoteId) {
        state.unlockedNotes.delete(state.editingNoteId);
    }
    document.getElementById('editor-modal').classList.add('hidden');
    document.getElementById('toggle-lock').dataset.tempHash = '';
    state.editingNoteId = null;
    if (window.refreshUI) window.refreshUI();
}

async function saveActiveNote() {
    let title = document.getElementById('edit-title').value.trim();
    const content = document.getElementById('edit-content').innerHTML;
    const catId = document.getElementById('edit-category').value;
    const isPinned = document.getElementById('toggle-pin').dataset.active === 'true';
    const hasLock = document.getElementById('toggle-lock').dataset.active === 'true';
    const themeId = document.querySelector('#editor-modal .dialog-content').dataset.themeId;

    if (!title) {
        const now = new Date();
        title = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ', ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');
    }

    if (content === undefined || content === 'undefined' || content.trim() === '') {
        return showToast('La nota está vacía');
    }

    const noteIndex = state.notes.findIndex(n => n.id === state.editingNoteId);
    const tempHash = document.getElementById('toggle-lock').dataset.tempHash;

    const noteData = {
        id: state.editingNoteId || Date.now().toString(),
        title: title,
        content: content,
        categoryId: catId || null,
        pinned: isPinned,
        themeId: themeId || 'default',
        passwordHash: hasLock ? (tempHash || (noteIndex >= 0 ? state.notes[noteIndex].passwordHash : null)) : null,
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
    btn.classList.toggle('active', active);
}

function updateLockUI(active) {
    const btn = document.getElementById('toggle-lock');
    btn.dataset.active = active;
    btn.classList.toggle('active', active);

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
