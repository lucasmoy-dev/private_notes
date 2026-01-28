import { state, saveLocal } from '../state.js';
import { NOTE_THEMES } from '../constants.js';
import { safeCreateIcons, isColorDark, openPrompt, showToast } from '../ui-utils.js';
import { SecurityService as Security } from '../security.js';
import { t } from '../i18n.js';
import { KEYS } from '../constants.js';
import Sortable from 'sortablejs';

export function renderNotes(onEdit, animate = true) {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.classList.toggle('no-animate', !animate);

    const filtered = state.currentView === 'all'
        ? state.notes.filter(n => {
            const cat = state.categories.find(c => c.id === n.categoryId);
            return !n.deleted && (!cat || !cat.passwordHash);
        })
        : state.notes.filter(n => n.categoryId === state.currentView && !n.deleted);

    const pinnedNotes = filtered.filter(n => n.pinned);
    const otherNotes = filtered.filter(n => !n.pinned);

    const createCard = (note) => {
        const card = document.createElement('div');
        card.className = `note-card note-animate-in relative group`;
        card.dataset.id = note.id;

        const theme = NOTE_THEMES.find(t => t.id === note.themeId) || NOTE_THEMES[0];
        const bgColor = (state.settings.theme === 'dark') ? theme.dark : theme.light;

        if (note.themeId !== 'default') {
            card.style.backgroundColor = bgColor;
            card.style.borderColor = (state.settings.theme === 'dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        }

        const cat = state.categories.find(c => c.id === note.categoryId);
        const isUnlocked = state.unlockedNotes.has(note.id);
        const isDarkTheme = isColorDark(bgColor);

        card.innerHTML = `
            <div class="note-card-content flex flex-col h-full">
                <div class="flex items-start justify-between mb-2.5 gap-2">
                    <h3 class="font-bold text-[15px] line-clamp-2 leading-[1.3] flex-1">${note.title}</h3>
                    <div class="flex items-center gap-2 shrink-0 pt-1 opacity-80">
                        ${note.pinned ? '<i data-lucide="pin" class="w-3.5 h-3.5 rotate-[15deg]"></i>' : ''}
                        ${note.passwordHash ? `<i data-lucide="${isUnlocked ? 'unlock' : 'lock'}" class="w-3.5 h-3.5 ${isUnlocked ? 'text-primary' : ''}"></i>` : ''}
                    </div>
                </div>
                <div class="text-[13px] opacity-75 line-clamp-[8] leading-[1.5] mb-5 flex-1">
                    ${(note.passwordHash && !isUnlocked) ? `
                        <div class="flex flex-col items-center gap-3 py-10 opacity-30 justify-center">
                            <i data-lucide="eye-off" class="w-8 h-8"></i>
                            <span class="text-[10px] font-bold uppercase tracking-widest">${t('common.locked')}</span>
                        </div>
                    ` : note.content}
                </div>
                <div class="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-foreground/5">
                    <div class="flex-1 min-w-0">
                        ${(cat) ? `
                        <span class="inline-flex items-center gap-1.5 text-[9px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-black uppercase tracking-[0.15em] border border-primary/10">
                            <i data-lucide="${cat.icon || 'tag'}" class="w-2.5 h-2.5"></i>
                            <span class="truncate">${cat.name}</span>
                        </span>` : ''}
                    </div>
                    <button class="delete-note-btn p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-all opacity-0 group-hover:opacity-100" data-id="${note.id}" title="Eliminar">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;

        card.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-note-btn');
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();

                if (confirm('¿Deseas eliminar esta nota?')) {
                    const id = deleteBtn.dataset.id;
                    const index = state.notes.findIndex(n => n.id === id);
                    if (index >= 0) {
                        state.notes[index].deleted = true;
                        state.notes[index].updatedAt = Date.now();
                        await saveLocal();
                        renderNotes(onEdit);
                        window.triggerAutoSync?.();
                    }
                }
                return;
            }

            // If note is locked and not yet unlocked in this session
            if (note.passwordHash && !state.unlockedNotes.has(note.id)) {
                try {
                    const result = await openPrompt(t('common.security_prompt'), t('common.security_desc_prompt'), true);
                    if (!result) return;

                    let isValid = false;
                    if (typeof result === 'object' && result.biometric) {
                        isValid = true;
                    } else {
                        const hash = await Security.hash(result);
                        const targetHash = note.passwordHash === 'MASTER' ? localStorage.getItem(KEYS.MASTER_HASH) : note.passwordHash;
                        if (hash === targetHash) {
                            isValid = true;
                        }
                    }

                    if (isValid) {
                        state.unlockedNotes.add(note.id);
                        onEdit(note);
                        setTimeout(() => renderNotes(onEdit), 300);
                    } else {
                        showToast(t('auth.incorrect_pass'));
                    }
                } catch (err) {
                    console.error('Error unlocking note:', err);
                    showToast('❌ Error al desbloquear');
                }
                return;
            }

            onEdit(note);
        });
        return card;
    };

    if (pinnedNotes.length > 0) {
        const pinHeader = document.createElement('h3');
        pinHeader.className = "text-xs font-bold text-muted-foreground uppercase tracking-wider col-span-full mb-2 mt-2 flex items-center gap-2";
        pinHeader.innerHTML = '<i data-lucide="pin" class="w-3 h-3"></i> ' + t('header.pinned');
        grid.appendChild(pinHeader);
        pinnedNotes.forEach(note => grid.appendChild(createCard(note)));

        if (otherNotes.length > 0) {
            const sep = document.createElement('div');
            sep.className = "col-span-full h-px bg-border my-4";
            grid.appendChild(sep);
        }
    }

    if (otherNotes.length > 0) {
        if (pinnedNotes.length > 0) {
            const otherHeader = document.createElement('h3');
            otherHeader.className = "text-xs font-bold text-muted-foreground uppercase tracking-wider col-span-full mb-2 mt-2";
            otherHeader.innerText = t('sidebar.all_notes');
            grid.appendChild(otherHeader);
        }
        otherNotes.forEach(note => grid.appendChild(createCard(note)));
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-muted-foreground opacity-50">
            <i data-lucide="ghost" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
            <p>${t('notes.no_notes')}</p>
        </div>`;
    }

    safeCreateIcons();

    // Initialize/Refresh Drag & Drop
    initSortable(onEdit);
}

function initSortable(onEdit) {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;

    // Destroy previous if exists (Sortable stores it on the element)
    if (grid.sortable) grid.sortable.destroy();

    grid.sortable = Sortable.create(grid, {
        draggable: '.note-card',
        animation: 250,
        ghostClass: 'opacity-50',
        delay: 0, // No delay on desktop
        onEnd: async () => {
            const newOrder = [];
            grid.querySelectorAll('.note-card').forEach(el => {
                const note = state.notes.find(n => n.id === el.dataset.id);
                if (note) newOrder.push(note);
            });
            // This is a simple reorder, but we need to merge with existing notes not in view
            const visibleIds = new Set(newOrder.map(n => n.id));
            const invisibleNotes = state.notes.filter(n => !visibleIds.has(n.id));
            state.notes = [...newOrder, ...invisibleNotes];
            await saveLocal();
        }
    });
}
