import { state, saveLocal } from '../state.js';
import { NOTE_THEMES, PALETTE, EMOJIS } from '../constants.js';
import { isColorDark, safeCreateIcons, showToast, openPrompt } from '../ui-utils.js';
import { SecurityService as Security } from '../security.js';

let lastSelectedRange = null;
let initialNoteState = null; // To track changes

export function getEditorTemplate() {
    return `
    <div id="editor-modal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-background/80 backdrop-blur-sm dialog-overlay"></div>
        <div class="dialog-content max-w-2xl h-[80vh] flex flex-col p-0">
            <div class="flex items-center gap-2 border-b pb-3 px-4 pt-4">
                <button id="close-editor" class="text-muted-foreground hover:text-foreground p-2 -ml-2" title="Volver">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>
                <input type="text" id="edit-title" placeholder="Título de la nota"
                    class="bg-transparent text-xl font-bold outline-none border-none placeholder:text-muted-foreground w-full">
                
                <div class="flex items-center gap-1">
                    <button id="note-expand-btn" class="editor-tool hidden md:inline-flex" title="Expandir">
                        <i data-lucide="maximize-2" class="w-5 h-5"></i>
                    </button>
                    <div class="relative">
                        <button id="note-options-btn" class="editor-tool" title="Más opciones">
                            <i data-lucide="more-vertical" class="w-5 h-5"></i>
                        </button>
                        <div id="note-options-menu" class="hidden absolute right-0 top-full mt-1 bg-popover border shadow-2xl rounded-xl p-1 z-[120] min-w-[170px]">
                            <button id="opt-copy-all" class="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent rounded-md transition-colors">
                                <i data-lucide="copy" class="w-4 h-4 text-muted-foreground"></i> Copiar todo
                            </button>
                            <button id="opt-download" class="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent rounded-md transition-colors border-b pb-2.5 mb-1.5">
                                <i data-lucide="download" class="w-4 h-4 text-muted-foreground"></i> Descargar .txt
                            </button>
                            <button id="opt-toggle-pin" class="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent rounded-md transition-colors">
                                <i data-lucide="pin" class="w-4 h-4 text-muted-foreground" id="opt-pin-icon"></i> <span id="opt-pin-label">Fijar nota</span>
                            </button>
                            <button id="opt-toggle-lock" class="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent rounded-md transition-colors border-b pb-2.5 mb-1.5">
                                <i data-lucide="lock" class="w-4 h-4 text-muted-foreground" id="opt-lock-icon"></i> <span id="opt-lock-label">Restringir</span>
                            </button>
                             <button id="opt-delete-note" class="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-destructive/5 text-destructive rounded-md transition-colors font-medium">
                                <i data-lucide="trash-2" class="w-4 h-4"></i> Eliminar nota
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Toolbar (Unified top) -->
            <div class="px-4 border-b py-2 flex items-center bg-muted/20">
                <div class="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                    <button data-cmd="bold" class="editor-tool border bg-background shrink-0"><i data-lucide="bold" class="w-4 h-4"></i></button>
                    <button data-cmd="italic" class="editor-tool border bg-background shrink-0"><i data-lucide="italic" class="w-4 h-4"></i></button>
                    <button data-cmd="underline" class="editor-tool border bg-background shrink-0"><i data-lucide="underline" class="w-4 h-4"></i></button>
                    <div class="w-px h-6 bg-border mx-0.5 shrink-0"></div>
                    <button id="checklist-btn" class="editor-tool border bg-background shrink-0"><i data-lucide="check-square" class="w-4 h-4"></i></button>
                    <button id="mobile-checklist-btn" class="hidden editor-tool border bg-background shrink-0"><i data-lucide="check-square" class="w-4 h-4"></i></button>
                    <button data-cmd="insertUnorderedList" class="editor-tool border bg-background shrink-0"><i data-lucide="list" class="w-4 h-4"></i></button>
                    <button data-cmd="insertOrderedList" class="editor-tool border bg-background shrink-0"><i data-lucide="list-ordered" class="w-4 h-4"></i></button>
                    <div class="w-px h-6 bg-border mx-0.5 shrink-0"></div>
                    <button id="add-link" class="editor-tool border bg-background shrink-0"><i data-lucide="link" class="w-4 h-4"></i></button>
                    <button id="mobile-link-btn" class="hidden editor-tool border bg-background shrink-0"><i data-lucide="link" class="w-4 h-4"></i></button>
                    <button id="open-text-colors" class="editor-tool border bg-background shrink-0 relative"><i data-lucide="type" class="w-4 h-4"></i><div class="w-3 h-[2px] bg-red-500 rounded-full absolute bottom-1 right-2"></div></button>
                    <button id="mobile-text-color-btn" class="hidden editor-tool border bg-background shrink-0"><i data-lucide="type" class="w-4 h-4"></i></button>
                    <button id="open-emojis" class="editor-tool hidden md:inline-flex border bg-background shrink-0"><i data-lucide="smile" class="w-4 h-4"></i></button>
                </div>
            </div>

            <div class="flex-1 py-4 overflow-y-auto px-4 relative">
                <div id="edit-content" contenteditable="true"
                    class="min-h-[300px] outline-none text-base leading-relaxed prose prose-slate dark:prose-invert max-w-none"
                    placeholder="Empieza a escribir..."></div>
            </div>

            <div class="border-t py-2 px-4 flex items-center justify-between gap-3 editor-bottom-bar shrink-0">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <button id="open-colors" class="editor-tool border border-input bg-background/50 transition-all shrink-0" title="Color de nota">
                        <i data-lucide="palette" class="w-4 h-4"></i>
                    </button>
                    <button id="open-colors-mobile" class="hidden editor-tool border border-input bg-background/50 shrink-0"><i data-lucide="palette" class="w-4 h-4"></i></button>

                    <div class="relative flex-1 min-w-0" id="cat-select-wrapper">
                        <button id="cat-dropdown-trigger"
                            class="h-9 w-full px-2 rounded-md border border-input bg-background/50 text-xs flex items-center justify-between gap-1 hover:bg-accent transition-all">
                            <i data-lucide="tag" id="selected-cat-icon" class="w-3.5 h-3.5 text-muted-foreground/60"></i>
                            <span id="selected-cat-label" class="truncate flex-1 text-left">Sin categoría</span>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-muted-foreground shrink-0"></i>
                        </button>
                        <div id="cat-dropdown-menu"
                            class="absolute bottom-full mb-2 left-0 w-48 bg-popover border rounded-md shadow-xl hidden z-50 py-1 overflow-hidden">
                        </div>
                        <select id="edit-category" class="hidden">
                            <option value="">Sin categoría</option>
                        </select>
                    </div>
                </div>

                <button id="save-note" class="hidden md:flex btn-shad btn-shad-primary h-9 px-6 font-bold">Hecho</button>
                <button id="save-note-mobile" class="md:hidden btn-shad btn-shad-primary h-9 px-4 font-bold">OK</button>
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

    closeBtn.onclick = () => saveActiveNote();

    const handleSave = async () => {
        await saveActiveNote();
        onSave();
    };
    saveBtn.onclick = handleSave;
    const saveBtnMobile = document.getElementById('save-note-mobile');
    if (saveBtnMobile) saveBtnMobile.onclick = handleSave;

    const handleDelete = async () => {
        if (state.editingNoteId && confirm('¿Eliminar esta nota?')) {
            state.notes = state.notes.filter(n => n.id !== state.editingNoteId);
            await saveLocal();
            closeEditor();
            onSave();
        }
    };
    document.getElementById('opt-delete-note').onclick = handleDelete;

    document.querySelectorAll('.editor-tool[data-cmd]').forEach(btn => {
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



    const titleInput = document.getElementById('edit-title');
    titleInput.onfocus = () => titleInput.select();
    titleInput.onclick = () => titleInput.select();

    // Fullscreen toggler
    const expandBtn = document.getElementById('note-expand-btn');
    expandBtn.onclick = () => {
        const dialog = modal.querySelector('.dialog-content');
        dialog.classList.toggle('fullscreen');
        const isFull = dialog.classList.contains('fullscreen');
        expandBtn.innerHTML = `<i data-lucide="${isFull ? 'minimize-2' : 'maximize-2'}" class="w-5 h-5"></i>`;
        safeCreateIcons();
    };


    // Note Toggles (Pin/Lock) - Now in Options Menu
    const togglePin = () => {
        const isActive = document.getElementById('opt-toggle-pin').dataset.active === 'true';
        updatePinUI(!isActive);
        saveActiveNote(false); // Quick save
    };
    document.getElementById('opt-toggle-pin').onclick = (e) => {
        e.stopPropagation();
        togglePin();
    };

    const toggleLock = async () => {
        const isActive = document.getElementById('opt-toggle-lock').dataset.active === 'true';
        if (!isActive) {
            const pass = await openPrompt('Restringir Nota', 'Crea una contraseña para esta nota:');
            if (pass) {
                const lockEl = document.getElementById('opt-toggle-lock');
                lockEl.dataset.tempHash = await Security.hash(pass);
                updateLockUI(true);
                saveActiveNote(false); // Quick save
            }
        } else {
            updateLockUI(false);
            state.tempEditorPassword = null;
            saveActiveNote(false); // Quick save
        }
    };
    document.getElementById('opt-toggle-lock').onclick = (e) => {
        e.stopPropagation();
        toggleLock();
    };

    const mobileChecklistBtn = document.getElementById('mobile-checklist-btn');
    if (mobileChecklistBtn) {
        mobileChecklistBtn.onclick = () => toggleChecklist();
    }

    const mobileLinkBtn = document.getElementById('mobile-link-btn');
    if (mobileLinkBtn) {
        mobileLinkBtn.onclick = () => setupLinkAction();
    }

    const mobileTextColorBtn = document.getElementById('mobile-text-color-btn');
    if (mobileTextColorBtn) {
        mobileTextColorBtn.onclick = (e) => {
            restoreSelection();
            togglePopover(e, 'text-color-popover');
        };
    }

    // Options menu
    const optionsBtn = document.getElementById('note-options-btn');
    const optionsMenu = document.getElementById('note-options-menu');
    optionsBtn.onclick = (e) => {
        e.stopPropagation();
        optionsMenu.classList.toggle('hidden');
    };

    document.getElementById('opt-copy-all').onclick = () => {
        const content = document.getElementById('edit-content').innerText;
        navigator.clipboard.writeText(content).then(() => {
            showToast('✅ Contenido copiado');
            optionsMenu.classList.add('hidden');
        });
    };

    document.getElementById('opt-download').onclick = () => {
        const title = document.getElementById('edit-title').value || 'nota';
        const content = document.getElementById('edit-content').innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.txt`;
        a.click();
        optionsMenu.classList.add('hidden');
    };

    document.addEventListener('click', () => {
        if (optionsMenu) optionsMenu.classList.add('hidden');
    });

    const setupLinkAction = async () => {
        const url = await openPrompt('Insertar Enlace', 'Ingresa la URL:', false);
        if (url) {
            restoreSelection();
            document.execCommand('createLink', false, url.startsWith('http') ? url : 'https://' + url);
            // Fix links to open in new tab
            const links = contentEl.querySelectorAll('a');
            links.forEach(l => l.target = '_blank');
        }
    };

    document.getElementById('add-link').onclick = setupLinkAction;
    document.getElementById('checklist-btn').onclick = () => toggleChecklist();

    const toggleChecklist = () => {
        restoreSelection();
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const parentLi = range.commonAncestorContainer.parentElement?.closest('li');

            if (parentLi && parentLi.parentElement.classList.contains('checklist')) {
                // Already in a checklist, remove it (standard list)
                parentLi.parentElement.classList.remove('checklist');
            } else {
                document.execCommand('insertUnorderedList');
                setTimeout(() => {
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        let node = sel.focusNode;
                        while (node && node.nodeName !== 'UL' && node !== contentEl) node = node.parentNode;
                        if (node && node.nodeName === 'UL') {
                            node.classList.add('checklist');
                            node.querySelectorAll('li').forEach(li => {
                                if (!li.dataset.checked) li.dataset.checked = 'false';
                            });
                        }
                    }
                }, 10);
            }
        }
        updateToolsUI();
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
        if (li) {
            // Check if we clicked the checkbox area (left side)
            const rect = li.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            if (clickX < 35) { // Increased hit area for touch
                e.preventDefault();
                li.dataset.checked = li.dataset.checked === 'true' ? 'false' : 'true';
                // Save without closing
                saveActiveNote(false);
                updateToolsUI();
            }
        }
    });

    // Close on overlay click
    modal.querySelector('.dialog-overlay').onclick = () => {
        saveActiveNote();
    };
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

    const pinBtn = document.getElementById('opt-toggle-pin');
    if (pinBtn) updatePinUI(pinBtn.dataset.active === 'true');

    const lockBtn = document.getElementById('opt-toggle-lock');
    if (lockBtn) updateLockUI(lockBtn.dataset.active === 'true');

    const updateChecklistStatus = (btnId) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        let isChecklist = false;
        try {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let node = selection.anchorNode;
                while (node && node.id !== 'edit-content') {
                    if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
                        isChecklist = true;
                        break;
                    }
                    node = node.parentNode;
                }
            }
        } catch (e) { }
        btn.classList.toggle('active', isChecklist);
    };

    updateChecklistStatus('checklist-btn');
    updateChecklistStatus('mobile-checklist-btn');

    // Removed mobile format trigger update
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

    const tools = modal.querySelectorAll('.editor-tool:not(.active), #cat-dropdown-trigger');
    tools.forEach(tool => {
        tool.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
        tool.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        tool.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    });

    // Reset active tools inline styles to let CSS take over reliably
    modal.querySelectorAll('.editor-tool.active').forEach(tool => {
        tool.style.backgroundColor = '';
        tool.style.color = '';
        tool.style.borderColor = '';
    });

    updatePinUI(note ? note.pinned : false);
    updateLockUI(note ? !!note.passwordHash : false);
    updateCategoryUI();

    modal.classList.remove('hidden');
    contentEl.focus();

    // Store initial state for comparison
    initialNoteState = {
        title: note?.title || '',
        content: (note?.content === undefined || note?.content === 'undefined') ? '' : (note?.content || ''),
        categoryId: note ? (note.categoryId || '') : defaultCat,
        pinned: note ? note.pinned : false,
        themeId: theme.id,
        passwordHash: note ? note.passwordHash : null
    };
}

