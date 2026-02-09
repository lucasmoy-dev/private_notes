import { SecurityService as Security } from '../security.js';
import { state, loadLocalEncrypted } from '../state.js';
// ... imports
import { showToast, safeCreateIcons } from '../ui-utils.js';
import { t } from '../i18n.js';
import { KEYS } from '../constants.js';

export function getAuthShieldTemplate() {
    const isAuthed = !!(sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY));
    return `
    <div id="auth-shield" class="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 ${isAuthed ? 'opacity-0 pointer-events-none' : ''}" style="${isAuthed ? 'display: none' : ''}">
        <div class="w-full max-w-[320px] p-6 space-y-4 bg-card border rounded-2xl shadow-2xl">
            <div class="text-center space-y-1.5">
                <div class="mx-auto w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <i data-lucide="lock" class="w-4 h-4"></i>
                </div>
                <h1 class="text-xl font-bold tracking-tight" id="auth-title">${t('auth.title')}</h1>
                <p class="text-xs text-muted-foreground" id="auth-desc">${t('auth.desc')}</p>
            </div>
            <div class="space-y-3">
                <div class="relative group">
                    <input type="password" id="master-password" placeholder="${t('auth.pass_placeholder')}" class="h-10 w-full pl-4 pr-11 text-sm bg-muted/30 border-none ring-1 ring-border focus:ring-2 focus:ring-primary rounded-xl transition-all">
                    <button type="button" class="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="master-password" tabindex="-1">
                        <i data-lucide="eye" class="w-3.5 h-3.5 icon-show"></i>
                    </button>
                </div>
                <div class="relative group hidden" id="confirm-password-wrapper">
                    <input type="password" id="confirm-password" placeholder="${t('auth.repeat_placeholder')}" class="h-10 w-full pl-4 pr-11 text-sm bg-muted/30 border-none ring-1 ring-border focus:ring-2 focus:ring-primary rounded-xl transition-all">
                    <button type="button" class="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="confirm-password" tabindex="-1">
                        <i data-lucide="eye" class="w-3.5 h-3.5 icon-show"></i>
                    </button>
                </div>
                
                <div class="flex items-center gap-2 py-0.5">
                    <input type="checkbox" id="auth-remember" class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary">
                    <label for="auth-remember" class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 cursor-pointer select-none">${t('auth.remember_me')}</label>
                </div>

                <button id="auth-submit" class="btn-shad btn-shad-primary w-full h-11 font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">${t('auth.unlock')}</button>
                
                <button id="auth-biometric" class="hidden btn-shad btn-shad-secondary w-full h-10 font-bold flex items-center justify-center gap-2 rounded-xl text-sm border-none bg-muted hover:bg-muted/80">
                     <i data-lucide="fingerprint" class="w-4 h-4"></i> <span id="bio-text" class="text-xs uppercase tracking-wide">${t('auth.use_bio')}</span>
                </button>

                <div id="auth-extra-actions" class="hidden pt-4 border-t border-border/50">
                    <button id="auth-force-reload" class="flex items-center justify-center gap-2 w-full p-3 text-xs text-destructive bg-destructive/5 hover:bg-destructive/10 rounded-lg border border-destructive/10 transition-all font-medium">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> ${t('auth.problems')}
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

export async function checkAuthStatus(onSuccess) {
    const shield = document.getElementById('auth-shield');
    const isSetup = !localStorage.getItem(KEYS.MASTER_HASH);
    const savedKeySession = sessionStorage.getItem(KEYS.VAULT_KEY);
    const savedKeyLocal = localStorage.getItem(KEYS.VAULT_KEY);
    const isBioEnabled = localStorage.getItem(KEYS.BIO_ENABLED) === 'true';
    const isRemembered = localStorage.getItem(KEYS.REMEMBER_ME) === 'true';

    // Show bio button if supported and set up
    const bioBtn = document.getElementById('auth-biometric');
    if (window.PublicKeyCredential && bioBtn) {
        bioBtn.classList.remove('hidden');
        if (isBioEnabled) {
            document.getElementById('bio-text').innerText = t('auth.bio_unlock');
            // Auto-trigger bio check if enabled? 
            // Maybe slightly delayed to avoid conflicts on load
            // setTimeout(() => handleBiometricAuth(onSuccess), 500); 
        } else {
            document.getElementById('bio-text').innerText = t('auth.bio_setup');
        }
    }

    if (isSetup) {
        showSetupPage();
    } else if (savedKeySession) {
        // Auto-login from active session
        finishLogin(savedKeySession, onSuccess);
    } else if (savedKeyLocal) {
        if (isBioEnabled) {
            // Bio is enabled, show button and auto-trigger
            setTimeout(() => {
                handleBiometricAuth(onSuccess).catch(() => {
                    console.log('Auto-bio failed/cancelled');
                });
            }, 500);
        } else if (isRemembered) {
            // "Remember Me" was checked, auto-login without password
            finishLogin(savedKeyLocal, onSuccess);
        } else {
            // Key exists but no Bio and no Remember Me (maybe left over from previous bio session)
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

export function lockApp() {
    const shield = document.getElementById('auth-shield');
    if (!shield) return;

    // Reset Bio button text
    const isBioEnabled = localStorage.getItem(KEYS.BIO_ENABLED) === 'true';
    const bioBtn = document.getElementById('auth-biometric');
    if (bioBtn) {
        bioBtn.classList.toggle('hidden', !window.PublicKeyCredential || !isBioEnabled);
        if (isBioEnabled) document.getElementById('bio-text').innerText = t('auth.bio_unlock');
    }

    shield.style.display = 'flex';
    // Use a small timeout to trigger CSS transition
    setTimeout(() => {
        shield.classList.remove('opacity-0', 'pointer-events-none');
    }, 10);

    document.getElementById('master-password').value = '';
    showLoginPage();
    safeCreateIcons();

    // Auto trigger bio if enabled
    if (isBioEnabled) {
        setTimeout(() => handleBiometricAuth(() => { }), 500);
    }
}

function clearAuth() {
    sessionStorage.removeItem(KEYS.VAULT_KEY);
    localStorage.removeItem(KEYS.VAULT_KEY);
}

function showSetupPage() {
    const title = document.getElementById('auth-title');
    const desc = document.getElementById('auth-desc');
    const submit = document.getElementById('auth-submit');
    const confirmWrapper = document.getElementById('confirm-password-wrapper');

    if (title) title.innerText = t('auth.setup_title');
    if (desc) desc.innerText = t('auth.setup_desc');
    if (submit) submit.innerText = t('auth.create_vault');
    if (confirmWrapper) confirmWrapper.classList.remove('hidden');
}

function showLoginPage() {
    const title = document.getElementById('auth-title');
    const desc = document.getElementById('auth-desc');
    const submit = document.getElementById('auth-submit');
    const confirmWrapper = document.getElementById('confirm-password-wrapper');

    if (title) title.innerText = t('auth.title');
    if (desc) desc.innerText = t('auth.desc');
    if (submit) submit.innerText = t('auth.unlock');
    if (confirmWrapper) confirmWrapper.classList.add('hidden');
}

export async function handleBiometricAuth(onSuccess) {
    const isEnabled = localStorage.getItem(KEYS.BIO_ENABLED) === 'true';

    if (!isEnabled) {
        // SETUP MODE
        const pass = document.getElementById('master-password').value;
        if (!pass) return showToast('⚠️ Ingresa tu contraseña primero para configurar');

        const authHash = await Security.hash(pass);
        const existingHash = localStorage.getItem(KEYS.MASTER_HASH);

        if (authHash !== existingHash) return showToast('❌ Contraseña incorrecta');

        // Verify WebAuthn support
        if (!window.PublicKeyCredential) return showToast('❌ Tu dispositivo no soporta biometría');

        try {
            // Create dummy credential to trigger permission
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: t('app_name'), id: window.location.hostname },
                    user: {
                        id: new Uint8Array(16),
                        name: "user",
                        displayName: "User"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    timeout: 60000,
                    authenticatorSelection: { authenticatorAttachment: "platform" },
                    attestation: "none"
                }
            });

            // Save state
            localStorage.setItem(KEYS.BIO_ENABLED, 'true');
            // Ensure key is saved for auto-retrieval
            const vaultKey = await Security.deriveVaultKey(pass);
            localStorage.setItem(KEYS.VAULT_KEY, vaultKey);

            showToast('✅ Huella activada');

            // Login
            finishLogin(vaultKey, onSuccess);
        } catch (e) {
            console.error(e);
            showToast('❌ Error al activar biometría: ' + e.message);
        }

    } else {
        // LOGIN MODE
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            await navigator.credentials.get({
                publicKey: {
                    challenge,
                    rpId: window.location.hostname,
                    userVerification: "required",
                    timeout: 60000
                }
            });

            // If success, get key
            const vaultKey = localStorage.getItem(KEYS.VAULT_KEY);
            if (vaultKey) {
                finishLogin(vaultKey, onSuccess);
            } else {
                showToast('❌ Error: Llave no encontrada. Ingresa contraseña.');
                localStorage.setItem(KEYS.BIO_ENABLED, 'false'); // Reset
            }

        } catch (e) {
            console.error(e);
            showToast(t('auth.bio_fail'));
        }
    }
}

async function finishLogin(vaultKey, onSuccess) {
    const shield = document.getElementById('auth-shield');
    shield.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => shield.style.display = 'none', 300);
    document.getElementById('app').classList.remove('opacity-0');
    sessionStorage.setItem(KEYS.VAULT_KEY, vaultKey);
    await loadLocalEncrypted(vaultKey);
    onSuccess();
}

export async function handleMasterAuth(onSuccess) {
    const pass = document.getElementById('master-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const isSetup = !localStorage.getItem(KEYS.MASTER_HASH);

    if (!pass) return showToast('Ingresa una contraseña');

    if (isSetup) {
        if (!confirmPass) return showToast(t('auth.confirm_pass'));
        if (pass !== confirmPass) return showToast(t('auth.password_mismatch'));
        if (pass.length < 4) return showToast(t('auth.password_short'));
    }

    const authHash = await Security.hash(pass);
    const vaultKey = await Security.deriveVaultKey(pass);
    const existingHash = localStorage.getItem(KEYS.MASTER_HASH);

    const remember = document.getElementById('auth-remember').checked;


    if (!existingHash) {
        localStorage.setItem(KEYS.MASTER_HASH, authHash);
        if (remember) {
            localStorage.setItem(KEYS.VAULT_KEY, vaultKey);
            localStorage.setItem(KEYS.REMEMBER_ME, 'true');
        }
        finishLogin(vaultKey, onSuccess);
        showToast(t('auth.vault_created'));
    } else if (existingHash === authHash) {
        if (remember) {
            localStorage.setItem(KEYS.VAULT_KEY, vaultKey);
            localStorage.setItem(KEYS.REMEMBER_ME, 'true');
        } else if (localStorage.getItem(KEYS.BIO_ENABLED) !== 'true') {
            // If not remembering and not using bio, clean up local key
            localStorage.removeItem(KEYS.VAULT_KEY);
            localStorage.removeItem(KEYS.REMEMBER_ME);
        }
        finishLogin(vaultKey, onSuccess);
        showToast(t('auth.vault_opened'));
    } else {
        return showToast(t('auth.incorrect_pass'));
    }
}
