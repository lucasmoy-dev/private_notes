import { state, saveLocal } from '../state.js';
import { NOTE_THEMES, PALETTE, EMOJIS } from '../constants.js';
import { isColorDark, safeCreateIcons, showToast, openPrompt } from '../ui-utils.js';
import { SecurityService as Security } from '../security.js';
import { EditorUI } from './EditorUI.js';

let lastSelectedRange = null;
let initialNoteState = null;

export function getEditorTemplate() {
    return `
    <div id="editor-modal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-background/80 backdrop-blur-sm dialog-overlay"></div>
        <div class="dialog-content max-w-2xl h-[85vh] flex flex-col p-0 rounded-2xl shadow-2xl transition-all duration-300">
            <div class="flex items-center gap-4 px-6 pt-6 pb-2 border-b border-border/10 shrink-0">
                <input type="text" id="edit-title" placeholder="Título de la nota"
                    class="bg-transparent text-xl font-black outline-none border-none placeholder:text-muted-foreground flex-1 min-w-0 truncate">
                
                <div class="flex items-center gap-1 shrink-0">
                    <button id="expand-editor" class="editor-tool" title="Expandir/Contraer">
                        <i data-lucide="maximize-2"></i>
                    </button>
                    <div class="relative">
                        <button id="node-options-btn" class="editor-tool" title="Más opciones">
                            <i data-lucide="more-vertical"></i>
                        </button>
                        <div id="note-options-menu" class="hidden absolute right-0 top-full mt-2 bg-popover border shadow-2xl rounded-2xl p-2 z-[125] min-w-[220px] animate-in zoom-in-95 duration-200">
                             <div class="px-2 py-1.5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">Acciones</div>
                             <button id="opt-copy-all" class="editor-menu-item group" style="--item-index: 0">
                                 <i data-lucide="copy"></i> Copiar contenido
                             </button>
                             <button id="opt-download" class="editor-menu-item group" style="--item-index: 1">
                                 <i data-lucide="download"></i> Descargar nota
                             </button>
                             <button id="opt-move-top" class="editor-menu-item group" style="--item-index: 2">
                                 <i data-lucide="arrow-up-to-line"></i> Traer al frente
                             </button>
                             <div class="h-px bg-border my-2 mx-1 opacity-50"></div>
                             <div class="px-2 py-1.5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">Estado</div>
                             <button id="opt-toggle-pin" class="editor-menu-item group" style="--item-index: 3">
                                 <i data-lucide="pin" id="opt-pin-icon"></i> <span id="opt-pin-label">Fijar nota</span>
                             </button>
                             <button id="opt-toggle-lock" class="editor-menu-item group" style="--item-index: 4">
                                 <i data-lucide="lock" id="opt-lock-icon"></i> <span id="opt-lock-label">Restringir</span>
                             </button>
                        </div>
                    </div>
                    <button id="close-editor" class="editor-tool !text-muted-foreground hover:!text-foreground" title="Cerrar">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            </div>

            <div class="flex-1 py-8 overflow-y-auto px-8 relative custom-scrollbar">
                <div id="edit-content" contenteditable="true"
                    class="min-h-[400px] outline-none text-[15px] leading-relaxed prose prose-slate dark:prose-invert max-w-none font-medium"
                    placeholder="Escribe algo increíble..."></div>
            </div>

            <div class="bg-background flex flex-col divide-y divide-border/40">
                <div class="px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
                    <div class="flex items-center gap-1 shrink-0">
                        <button data-cmd="bold" class="editor-tool" title="Negrita"><i data-lucide="bold"></i></button>
                        <button data-cmd="italic" class="editor-tool" title="Cursiva"><i data-lucide="italic"></i></button>
                        <button data-cmd="underline" class="editor-tool" title="Subrayado"><i data-lucide="underline"></i></button>
                        <div class="w-px h-4 bg-border/50 mx-1"></div>
                        <button id="checklist-btn" class="editor-tool" title="Lista de tareas"><i data-lucide="check-square"></i></button>
                        <button data-cmd="insertUnorderedList" class="editor-tool" title="Lista"><i data-lucide="list"></i></button>
                        <div class="w-px h-4 bg-border/50 mx-1"></div>
                        <button id="add-link" class="editor-tool" title="Enlace"><i data-lucide="link"></i></button>
                        <button id="open-text-colors" class="editor-tool relative" title="Color de texto">
                            <i data-lucide="type"></i>
                            <div class="w-2 h-[2px] bg-indigo-500 rounded-full absolute bottom-1.5 left-1/2 -translate-x-1/2"></div>
                        </button>
                        <button id="open-emojis" class="editor-tool" title="Emojis"><i data-lucide="smile"></i></button>
                        <button id="open-colors" class="editor-tool" title="Fondo"><i data-lucide="palette"></i></button>
                    </div>
                    
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button id="opt-delete-note" class="editor-tool !text-destructive hover:!bg-destructive/10" title="Eliminar"><i data-lucide="trash-2"></i></button>
                        <div class="w-px h-4 bg-border/50 mx-1"></div>
                        <button id="quick-save-note" class="editor-tool !bg-indigo-600 !text-white hover:!bg-indigo-700 shadow-sm" title="Guardar"><i data-lucide="save"></i></button>
                        <button id="done-note" class="editor-tool !bg-emerald-600 !text-white hover:!bg-emerald-700 shadow-sm" title="Guardar y cerrar"><i data-lucide="check"></i></button>
                    </div>
                </div>

                <div class="py-2.5 px-4 flex items-center justify-between gap-4 bg-muted/20">
                    <div id="cat-select-wrapper">
                        <button id="cat-dropdown-trigger" class="cat-badge">
                            <i data-lucide="tag" id="selected-cat-icon" class="w-3.5 h-3.5"></i>
                            <span id="selected-cat-label" class="truncate">Sin categoría</span>
                            <i data-lucide="chevron-up" class="w-3 h-3 opacity-40"></i>
                        </button>
                        <select id="edit-category" class="hidden">
                            <option value="">Sin categoría</option>
                        </select>
                    </div>
                    <div class="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter" id="last-saved-time">Guardado hace un momento</div>
                </div>
            </div>
        </div>

        <!-- External Popovers (Outside Modal for Viewport-Relative Positioning) -->
        <div id="color-popover" class="fixed z-[350] hidden popover-content p-4 w-72">
            <div class="px-2 py-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-2">Color de fondo</div>
            <div id="bg-color-grid" class="grid grid-cols-5 gap-3"></div>
        </div>

        <div id="text-color-popover" class="fixed z-[350] hidden popover-content p-4 w-72">
            <div class="px-2 py-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-2">Color de texto</div>
            <div id="text-color-grid" class="grid grid-cols-6 gap-3"></div>
        </div>

        <div id="emoji-popover" class="fixed z-[350] hidden popover-content w-80 h-80 p-2 bg-popover border shadow-2xl overflow-y-auto custom-scrollbar">
            <div id="emoji-grid" class="grid grid-cols-8 gap-1"></div>
        </div>

        <div id="cat-dropdown-menu"
                class="fixed w-64 bg-popover border border-border/50 shadow-2xl hidden z-[350] py-2 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 popover-content">
            <div class="px-4 py-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] mb-1">Categorías</div>
            <div id="cat-options-container" class="max-h-72 overflow-y-auto custom-scrollbar px-2"></div>
        </div>
    </div>`;
}