function closeEditor() {
    const modal = document.getElementById('editor-modal');
    const content = modal.querySelector('.dialog-content');

    // Add closing animation
    content.classList.add('dialog-hide');

    setTimeout(() => {
        modal.classList.add('hidden');
        content.classList.remove('dialog-hide');
        state.editingNoteId = null;
        state.tempEditorPassword = null;
        const lockOpt = document.getElementById('opt-toggle-lock');
        if (lockOpt) lockOpt.dataset.tempHash = '';

        // Clear sensitive fields in modal to avoid leaks after closing
        document.getElementById('edit-title').value = '';
        document.getElementById('edit-content').innerHTML = '';

        if (window.refreshUI) window.refreshUI();
    }, 200);
}

export async function saveActiveNote(shouldClose = true) {
    const titleEl = document.getElementById('edit-title');
    const contentEl = document.getElementById('edit-content');
    const catSelect = document.getElementById('edit-category');
    const dialogContent = document.querySelector('#editor-modal .dialog-content');

    if (!titleEl || !contentEl) return;

    let title = titleEl.value.trim();
    const content = contentEl.innerHTML;
    const catId = catSelect ? catSelect.value : '';
    const themeId = dialogContent ? dialogContent.dataset.themeId : 'default';

    // 1. Check for Empty Note (No Title & No Content)
    const isEmpty = !title && (!content || content.trim() === '' || content === '<br>');

    if (isEmpty) {
        // If it was an existing note, delete it. If new, just don't save.
        if (state.editingNoteId) {
            const existingIndex = state.notes.findIndex(n => n.id === state.editingNoteId);
            if (existingIndex >= 0) {
                state.notes.splice(existingIndex, 1);
                await saveLocal();
                if (window.refreshUI) window.refreshUI();
                if (window.triggerAutoSync) window.triggerAutoSync(); // Sync deletion
            }
        }
        if (shouldClose) closeEditor();
        return;
    }

    // 2. Default Title if missing but content exists
    if (!title) {
        const now = new Date();
        title = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ', ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
    }

    const noteIndex = state.notes.findIndex(n => n.id === state.editingNoteId);
    const pinEl = document.getElementById('opt-toggle-pin');
    const lockEl = document.getElementById('opt-toggle-lock');

    const isPinned = pinEl ? pinEl.dataset.active === 'true' : false;
    const hasLock = lockEl ? lockEl.dataset.active === 'true' : false;
    const tempHash = lockEl ? lockEl.dataset.tempHash || '' : '';
    const passwordHash = hasLock ? (tempHash || (noteIndex >= 0 ? state.notes[noteIndex].passwordHash : null)) : null;

    // 3. Check against Initial State (No Changes)
    if (initialNoteState && state.editingNoteId) {
        const isUnchanged =
            title === initialNoteState.title &&
            content === initialNoteState.content &&
            catId === initialNoteState.categoryId &&
            isPinned === initialNoteState.pinned &&
            themeId === initialNoteState.themeId &&
            passwordHash === initialNoteState.passwordHash;

        if (isUnchanged && shouldClose) {
            closeEditor();
            return; // Exit without saving/syncing
        }
    }

    const noteData = {
        id: state.editingNoteId || Date.now().toString(),
        title: title,
        content: content,
        categoryId: catId || null,
        pinned: isPinned,
        themeId: themeId || 'default',
        passwordHash: passwordHash,
        updatedAt: Date.now()
    };

    if (hasLock && !noteData.passwordHash) {
        // Fallback safety (should be handled by toggleLock)
        const pass = await openPrompt('Seguridad', 'Establece una contraseña para esta nota:');
        if (pass) noteData.passwordHash = await Security.hash(pass);
        else return;
    }

    if (noteIndex >= 0) state.notes[noteIndex] = noteData;
    else state.notes.unshift(noteData);

    if (!state.editingNoteId) state.editingNoteId = noteData.id;

    // 4. Update UI FIRST, then Sync
    await saveLocal();
    if (shouldClose) closeEditor();

    if (window.refreshUI) window.refreshUI();

    // Trigger sync in next tick to allow UI update to render
    setTimeout(() => {
        if (window.triggerAutoSync) window.triggerAutoSync();
    }, 50);
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
    if (document.getElementById('selected-cat-icon')) {
        const iconEl = document.getElementById('selected-cat-icon');
        iconEl.setAttribute('data-lucide', cat ? (cat.icon || 'tag') : 'tag');
        safeCreateIcons();
    }
}

