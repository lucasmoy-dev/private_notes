import { state, saveLocal } from '../state.js';
import { NOTE_THEMES } from '../constants.js';
import { safeCreateIcons, isColorDark, openPrompt, showToast } from '../ui-utils.js';
import { Security } from '../auth.js';
import Sortable from 'sortablejs';

export function renderNotes(onEdit) {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = state.currentView === 'all'
        ? state.notes.filter(n => {
            const cat = state.categories.find(c => c.id === n.categoryId);
            return !cat || !cat.passwordHash;
        })
        : state.notes.filter(n => n.categoryId === state.currentView);

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

        card.innerHTML = `
            <div class="note-card-content">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="font-bold text-sm line-clamp-2 leading-tight flex-1 pr-2">${note.title}</h3>
                    <div class="flex items-center gap-2 shrink-0">
                        ${note.pinned ? '<i data-lucide="pin" class="w-3 h-3 fill-current opacity-60"></i>' : ''}
                        ${note.passwordHash ? `<i data-lucide="${isUnlocked ? 'unlock' : 'lock'}" class="w-3.5 h-3.5 lock-indicator cursor-pointer opacity-60 hover:opacity-100 transition-opacity" data-id="${note.id}"></i>` : ''}
                        <button class="delete-note-btn p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors md:opacity-0 md:group-hover:opacity-100 text-muted-foreground/50" data-id="${note.id}" title="Eliminar">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
                <div class="text-[13px] opacity-70 line-clamp-6 leading-relaxed mb-3">
                    ${(note.passwordHash && !isUnlocked) ? '<div class="flex items-center gap-2 py-4 italic opacity-50"><i data-lucide="shield-alert" class="w-4 h-4"></i> Contenido protegido</div>' : note.content}
                </div>
                ${cat ? `
                <div class="mt-auto pt-2">
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 font-medium text-muted-foreground/70 uppercase tracking-wider">${cat.name}</span>
                </div>` : ''}
            </div>
        `;

        card.onclick = async (e) => {
            if (e.target.closest('.delete-note-btn')) return;

            // If note is locked and not yet unlocked in this session
            if (note.passwordHash && !state.unlockedNotes.has(note.id)) {
                try {
                    const pass = await openPrompt('Nota Protegida', 'Ingresa la contraseña para ver esta nota:');
                    if (!pass) return;
                    const hash = await Security.hashPassword(pass);
                    if (hash !== note.passwordHash) {
                        showToast('❌ Contraseña incorrecta');
                        return;
                    }
                    state.unlockedNotes.add(note.id);
                    // Open immediately
                    onEdit(note);
                    // Refresh grid in background to show content
                    setTimeout(() => renderNotes(onEdit), 300);
                } catch (err) {
                    console.error('Error unlocking note:', err);
                    showToast('❌ Error al desbloquear');
                }
                return;
            }

            onEdit(note);
        };
        return card;
    };

    if (pinnedNotes.length > 0) {
        const pinHeader = document.createElement('h3');
        pinHeader.className = "text-xs font-bold text-muted-foreground uppercase tracking-wider col-span-full mb-2 mt-2 flex items-center gap-2";
        pinHeader.innerHTML = '<i data-lucide="pin" class="w-3 h-3"></i> Destacadas';
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
            otherHeader.innerText = "Notas";
            grid.appendChild(otherHeader);
        }
        otherNotes.forEach(note => grid.appendChild(createCard(note)));
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-muted-foreground opacity-50">
            <i data-lucide="ghost" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
            <p>No hay notas aquí</p>
        </div>`;
    }

    safeCreateIcons();

    // Attach deletion handlers
    grid.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const noteId = btn.dataset.id;
            const note = state.notes.find(n => n.id === noteId);

            if (note?.passwordHash && !state.unlockedNotes.has(note.id)) {
                const pass = await openPrompt('Eliminar Nota Protegida', 'Ingresa la contraseña para autorizar la eliminación:');
                if (!pass) return;
                const hash = await Security.hashPassword(pass);
                if (hash !== note.passwordHash) return showToast('❌ Contraseña incorrecta');
            }

            if (confirm('¿Eliminar esta nota?')) {
                state.notes = state.notes.filter(n => n.id !== noteId);
                await saveLocal();
                renderNotes(onEdit);
                if (window.triggerAutoSync) window.triggerAutoSync();
            }
        };
    });

    // Initialize/Refresh Drag & Drop
    initSortable(onEdit);
}

function initSortable(onEdit) {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;

    // Destroy previous if exists (Sortable stores it on the element)
    if (grid.sortable) grid.sortable.destroy();

    grid.sortable = Sortable.create(grid, {
        animation: 250,
        ghostClass: 'opacity-50',
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