export function initEditor(onSave) {
    const modal = document.getElementById('editor-modal');
    const contentEl = document.getElementById('edit-content');

    // Core Button Listeners
    // Core Button Listeners
    document.getElementById('close-editor').onclick = () => saveActiveNote();

    // Close on overlay click
    const overlay = modal.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.onclick = () => saveActiveNote();
    }

    document.getElementById('quick-save-note').onclick = async (e) => {
        const btn = e.currentTarget;
        const icon = btn.querySelector('i');

        // Visual feedback
        btn.classList.add('scale-110', 'ring-4', 'ring-indigo-500/20');
        icon.classList.add('animate-spin');

        await saveActiveNote(false);
        onSave();
        showToast('✓ Nota guardada');

        setTimeout(() => {
            btn.classList.remove('scale-110', 'ring-4', 'ring-indigo-500/20');
            icon.classList.remove('animate-spin');
        }, 500);
    };

    document.getElementById('done-note').onclick = async () => {
        await saveActiveNote(false);
        onSave();
        window.triggerAutoSync?.();
        closeEditor();
    };

    // Selection & Formatting Listeners
    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const content = document.getElementById('edit-content');
            if (content && content.contains(range.commonAncestorContainer)) {
                lastSelectedRange = range;
                updateToolsUI();
            }
        }
    });

    if (contentEl) {
        contentEl.addEventListener('keyup', updateToolsUI);
        contentEl.addEventListener('mouseup', updateToolsUI);
        contentEl.addEventListener('paste', () => setTimeout(updateToolsUI, 10));
    }

    // Delete Logic
    document.getElementById('opt-delete-note').onclick = async () => {
        if (state.editingNoteId && confirm('¿Deseas eliminar esta nota?')) {
            const index = state.notes.findIndex(n => n.id === state.editingNoteId);
            if (index >= 0) {
                state.notes[index].deleted = true;
                state.notes[index].updatedAt = Date.now();
                await saveLocal();
                closeEditor();
                onSave();
                window.triggerAutoSync?.();
            }
        }
    };

    // Expand Logic
    const expandBtn = document.getElementById('expand-editor');
    if (expandBtn) {
        expandBtn.onclick = () => {
            const dialog = modal.querySelector('.dialog-content');
            const isFullscreen = dialog.classList.toggle('fullscreen');
            const icon = expandBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isFullscreen ? 'minimize-2' : 'maximize-2');
                safeCreateIcons();
            }
        };
    }

    // Extra Options Menu Toggle
    const optionsBtn = document.getElementById('node-options-btn');
    const optionsMenu = document.getElementById('note-options-menu');
    if (optionsBtn && optionsMenu) {
        optionsBtn.onclick = (e) => {
            e.stopPropagation();
            optionsMenu.classList.toggle('hidden');
        };
    }

    // Command Buttons (Formatting)
    document.querySelectorAll('[data-cmd]').forEach(btn => {
        btn.onmousedown = (e) => e.preventDefault(); // Keep focus
        btn.onclick = () => {
            document.execCommand(btn.dataset.cmd, false, null);
            updateToolsUI();
        };
    });

    // Content Editable Input Event
    contentEl.oninput = () => {
        // Auto-save logic could go here, but we use manual save
    };

    // Copy Content
    document.getElementById('opt-copy-all').onclick = () => {
        const text = contentEl.innerText;
        navigator.clipboard.writeText(text);
        showToast('✓ Contenido copiado');
        optionsMenu.classList.add('hidden');
    };

    // Download Note
    document.getElementById('opt-download').onclick = () => {
        const title = document.getElementById('edit-title').value || 'Sin título';
        const text = contentEl.innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        optionsMenu.classList.add('hidden');
    };

    // Move to Top
    document.getElementById('opt-move-top').onclick = async () => {
        const index = state.notes.findIndex(n => n.id === state.editingNoteId);
        if (index > 0) {
            const note = state.notes.splice(index, 1)[0];
            state.notes.unshift(note);
            note.updatedAt = Date.now();
            await saveLocal();
            onSave();
            window.triggerAutoSync?.();
            showToast('✓ Nota movida al principio');
            optionsMenu.classList.add('hidden');
        } else if (index === 0) {
            showToast('La nota ya está al principio');
            optionsMenu.classList.add('hidden');
        } else {
            // New note, it will be unshifted on save anyway
            showToast('✓ Se guardará al principio');
            optionsMenu.classList.add('hidden');
        }
    };

    // Pin Toggle
    document.getElementById('opt-toggle-pin').onclick = async () => {
        const note = state.notes.find(n => n.id === state.editingNoteId);
        if (note) {
            note.pinned = !note.pinned;
            note.updatedAt = Date.now();
            EditorUI.updatePinUI(note.pinned);
            await saveLocal();
            onSave(); // Refresh background grid
            window.triggerAutoSync?.();
        }
    };

    // Lock Toggle
    document.getElementById('opt-toggle-lock').onclick = async () => {
        const note = state.notes.find(n => n.id === state.editingNoteId);
        if (!note) return;

        if (note.passwordHash) {
            if (confirm('¿Quitar la restricción de esta nota?')) {
                note.passwordHash = null;
                note.updatedAt = Date.now();
                EditorUI.updateLockUI(false);
                await saveLocal();
                onSave(); // Refresh background grid
                window.triggerAutoSync?.();
                showToast('🔓 Restricción eliminada');
            }
        } else {
            const pass = await openPrompt('Restringir Nota', 'Establece una contraseña para esta nota:', true);
            if (pass) {
                note.passwordHash = await Security.hash(pass);
                note.updatedAt = Date.now();
                EditorUI.updateLockUI(true);
                await saveLocal();
                onSave(); // Refresh background grid
                window.triggerAutoSync?.();
                showToast('🔒 Nota restringida');
            }
        }
    };

    // Link Action
    document.getElementById('add-link').onclick = async () => {
        const url = await openPrompt('Insertar Enlace', 'URL del enlace:', false);
        if (url) {
            restoreSelection();
            const formattedUrl = url.startsWith('http') ? url : 'https://' + url;
            document.execCommand('createLink', false, formattedUrl);
            contentEl.querySelectorAll('a').forEach(l => l.target = '_blank');
        }
    };

    document.getElementById('checklist-btn').onclick = toggleChecklist;

    // Keyboard handling
    contentEl.onkeydown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand(e.shiftKey ? 'outdent' : 'indent');
        }
    };

    // Global document listeners
    document.addEventListener('click', (e) => {
        // Close popovers if clicked outside
        if (!e.target.closest('.editor-tool') && !e.target.closest('.popover-content') && !e.target.closest('#cat-dropdown-trigger')) {
            EditorUI.hidePopovers();
        }

        // Close options menu if clicked outside
        if (optionsMenu && !optionsMenu.classList.contains('hidden')) {
            if (!optionsBtn.contains(e.target) && !optionsMenu.contains(e.target)) {
                optionsMenu.classList.add('hidden');
            }
        }
    });

    initPopovers();
    window.addEventListener('popstate', handlePopState);
}

