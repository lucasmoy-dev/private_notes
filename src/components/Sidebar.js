import { state } from '../state.js';
import { safeCreateIcons, openPrompt, showToast } from '../ui-utils.js';
import { SecurityService as Security } from '../security.js';
import { t } from '../i18n.js';
import { KEYS } from '../constants.js';

export function renderCategories(onViewChange, categories = null) {
    const sidebar = document.getElementById('sidebar-categories');
    const mobileSidebar = document.getElementById('mobile-sidebar-categories');
    const select = document.getElementById('edit-category');
    const dropdown = document.getElementById('cat-dropdown-menu');

    // SYNC STATE
    if (categories) state.categories = categories;

    if (sidebar) sidebar.innerHTML = '';
    if (mobileSidebar) mobileSidebar.innerHTML = '';

    // Preserve election if editing
    const currentSelectValue = select ? select.value : '';

    if (select) select.innerHTML = `<option value="">${t('categories.no_category')}</option>`;
    if (dropdown) dropdown.innerHTML = `<div class="px-3 py-1.5 text-xs hover:bg-accent cursor-pointer border-b" data-id="">${t('categories.no_category')}</div>`;

    // Update "All Notes" Active State
    document.querySelectorAll('.nav-link[data-view="all"], .nav-link-mobile[data-view="all"], .nav-link-mobile-drawer[data-view="all"]').forEach(l => {
        l.classList.toggle('active', state.currentView === 'all');
    });

    const addOption = (id, name, icon) => {
        if (!dropdown) return;
        const cat = state.categories.find(c => c.id === id);
        const isLocked = cat && cat.passwordHash;

        const item = document.createElement('div');
        item.className = 'px-3 py-2 text-xs hover:bg-accent cursor-pointer flex items-center justify-between group transition-colors cat-dropdown-item';
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="${icon || 'tag'}" class="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors"></i>
                <span class="truncate">${name}</span>
            </div>
            ${isLocked ? '<i data-lucide="lock" class="w-2.5 h-2.5 text-muted-foreground/50"></i>' : ''}
        `;

        item.onclick = async (e) => {
            e.stopPropagation();
            if (isLocked && !state.unlockedCategories.has(id)) {
                const result = await openPrompt(t('common.restricted_access'), `${t('common.enter_cat_pass')} "${name}":`, true);
                if (!result) return;

                let isValid = false;
                if (typeof result === 'object' && result.biometric) {
                    isValid = true;
                } else {
                    const hash = await Security.hash(result);
                    const targetHash = cat.passwordHash === 'MASTER' ? localStorage.getItem(KEYS.MASTER_HASH) : cat.passwordHash;
                    if (hash === targetHash) {
                        isValid = true;
                    }
                }

                if (isValid) {
                    state.unlockedCategories.add(id);
                } else {
                    return showToast(t('auth.incorrect_pass'));
                }
            }

            if (select) select.value = id;
            if (window.updateEditorCategoryUI) window.updateEditorCategoryUI();
            else updateCategoryUI();

            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(item);
    };

    const updateCategoryUI = () => {
        const catId = document.getElementById('edit-category').value;
        const cat = state.categories.find(c => c.id === catId);
        const label = document.getElementById('selected-cat-label');
        if (label) label.innerText = cat ? cat.name : t('categories.no_category');

        // Also update icon if we have the reference
        const iconEl = document.getElementById('selected-cat-icon');
        if (iconEl) {
            iconEl.setAttribute('data-lucide', cat ? (cat.icon || 'tag') : 'tag');
            safeCreateIcons();
        }
    };

    if (dropdown) {
        const defaultOpt = dropdown.querySelector('[data-id=""]');
        if (defaultOpt) {
            defaultOpt.onclick = () => {
                if (select) select.value = '';
                if (window.updateEditorCategoryUI) window.updateEditorCategoryUI();
                else updateCategoryUI();
                dropdown.classList.add('hidden');
            };
        }
    }

    state.categories.forEach(cat => {
        const createNavBtn = (isMobile = false) => {
            const btn = document.createElement('button');
            btn.className = isMobile ? 'nav-link-mobile-drawer w-full group' : 'nav-link w-full group';
            btn.setAttribute('data-view', cat.id);
            if (state.currentView === cat.id) btn.classList.add('active');

            btn.onclick = async () => {
                if (isMobile) {
                    const overlay = document.getElementById('mobile-sidebar-overlay');
                    if (overlay) overlay.classList.add('hidden');
                }

                if (cat.passwordHash && !state.unlockedCategories.has(cat.id)) {
                    const result = await openPrompt(t('common.restricted_access'), `${t('common.enter_cat_pass')} "${cat.name}":`, true);
                    if (!result) return;

                    // Biometric Bypass
                    let isValid = false;
                    if (typeof result === 'object' && result.biometric) {
                        isValid = true;
                    } else {
                        const hash = await Security.hash(result);
                        const targetHash = cat.passwordHash === 'MASTER' ? localStorage.getItem(KEYS.MASTER_HASH) : cat.passwordHash;
                        if (hash === targetHash) {
                            isValid = true;
                        }
                    }

                    if (isValid) {
                        state.unlockedCategories.add(cat.id);
                    } else {
                        showToast(t('auth.incorrect_pass'));
                        return;
                    }
                }
                onViewChange(cat.id, cat.name);
            };

            btn.innerHTML = `
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-3">
                        <i data-lucide="${cat.icon || 'tag'}" class="w-4 h-4 text-foreground/70 group-hover:text-violet-500 transition-colors"></i>
                        <span class="truncate sidebar-label">${cat.name}</span>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${cat.passwordHash ? '<i data-lucide="lock" class="w-3 h-3 text-muted-foreground"></i>' : ''}
                    </div>
                </div>
            `;
            return btn;
        };

        if (sidebar) sidebar.appendChild(createNavBtn(false));
        if (mobileSidebar) mobileSidebar.appendChild(createNavBtn(true));

        if (select) {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.innerText = cat.name;
            select.appendChild(opt);
        }

        addOption(cat.id, cat.name, cat.icon);
    });

    if (select && currentSelectValue) {
        select.value = currentSelectValue;
        // Verify if the value was actually set (it might have been deleted)
        if (select.value !== currentSelectValue) select.value = '';
    }

    safeCreateIcons();
}
