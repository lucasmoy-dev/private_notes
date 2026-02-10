import { SecurityService as Security } from '../security.js';
import { state, loadLocalEncrypted } from '../state.js';
import { showToast, safeCreateIcons } from '../ui-utils.js';
import { t } from '../i18n.js';
import { KEYS } from '../constants.js';

export function getAuthShieldTemplate() {
    const isAuthed = !!(sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY));
    return `
    <div id="auth-shield" class="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 ${isAuthed ? 'opacity-0 pointer-events-none' : ''}" style="${isAuthed ? 'display: none' : ''}">
        <div class="w-full max-w-[340px] p-6 space-y-5 bg-card border rounded-2xl shadow-2xl">
            <!-- Icon & Header -->
            <div class="text-center space-y-2">
                <div class="mx-auto w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <i data-lucide="shield" id="auth-main-icon" class="w-5 h-5"></i>
                </div>
                <h1 class="text-xl font-bold tracking-tight" id="auth-title">${t('auth.title')}</h1>
                <p class="text-xs text-muted-foreground px-4 leading-relaxed" id="auth-desc">${t('auth.desc')}</p>
            </div>

            <!-- STEP 1: FOLDER SELECTION -->
            <div id="auth-folder-step" class="hidden space-y-4">
                <div class="flex flex-col items-center gap-4 py-4">
                    <div id="folder-name-display" class="w-full py-3 px-4 bg-muted/30 border rounded-xl text-center font-mono text-xs text-foreground/80 break-all hidden">
                    </div>
                    <button id="auth-set-folder-btn" class="btn-shad btn-shad-outline w-full h-11 font-bold">
                        <i data-lucide="folder-search" class="w-4 h-4 mr-2"></i> ${t('auth.setup_folder_btn')}
                    </button>
                </div>
                <button id="auth-folder-next" class="btn-shad btn-shad-primary w-full h-11 font-bold shadow-lg shadow-primary/20" disabled>
                    ${t('auth.setup_next')}
                </button>
            </div>

            <!-- STEP 2: PASSWORD / LOGIN -->
            <div id="auth-pass-step" class="space-y-4">
                <div class="space-y-3">
                    <div class="relative group">
                        <input type="password" id="master-password" placeholder="${t('auth.pass_placeholder')}" class="h-11 w-full pl-4 pr-11 text-sm bg-muted/30 border-none ring-1 ring-border focus:ring-2 focus:ring-primary rounded-xl transition-all">
                        <button type="button" class="absolute right-0 top-0 h-11 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="master-password" tabindex="-1">
                            <i data-lucide="eye" class="w-3.5 h-3.5 icon-show"></i>
                        </button>
                    </div>
                    <div class="relative group hidden" id="confirm-password-wrapper">
                        <input type="password" id="confirm-password" placeholder="${t('auth.repeat_placeholder')}" class="h-11 w-full pl-4 pr-11 text-sm bg-muted/30 border-none ring-1 ring-border focus:ring-2 focus:ring-primary rounded-xl transition-all">
                        <button type="button" class="absolute right-0 top-0 h-11 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="confirm-password" tabindex="-1">
                            <i data-lucide="eye" class="w-3.5 h-3.5 icon-show"></i>
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-2 py-0.5" id="auth-remember-wrapper">
                        <input type="checkbox" id="auth-remember" class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary">
                        <label for="auth-remember" class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 cursor-pointer select-none">${t('auth.remember_me')}</label>
                    </div>

                    <button id="auth-submit" class="btn-shad btn-shad-primary w-full h-11 font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">${t('auth.unlock')}</button>
                    
                    <button id="auth-biometric" class="hidden btn-shad btn-shad-secondary w-full h-10 font-bold flex items-center justify-center gap-2 rounded-xl text-sm border-none bg-muted hover:bg-muted/80">
                        <i data-lucide="fingerprint" class="w-4 h-4"></i> <span id="bio-text" class="text-xs uppercase tracking-wide">${t('auth.use_bio')}</span>
                    </button>
                </div>
            </div>

            <!-- Maintenance Options -->
            <div class="pt-2">
                <button id="auth-options-toggle" class="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 hover:text-primary transition-all">
                    <i data-lucide="wrench" class="w-3 h-3"></i> ${t('settings.maintenance')}
                </button>
                
                <div id="auth-maintenance-menu" class="hidden space-y-2 mt-2 pt-3 border-t border-border/10">
                    <button id="auth-reset-btn" class="w-full h-9 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> ${t('settings.reset_app')}
                    </button>
                    <button id="auth-reload-btn" class="w-full h-9 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:bg-muted rounded-lg transition-all">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> ${t('sidebar.force_reload')}
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

export async function checkAuthStatus(onSuccess) {
    const isSetup = !localStorage.getItem(KEYS.MASTER_HASH);
    const savedKeySession = sessionStorage.getItem(KEYS.VAULT_KEY);
    const savedKeyLocal = localStorage.getItem(KEYS.VAULT_KEY);
    const isBioEnabled = localStorage.getItem(KEYS.BIO_ENABLED) === 'true';
    const isRemembered = localStorage.getItem(KEYS.REMEMBER_ME) === 'true';

    // Bind Step 1 events
    const setFolderBtn = document.getElementById('auth-set-folder-btn');
    if (setFolderBtn) {
        setFolderBtn.onclick = async () => {
            const { FileStorage } = await import('../file-storage.js');
            const { openPrompt, showToast, isCapacitor } = await import('../ui-utils.js');

            try {
                if (isCapacitor()) {
                    const newName = await openPrompt(t('auth.setup_folder_title'), 'Documents/[Nombre]', false);
                    if (newName && newName.trim()) {
                        await FileStorage.connectFolder(newName.trim());
                    } else if (newName === null) {
                        return; // Cancelled
                    } else {
                        await FileStorage.connectFolder(); // Default
                    }
                } else {
                    await FileStorage.connectFolder();
                }

                showToast('✅ Folder connected');
                const status = await FileStorage.getHandleStatus();
                const display = document.getElementById('folder-name-display');
                if (display) {
                    display.innerText = (isCapacitor() ? `Documents/${status.folder}` : 'Folder: Connected');
                    display.classList.remove('hidden');
                }
                const nextBtn = document.getElementById('auth-folder-next');
                if (nextBtn) {
                    nextBtn.disabled = false;
                    nextBtn.onclick = () => showSetupPass(onSuccess);
                }
                setFolderBtn.innerHTML = `<i data-lucide="folder-check" class="w-4 h-4 mr-2"></i> ${t('auth.setup_folder_change')}`;
                safeCreateIcons();
            } catch (e) {
                showToast('❌ Error: ' + e.message);
            }
        };
    }

    // Show bio button if supported
    const bioBtn = document.getElementById('auth-biometric');
    if (window.PublicKeyCredential && bioBtn) {
        bioBtn.classList.remove('hidden');
        if (isBioEnabled) {
            document.getElementById('bio-text').innerText = t('auth.bio_unlock');
        } else {
            document.getElementById('bio-text').innerText = t('auth.bio_setup');
        }
    }

    if (isSetup) {
        showSetupFolder();
    } else if (savedKeySession) {
        finishLogin(savedKeySession, onSuccess);
    } else if (savedKeyLocal) {
        if (isBioEnabled) {
            handleBiometricAuth(onSuccess).catch(() => { });
        } else if (isRemembered) {
            finishLogin(savedKeyLocal, onSuccess);
        } else {
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

function showSetupFolder() {
    document.getElementById('auth-folder-step').classList.remove('hidden');
    document.getElementById('auth-pass-step').classList.add('hidden');
    document.getElementById('auth-title').innerText = t('auth.setup_folder_title');
    document.getElementById('auth-desc').innerText = t('auth.setup_folder_desc');

    const icon = document.getElementById('auth-main-icon');
    if (icon) icon.setAttribute('data-lucide', 'folder-plus');
    safeCreateIcons();
}

async function showSetupPass(onSuccess) {
    document.getElementById('auth-folder-step').classList.add('hidden');
    document.getElementById('auth-pass-step').classList.remove('hidden');

    const { FileStorage } = await import('../file-storage.js');
    const hasMetadata = await FileStorage.getMetadata('').catch(() => false);

    const title = document.getElementById('auth-title');
    const desc = document.getElementById('auth-desc');
    const submit = document.getElementById('auth-submit');
    const confirmWrapper = document.getElementById('confirm-password-wrapper');

    if (hasMetadata) {
        title.innerText = t('auth.title');
        desc.innerText = t('auth.desc');
        submit.innerText = t('auth.unlock');
        confirmWrapper.classList.add('hidden');
    } else {
        title.innerText = t('auth.setup_title');
        desc.innerText = t('auth.setup_desc');
        submit.innerText = t('auth.create_vault');
        confirmWrapper.classList.remove('hidden');
    }

    const icon = document.getElementById('auth-main-icon');
    if (icon) icon.setAttribute('data-lucide', 'lock');
    safeCreateIcons();
}

function showLoginPage() {
    document.getElementById('auth-folder-step').classList.add('hidden');
    document.getElementById('auth-pass-step').classList.remove('hidden');
    document.getElementById('auth-title').innerText = t('auth.title');
    document.getElementById('auth-desc').innerText = t('auth.desc');
    document.getElementById('auth-submit').innerText = t('auth.unlock');
    document.getElementById('confirm-password-wrapper').classList.add('hidden');

    const icon = document.getElementById('auth-main-icon');
    if (icon) icon.setAttribute('data-lucide', 'shield');
    safeCreateIcons();
}

export function lockApp() {
    const shield = document.getElementById('auth-shield');
    if (!shield) return;
    shield.style.display = 'flex';
    setTimeout(() => shield.classList.remove('opacity-0', 'pointer-events-none'), 10);
    document.getElementById('master-password').value = '';
    showLoginPage();
    safeCreateIcons();
}

export async function handleBiometricAuth(onSuccess) {
    const isEnabled = localStorage.getItem(KEYS.BIO_ENABLED) === 'true';
    if (!isEnabled) {
        const pass = document.getElementById('master-password').value;
        if (!pass) return showToast(t('auth.setup_pass_first'));
        const authHash = await Security.hash(pass);
        if (authHash !== localStorage.getItem(KEYS.MASTER_HASH)) return showToast(t('auth.incorrect_pass'));
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: t('app_name'), id: window.location.hostname },
                    user: { id: new Uint8Array(16), name: "user", displayName: "User" },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    timeout: 60000,
                    authenticatorSelection: { authenticatorAttachment: "platform" },
                    attestation: "none"
                }
            });
            localStorage.setItem(KEYS.BIO_ENABLED, 'true');
            const vaultKey = await Security.deriveVaultKey(pass);
            localStorage.setItem(KEYS.VAULT_KEY, vaultKey);
            showToast(t('biometrics.success_enable'));
            finishLogin(vaultKey, onSuccess);
        } catch (e) {
            showToast(t('biometrics.fail_enable'));
        }
    } else {
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            await navigator.credentials.get({
                publicKey: { challenge, rpId: window.location.hostname, userVerification: "required", timeout: 60000 }
            });
            const vaultKey = localStorage.getItem(KEYS.VAULT_KEY);
            if (vaultKey) finishLogin(vaultKey, onSuccess);
            else {
                showToast(t('auth.bio_fail'));
                localStorage.setItem(KEYS.BIO_ENABLED, 'false');
            }
        } catch (e) {
            showToast(t('auth.bio_fail'));
        }
    }
}

async function finishLogin(vaultKey, onSuccess) {
    const shield = document.getElementById('auth-shield');
    if (!shield) return;
    shield.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => shield.style.display = 'none', 300);
    document.getElementById('app')?.classList.remove('opacity-0');
    sessionStorage.setItem(KEYS.VAULT_KEY, vaultKey);
    await loadLocalEncrypted(vaultKey);
    onSuccess();
}

export async function handleMasterAuth(onSuccess) {
    const pass = document.getElementById('master-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const isSetup = !localStorage.getItem(KEYS.MASTER_HASH);
    const confirmWrapper = document.getElementById('confirm-password-wrapper');
    const needsConfirm = isSetup && confirmWrapper && !confirmWrapper.classList.contains('hidden');

    if (!pass) return showToast(t('auth.pass_placeholder'));
    if (needsConfirm) {
        if (!confirmPass) return showToast(t('auth.confirm_pass'));
        if (pass !== confirmPass) return showToast(t('auth.password_mismatch'));
        if (pass.length < 4) return showToast(t('auth.password_short'));
    }

    const authHash = await Security.hash(pass);
    const vaultKey = await Security.deriveVaultKey(pass);
    const existingHash = localStorage.getItem(KEYS.MASTER_HASH);
    const remember = document.getElementById('auth-remember')?.checked;

    if (!existingHash) {
        localStorage.setItem(KEYS.MASTER_HASH, authHash);
        if (remember) {
            localStorage.setItem(KEYS.VAULT_KEY, vaultKey);
            localStorage.setItem(KEYS.REMEMBER_ME, 'true');
        }
        await finishLogin(vaultKey, onSuccess);
        showToast(t('auth.vault_created'));
    } else {
        if (existingHash === authHash) {
            if (remember) {
                localStorage.setItem(KEYS.VAULT_KEY, vaultKey);
                localStorage.setItem(KEYS.REMEMBER_ME, 'true');
            }
            await finishLogin(vaultKey, onSuccess);
            showToast(t('auth.vault_opened'));
        } else {
            showToast(t('auth.incorrect_pass'));
        }
    }
}