function handlePopState() {
    const modal = document.getElementById('editor-modal');
    if (modal && !modal.classList.contains('hidden')) {
        saveActiveNote();
    }
}

export async function openEditor(note = null) {
    const modal = document.getElementById('editor-modal');
    const titleEl = document.getElementById('edit-title');
    const contentEl = document.getElementById('edit-content');
    const categoryEl = document.getElementById('edit-category');

    state.editingNoteId = note ? note.id : 'note_' + Date.now();
    initialNoteState = note ? JSON.stringify(note) : null;

    titleEl.value = note ? note.title : '';
    contentEl.innerHTML = note ? note.content : '';

    // Default to current category for new notes
    if (note) {
        categoryEl.value = note.categoryId || '';
    } else {
        categoryEl.value = (state.currentView && state.currentView !== 'all') ? state.currentView : '';
    }

    EditorUI.updateCategoryUI();
    EditorUI.renderCategoryOptions(async (catId) => {
        const liveNote = state.notes.find(n => n.id === state.editingNoteId);
        if (liveNote) {
            liveNote.categoryId = catId;
            liveNote.updatedAt = Date.now();
            await saveLocal();
            EditorUI.updateCategoryUI();
            onSave(); // Refresh background grid
            window.triggerAutoSync?.();
        }
    });

    if (note) {
        EditorUI.updatePinUI(note.pinned || false);
        EditorUI.updateLockUI(!!note.passwordHash);
    } else {
        EditorUI.updatePinUI(false);
        EditorUI.updateLockUI(false);
    }

    // Set initial theme
    const currentTheme = note ? (NOTE_THEMES.find(t => t.id === note.themeId) || NOTE_THEMES[0]) : NOTE_THEMES[0];
    const isDark = isColorDark(state.settings.theme === 'dark' ? currentTheme.dark : currentTheme.light);
    EditorUI.applyTheme(currentTheme, isDark, modal.querySelector('.dialog-content'), titleEl, contentEl, modal);

    const dialog = modal.querySelector('.dialog-content');

    // Auto-expand on small screens (<= 1200px)
    if (window.innerWidth <= 1200) {
        dialog.classList.add('fullscreen');
        const icon = document.getElementById('expand-editor')?.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', 'minimize-2');
    } else {
        dialog.classList.remove('fullscreen');
        const icon = document.getElementById('expand-editor')?.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', 'maximize-2');
    }

    modal.classList.remove('hidden');
    document.body.classList.add('ov-hidden');

    // Add history state to allow back button to close editor
    window.history.pushState({ editor: true }, '');

    updateToolsUI();
    safeCreateIcons();
}

