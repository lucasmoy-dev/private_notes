
import { state } from '../state.js';
import { safeCreateIcons } from '../ui-utils.js';

export class EditorUI {
    static updateCategoryUI() {
        const catId = document.getElementById('edit-category').value;
        const cat = state.categories.find(c => c.id === catId);
        const labelEl = document.getElementById('selected-cat-label');
        const iconEl = document.getElementById('selected-cat-icon');

        if (labelEl) labelEl.innerText = cat ? cat.name : 'Sin categoría';
        if (iconEl) {
            iconEl.setAttribute('data-lucide', cat ? (cat.icon || 'tag') : 'tag');
            iconEl.setAttribute('class', cat ? 'w-3.5 h-3.5 text-primary' : 'w-3.5 h-3.5 text-muted-foreground/60');
            safeCreateIcons();
        }
    }

    static renderCategoryOptions(onSelect) {
        const container = document.getElementById('cat-options-container');
        if (!container) return;
        container.innerHTML = '';

        const addOption = (id, name, icon, index = 0) => {
            const currentCatId = document.getElementById('edit-category').value;
            const div = document.createElement('div');
            div.className = 'editor-menu-item group flex items-center justify-between';
            div.style.setProperty('--item-index', index);
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <i data-lucide="${icon || 'tag'}" class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"></i>
                    <span class="truncate">${name}</span>
                </div>
                ${currentCatId === id ? '<i data-lucide="check" class="w-4 h-4 text-primary"></i>' : ''}
            `;
            div.onclick = (e) => {
                e.stopPropagation();
                document.getElementById('edit-category').value = id;
                this.updateCategoryUI();
                this.hidePopovers();
                if (onSelect) onSelect(id);
            };
            container.appendChild(div);
        };

        addOption('', 'Sin categoría', 'tag');
        state.categories.forEach((c, index) => addOption(c.id, c.name, c.icon, index + 1));
        safeCreateIcons();
    }

    static renderCategoryOption(id, name, icon, index) {
        // This is a helper for clarity, but the original code had it mixed.
        // I'll just update the loop directly in renderCategoryOptions.
    }

    static updatePinUI(active) {
        const btn = document.getElementById('opt-toggle-pin');
        if (!btn) return;
        btn.dataset.active = active.toString();

        const label = document.getElementById('opt-pin-label');
        const icon = document.getElementById('opt-pin-icon');

        if (label) label.innerText = active ? 'Desfijar nota' : 'Fijar nota';
        if (icon) icon.setAttribute('class', active ? 'w-4 h-4 text-violet-600' : 'w-4 h-4 text-muted-foreground');

        btn.classList.toggle('menu-active-violet', active);
    }

    static updateLockUI(active) {
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

    static togglePopover(e, id) {
        e.stopPropagation();
        const pop = document.getElementById(id);
        if (!pop) return;

        const isVisible = !pop.classList.contains('hidden') && pop.getAttribute('data-state') === 'open';

        // Close all first
        this.hidePopovers();

        if (isVisible) {
            // It was already open and we want to close it, which hidePopovers just did
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();

        // Prepare for measurement
        pop.classList.remove('hidden');
        pop.style.display = 'block';
        pop.style.visibility = 'hidden';

        const popWidth = pop.offsetWidth || 250;
        const popHeight = pop.offsetHeight || 300;

        pop.style.visibility = 'visible';
        pop.setAttribute('data-state', 'open');

        const spaceBelow = window.innerHeight - rect.bottom;
        const offset = 8;

        // Default to OPEN UPWARDS for bottom toolbar items, unless there's no space on top
        const spaceAbove = rect.top;

        if (spaceAbove > popHeight + 20) {
            pop.style.top = 'auto';
            pop.style.bottom = `${window.innerHeight - rect.top + offset}px`;
            pop.classList.remove('slide-in-from-top-2');
            pop.classList.add('slide-in-from-bottom-2');
        } else {
            // If not enough space on top, try bottom
            pop.style.top = `${rect.bottom + offset}px`;
            pop.style.bottom = 'auto';
            pop.classList.remove('slide-in-from-bottom-2');
            pop.classList.add('slide-in-from-top-2');
        }

        // Horizontal alignment
        let left = rect.left + (rect.width / 2) - (popWidth / 2);

        if (left < 15) left = 15;
        if (left + popWidth > window.innerWidth - 15) {
            left = window.innerWidth - popWidth - 15;
        }

        pop.style.left = `${left}px`;
        pop.style.right = 'auto';
    }

    static hidePopovers() {
        ['color-popover', 'text-color-popover', 'emoji-popover', 'cat-dropdown-menu'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('data-state', 'closed');
                el.classList.add('hidden');
                el.style.display = 'none';
            }
        });
    }

    static applyTheme(theme, isDark, dialogContent, titleEl, contentEl, modal) {
        const bgColor = (state.settings.theme === 'dark') ? theme.dark : theme.light;
        const isContentDark = (theme.id === 'default') ? (state.settings.theme === 'dark') : isDark;

        dialogContent.style.backgroundColor = bgColor;
        dialogContent.style.color = isContentDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
        dialogContent.dataset.themeId = theme.id;

        titleEl.style.color = isContentDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
        contentEl.style.color = isContentDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';

        const tools = modal.querySelectorAll('.editor-tool:not(.active), #cat-dropdown-trigger');
        tools.forEach(tool => {
            tool.style.color = isContentDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
            tool.style.borderColor = isContentDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            tool.style.backgroundColor = isContentDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        });

        // Reset active tools inline styles
        modal.querySelectorAll('.editor-tool.active').forEach(tool => {
            tool.style.backgroundColor = '';
            tool.style.color = '';
            tool.style.borderColor = '';
        });
    }
}
