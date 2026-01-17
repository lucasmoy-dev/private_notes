import { Security } from '../auth.js';
import { state, loadLocalEncrypted } from '../state.js';
import { showToast, safeCreateIcons } from '../ui-utils.js';

export function getAuthShieldTemplate() {
    return `
    <div id="auth-shield" class="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300">
        <div class="w-full max-w-sm p-8 space-y-6 bg-card border rounded-lg shadow-lg">
            <div class="text-center space-y-2">
                <div class="mx-auto w-10 h-10 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                    <i data-lucide="lock" class="w-5 h-5"></i>
                </div>
                <h1 class="text-2xl font-semibold tracking-tight" id="auth-title">Bóveda Protegida</h1>
                <p class="text-sm text-muted-foreground" id="auth-desc">Ingresa tu contraseña maestra para continuar</p>
            </div>
            <div class="space-y-4">
                <div class="relative group">
                    <input type="password" id="master-password" placeholder="Tu contraseña" class="h-11 w-full pl-4 pr-12 text-base">
                    <button type="button" class="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="master-password">
                        <i data-lucide="eye" class="w-4 h-4 icon-show"></i>
                    </button>
                </div>
                <div class="relative group hidden" id="confirm-password-wrapper">
                    <input type="password" id="confirm-password" placeholder="Repite la contraseña" class="h-11 w-full pl-4 pr-12 text-base">
                    <button type="button" class="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="confirm-password">
                        <i data-lucide="eye" class="w-4 h-4 icon-show"></i>
                    </button>
                </div>
                <button id="auth-submit" class="btn-shad btn-shad-primary w-full h-11 font-bold">Desbloquear</button>
            </div>
        </div>
    </div>`;
}

export async function checkAuthStatus(onSuccess) {
    const shield = document.getElementById('auth-shield');
    const isSetup = !localStorage.getItem('cn_master_hash_v3');
    const savedPass = sessionStorage.getItem('cn_pass_plain_v3');

    if (isSetup) {
        showSetupPage();
    } else if (savedPass) {
        const hash = await Security.hashPassword(savedPass);
        if (hash === localStorage.getItem('cn_master_hash_v3')) {
            shield.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => shield.style.display = 'none', 300);
            document.getElementById('app').classList.remove('opacity-0');
            await loadLocalEncrypted(savedPass);
            onSuccess();
        } else {
            sessionStorage.removeItem('cn_pass_plain_v3');
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

function showSetupPage() {
    const title = document.getElementById('auth-title');
    const desc = document.getElementById('auth-desc');
    const wrapper = document.getElementById('confirm-password-wrapper');
    const submitBtn = document.getElementById('auth-submit');

    if (title) title.innerText = "Configura tu Bóveda";
    if (desc) desc.innerText = "Crea una contraseña maestra. Introduce la contraseña dos veces para asegurar que es correcta.";
    if (wrapper) wrapper.classList.remove('hidden');
    if (submitBtn) {
        submitBtn.innerText = "Crear mi Bóveda";
        submitBtn.classList.remove('btn-shad-primary');
        submitBtn.classList.add('btn-shad-success');
    }
    safeCreateIcons();
}

function showLoginPage() {
    const title = document.getElementById('auth-title');
    const desc = document.getElementById('auth-desc');
    const wrapper = document.getElementById('confirm-password-wrapper');
    const submitBtn = document.getElementById('auth-submit');

    if (title) title.innerText = "Bóveda Protegida";
    if (desc) desc.innerText = "Ingresa tu contraseña maestra para continuar";
    if (wrapper) wrapper.classList.add('hidden');
    if (submitBtn) {
        submitBtn.innerText = "Desbloquear";
        submitBtn.classList.add('btn-shad-primary');
        submitBtn.classList.remove('btn-shad-success');
    }
    safeCreateIcons();
}

export async function handleMasterAuth(onSuccess) {
    const pass = document.getElementById('master-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const isSetup = !localStorage.getItem('cn_master_hash_v3');

    if (!pass) return showToast('Ingresa una contraseña');

    if (isSetup) {
        if (!confirmPass) return showToast('Confirma tu contraseña');
        if (pass !== confirmPass) return showToast('⚠️ ¡Las contraseñas no coinciden!');
        if (pass.length < 4) return showToast('La contraseña debe tener al menos 4 caracteres');
    }

    const hash = await Security.hashPassword(pass);
    const existingHash = localStorage.getItem('cn_master_hash_v3');

    if (!existingHash) {
        localStorage.setItem('cn_master_hash_v3', hash);
        sessionStorage.setItem('cn_pass_plain_v3', pass);
        showToast('✅ Bóveda creada con éxito');
    } else if (existingHash === hash) {
        sessionStorage.setItem('cn_pass_plain_v3', pass);
        showToast('Bóveda abierta');
    } else {
        return showToast('❌ Contraseña incorrecta');
    }

    const shield = document.getElementById('auth-shield');
    shield.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => shield.style.display = 'none', 300);
    document.getElementById('app').classList.remove('opacity-0');
    await loadLocalEncrypted(pass);
    onSuccess();
}
