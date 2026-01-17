import { SecurityService as Security } from '../security.js';
import { state, loadLocalEncrypted } from '../state.js';
// ... imports
import { showToast, safeCreateIcons } from '../ui-utils.js';
import { t } from '../i18n.js';

export function getAuthShieldTemplate() {
    const isAuthed = !!(sessionStorage.getItem('cn_vault_key_v3') || localStorage.getItem('cn_vault_key_v3'));
    return `
    <div id="auth-shield" class="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 ${isAuthed ? 'opacity-0 pointer-events-none' : ''}" style="${isAuthed ? 'display: none' : ''}">
        <div class="w-full max-w-sm p-8 space-y-6 bg-card border rounded-lg shadow-lg">
            <div class="text-center space-y-2">
                <div class="mx-auto w-10 h-10 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                    <i data-lucide="lock" class="w-5 h-5"></i>
                </div>
                <h1 class="text-2xl font-semibold tracking-tight" id="auth-title">${t('auth.title')}</h1>
                <p class="text-sm text-muted-foreground" id="auth-desc">${t('auth.desc')}</p>
            </div>
            <div class="space-y-4">
                <div class="relative group">
                    <input type="password" id="master-password" placeholder="${t('auth.pass_placeholder')}" class="h-11 w-full pl-4 pr-12 text-base">
                    <button type="button" class="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="master-password">
                        <i data-lucide="eye" class="w-4 h-4 icon-show"></i>
                    </button>
                </div>
                <div class="relative group hidden" id="confirm-password-wrapper">
                    <input type="password" id="confirm-password" placeholder="${t('auth.repeat_placeholder')}" class="h-11 w-full pl-4 pr-12 text-base">
                    <button type="button" class="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="confirm-password">
                        <i data-lucide="eye" class="w-4 h-4 icon-show"></i>
                    </button>
                </div>
                
                <div class="flex items-center gap-2 py-1">
                    <input type="checkbox" id="auth-remember" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary">
                    <label for="auth-remember" class="text-xs text-muted-foreground cursor-pointer select-none">${t('auth.remember_me')}</label>
                </div>

                <button id="auth-submit" class="btn-shad btn-shad-primary w-full h-11 font-bold">${t('auth.unlock')}</button>
                
                <button id="auth-biometric" class="hidden btn-shad btn-shad-secondary w-full h-11 font-bold flex items-center justify-center gap-2">
                     <i data-lucide="fingerprint" class="w-5 h-5"></i> <span id="bio-text">${t('auth.use_bio')}</span>
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
    const isSetup = !localStorage.getItem('cn_master_hash_v3');
    const savedKey = sessionStorage.getItem('cn_vault_key_v3') || localStorage.getItem('cn_vault_key_v3');
    const isBioEnabled = localStorage.getItem('cn_bio_enabled') === 'true';

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
    } else if (savedKey) {
        if (isBioEnabled) {
            // If Bio is enabled, we DO NOT auto-login.
            // We verify bio first.
            // Shield remains visible.
        } else {
            // Auto-login (Legacy/Standard behavior)
            shield.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => shield.style.display = 'none', 300);
            const appEl = document.getElementById('app');
            if (appEl) appEl.classList.remove('opacity-0');

            try {
                await loadLocalEncrypted(savedKey);
                onSuccess();
            } catch (e) {
                console.error("Auto-auth failed, clearing keys.");
                clearAuth();
                showLoginPage();
            }
        }
    } else {
        showLoginPage();
    }
}

function clearAuth() {
    sessionStorage.removeItem('cn_vault_key_v3');
    localStorage.removeItem('cn_vault_key_v3');
}

// ... existing showSetupPage and showLoginPage ...

export async function handleBiometricAuth(onSuccess) {
    const isEnabled = localStorage.getItem('cn_bio_enabled') === 'true';

    if (!isEnabled) {
        // SETUP MODE
        const pass = document.getElementById('master-password').value;
        if (!pass) return showToast('⚠️ Ingresa tu contraseña primero para configurar');

        const authHash = await Security.hash(pass);
        const existingHash = localStorage.getItem('cn_master_hash_v3');

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
            localStorage.setItem('cn_bio_enabled', 'true');
            // Ensure key is saved for auto-retrieval
            const vaultKey = await Security.deriveVaultKey(pass);
            localStorage.setItem('cn_vault_key_v3', vaultKey);

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
            const vaultKey = localStorage.getItem('cn_vault_key_v3');
            if (vaultKey) {
                finishLogin(vaultKey, onSuccess);
            } else {
                showToast('❌ Error: Llave no encontrada. Ingresa contraseña.');
                localStorage.setItem('cn_bio_enabled', 'false'); // Reset
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
    sessionStorage.setItem('cn_vault_key_v3', vaultKey);
    await loadLocalEncrypted(vaultKey);
    onSuccess();
}

export async function handleMasterAuth(onSuccess) {
    // ... (rest of handleMasterAuth mostly same, but need to check bio toggle logic)
    const pass = document.getElementById('master-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const isSetup = !localStorage.getItem('cn_master_hash_v3');

    if (!pass) return showToast('Ingresa una contraseña');

    if (isSetup) {
        if (!confirmPass) return showToast(t('auth.confirm_pass'));
        if (pass !== confirmPass) return showToast(t('auth.password_mismatch'));
        if (pass.length < 4) return showToast(t('auth.password_short'));
    }

    const authHash = await Security.hash(pass);
    const vaultKey = await Security.deriveVaultKey(pass);
    const existingHash = localStorage.getItem('cn_master_hash_v3');

    const remember = document.getElementById('auth-remember').checked;

    // MIGRATION
    localStorage.removeItem('cn_pass_plain_v3');
    sessionStorage.removeItem('cn_pass_plain_v3');

    if (!existingHash) {
        localStorage.setItem('cn_master_hash_v3', authHash);
        // If remembering, save key
        if (remember) localStorage.setItem('cn_vault_key_v3', vaultKey);
        finishLogin(vaultKey, onSuccess);
        showToast('✅ Bóveda creada con éxito');
    } else if (existingHash === authHash) {
        if (remember) localStorage.setItem('cn_vault_key_v3', vaultKey);
        // If Login with password, and bio is enabled, we keep bio enabled.
        finishLogin(vaultKey, onSuccess);
        showToast(t('auth.vault_opened'));

        // After password login, if bio is NOT enabled but supported, maybe prompt? 
        // User said "toco ahi Me pide la contraseña". So better explicit button click.
    } else {
        return showToast(t('auth.incorrect_pass'));
    }
}