export async function saveActiveNote(close = true) {
    const title = document.getElementById('edit-title').value.trim();
    const content = document.getElementById('edit-content').innerHTML;
    const categoryId = document.getElementById('edit-category').value;

    if (!title && !content) {
        if (close) closeEditor();
        return;
    }

    const noteIndex = state.notes.findIndex(n => n.id === state.editingNoteId);
    let note;

    if (noteIndex >= 0) {
        note = state.notes[noteIndex];
        note.title = title || 'Sin título';
        note.content = content;
        note.categoryId = categoryId;
        note.updatedAt = Date.now();
        note.themeId = document.querySelector('.dialog-content').dataset.themeId || 'default';
    } else {
        note = {
            id: state.editingNoteId,
            title: title || 'Sin título',
            content: content,
            categoryId: categoryId,
            themeId: document.querySelector('.dialog-content').dataset.themeId || 'default',
            pinned: false,
            passwordHash: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            deleted: false
        };
        state.notes.unshift(note);
    }

    await saveLocal();
    window.triggerAutoSync?.();
    if (close) closeEditor();
}

function closeEditor() {
    const modal = document.getElementById('editor-modal');
    const dialog = modal.querySelector('.dialog-content');

    // Smooth close animation
    dialog.classList.add('dialog-hide');

    setTimeout(() => {
        modal.classList.add('hidden');
        dialog.classList.remove('dialog-hide');
        document.body.classList.remove('ov-hidden');
        state.editingNoteId = null;

        if (window.history.state && window.history.state.editor) {
            window.history.back();
        }
    }, 50);
}

