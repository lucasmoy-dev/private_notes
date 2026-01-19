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
    if (select) select.innerHTML = `<option value="">${t('categories.no_category')}</option>`;
    if (dropdown) dropdown.innerHTML = `<div class="px-3 py-1.5 text-xs hover:bg-accent cursor-pointer border-b" data-id="">${t('categories.no_category')}</div>`;

    // Update "All Notes" Active State
    document.querySelectorAll('.nav-link[data-view="all"], .nav-link-mobile[data-view="all"], .nav-link-mobile-drawer[data-view="all"]').forEach(l => {
        l.classList.toggle('active', state.currentView === 'all');
    });

    const addOption = (id, name, icon) => {
        if (!dropdown) return;
        const item = document.createElement('div');
        item.className = 'px-3 py-1.5 text-xs hover:bg-accent cursor-pointer flex items-center gap-2';
        item.innerHTML = `<i data-lucide="${icon || 'tag'}" class="w-3.5 h-3.5 text-foreground/70"></i> ${name}`;
        item.onclick = () => {
            if (select) select.value = id;
            updateCategoryUI();
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(item);
    };

    const updateCategoryUI = () => {
        const catId = document.getElementById('edit-category').value;
        const cat = state.categories.find(c => c.id === catId);
        document.getElementById('selected-cat-label').innerText = cat ? cat.name : t('categories.no_category');
    };

    if (dropdown) {
        const defaultOpt = dropdown.querySelector('[data-id=""]');
        if (defaultOpt) {
            defaultOpt.onclick = () => {
                if (select) select.value = '';
                updateCategoryUI();
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

                if (cat.passwordHash) {
                    const result = await openPrompt(t('common.restricted_access'), `${t('common.enter_cat_pass')} "${cat.name}":`, true);
                    if (!result) return;

                    // Biometric Bypass
                    if (typeof result === 'object' && result.biometric) {
                        // Granted by OS Biometrics
                    } else {
                        const hash = await Security.hash(result);
                        const targetHash = cat.passwordHash === 'MASTER' ? localStorage.getItem(KEYS.MASTER_HASH) : cat.passwordHash;
                        if (hash !== targetHash) {
                            showToast(t('auth.incorrect_pass'));
                            return;
                        }
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
    safeCreateIcons();
}