function updatePinUI(active) {
    const btn = document.getElementById('opt-toggle-pin');
    if (!btn) return;
    btn.dataset.active = active.toString();

    const label = document.getElementById('opt-pin-label');
    const icon = document.getElementById('opt-pin-icon');

    if (label) label.innerText = active ? 'Desfijar nota' : 'Fijar nota';
    if (icon) icon.setAttribute('class', active ? 'w-4 h-4 text-violet-600' : 'w-4 h-4 text-muted-foreground');

    btn.classList.toggle('menu-active-violet', active);
}

function updateLockUI(active) {
    const btn = document.getElementById('opt-toggle-lock');
    if (!btn) return;
    btn.dataset.active = active.toString();

    const label = document.getElementById('opt-lock-label');
    const icon = document.getElementById('opt-lock-icon');

    if (label) label.innerText = active ? 'Quitar restricción' : 'Restringir';
    if (icon) {
        icon.setAttribute('data-lucide', active ? 'lock' : 'lock-open');
        icon.setAttribute('class', active ? 'w-4 h-4 text-violet-600' : 'w-4 h-4 text-muted-foreground');
    }

    btn.classList.toggle('menu-active-violet', active);
    safeCreateIcons();
}

function initPopovers() {
    document.getElementById('open-colors').onclick = (e) => togglePopover(e, 'color-popover');
    const openColorsMobile = document.getElementById('open-colors-mobile');
    if (openColorsMobile) openColorsMobile.onclick = (e) => togglePopover(e, 'color-popover');

    document.getElementById('open-text-colors').onmousedown = (e) => { e.preventDefault(); saveSelection(); };
    document.getElementById('open-text-colors').onclick = (e) => togglePopover(e, 'text-color-popover');

    const emojiTrigger = (e) => { e.preventDefault(); saveSelection(); togglePopover(e, 'emoji-popover'); };
    document.getElementById('open-emojis').onmousedown = (e) => e.preventDefault();
    document.getElementById('open-emojis').onclick = emojiTrigger;
    const mobileEmojiBtn = document.getElementById('mobile-open-emojis');
    if (mobileEmojiBtn) {
        mobileEmojiBtn.onmousedown = (e) => e.preventDefault();
        mobileEmojiBtn.onclick = emojiTrigger;
    }

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

    const popHeight = 250;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < popHeight) {
        pop.style.top = 'auto';
        pop.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    } else {
        pop.style.top = `${rect.bottom + 8}px`;
        pop.style.bottom = 'auto';
    }

    pop.style.left = `${Math.min(rect.left, window.innerWidth - pop.offsetWidth - 20)}px`;
    if (rect.left + 300 > window.innerWidth) {
        pop.style.left = 'auto';
        pop.style.right = '20px';
    }
}

function hidePopovers(exceptId = null) {
    ['color-popover', 'text-color-popover', 'emoji-popover', 'cat-dropdown-menu'].forEach(id => {
        const el = document.getElementById(id);
        if (id !== exceptId && el) el.classList.add('hidden');
    });
}