function updateToolsUI() {
    document.querySelectorAll('[data-cmd]').forEach(btn => {
        const cmd = btn.dataset.cmd;
        const active = document.queryCommandState(cmd);
        btn.classList.toggle('active', active);
    });
}

function restoreSelection() {
    if (lastSelectedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(lastSelectedRange);
    }
}

// Listeners relocated to initEditor

function toggleChecklist() {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;

    const li = container.closest('li');
    if (li && li.parentElement.classList.contains('checklist')) {
        // Toggle off
        const ul = li.parentElement;
        ul.classList.remove('checklist');
        ul.querySelectorAll('li').forEach(item => item.removeAttribute('data-checked'));
    } else {
        // Toggle on
        document.execCommand('insertUnorderedList');
        const ul = window.getSelection().anchorNode.parentElement.closest('ul');
        if (ul) {
            ul.classList.add('checklist');
            ul.querySelectorAll('li').forEach(item => {
                if (!item.hasAttribute('data-checked')) item.setAttribute('data-checked', 'false');
                item.onclick = (e) => {
                    if (e.target === item) {
                        const isChecked = item.getAttribute('data-checked') === 'true';
                        item.setAttribute('data-checked', !isChecked);
                        saveActiveNote(false);
                    }
                };
            });
        }
    }
    updateToolsUI();
}

function initPopovers() {
    const binds = [
        { id: 'open-colors', pop: 'color-popover' },
        { id: 'open-text-colors', pop: 'text-color-popover' },
        { id: 'open-emojis', pop: 'emoji-popover' },
        { id: 'cat-dropdown-trigger', pop: 'cat-dropdown-menu' }
    ];

    binds.forEach(b => {
        const el = document.getElementById(b.id);
        if (el) el.onclick = (e) => EditorUI.togglePopover(e, b.pop);
    });

    // Populate BG Colors
    const bgGrid = document.getElementById('bg-color-grid');
    if (bgGrid) {
        bgGrid.innerHTML = '';
        NOTE_THEMES.forEach(t => {
            const div = document.createElement('div');
            div.className = 'w-10 h-10 rounded-full cursor-pointer border-2 border-transparent hover:border-primary transition-all shadow-sm';
            div.style.backgroundColor = state.settings.theme === 'dark' ? t.dark : t.light;
            div.onclick = () => {
                const content = document.querySelector('.dialog-content');
                const isDark = isColorDark(state.settings.theme === 'dark' ? t.dark : t.light);
                EditorUI.applyTheme(t, isDark, content, document.getElementById('edit-title'), document.getElementById('edit-content'), document.getElementById('editor-modal'));
                EditorUI.hidePopovers();
            };
            bgGrid.appendChild(div);
        });
    }

    // Populate Text Colors
    const textGrid = document.getElementById('text-color-grid');
    if (textGrid) {
        textGrid.innerHTML = '';
        PALETTE.forEach(c => {
            const div = document.createElement('div');
            div.className = 'w-8 h-8 rounded-full cursor-pointer border border-border/50 hover:scale-110 transition-all';
            div.style.backgroundColor = c;
            div.onmousedown = (e) => e.preventDefault();
            div.onclick = () => {
                restoreSelection();
                document.execCommand('foreColor', false, c);
                EditorUI.hidePopovers();
            };
            textGrid.appendChild(div);
        });
    }

    // Emojis
    const emojiGrid = document.getElementById('emoji-grid');
    if (emojiGrid) {
        emojiGrid.innerHTML = '';
        EMOJIS.forEach(e => {
            const span = document.createElement('span');
            span.className = 'cursor-pointer hover:bg-primary/10 p-2 rounded-xl text-xl text-center transition-all hover:scale-125 inline-flex items-center justify-center';
            span.innerText = e;
            span.onclick = () => {
                restoreSelection();
                document.execCommand('insertHTML', false, e);
                EditorUI.hidePopovers();
            };
            emojiGrid.appendChild(span);
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.editor-tool') && !e.target.closest('.popover-content')) {
            EditorUI.hidePopovers();
        }
    });
}
