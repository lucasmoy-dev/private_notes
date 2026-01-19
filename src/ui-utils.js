export function showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.querySelector('div').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

export function openPrompt(message, description = '', isPassword = false) {
    if (typeof description === 'boolean') {
        isPassword = description;
        description = '';
    }

    return new Promise((resolve) => {
        const modal = document.getElementById('prompt-modal');
        const input = document.getElementById('prompt-input');
        const title = document.getElementById('prompt-title');
        const descEl = document.getElementById('prompt-desc');
        const confirmBtn = document.getElementById('prompt-confirm');
        const cancelBtn = document.getElementById('prompt-cancel');
        const bioBtn = document.getElementById('prompt-biometric');
        const toggleBtn = document.getElementById('prompt-toggle-visibility');

        if (!modal || !input || !title || !confirmBtn || !cancelBtn || !bioBtn || !toggleBtn) {
            console.error("One or more prompt elements not found.");
            return resolve(null);
        }

        title.textContent = message;
        if (descEl) {
            descEl.textContent = description;
            descEl.classList.toggle('hidden', !description);
        }
        input.value = '';
        input.type = isPassword ? 'password' : 'text';

        // Show/hide visibility toggle based on password mode
        if (isPassword) {
            toggleBtn.classList.remove('hidden');
            input.placeholder = 'Enter password';
            input.classList.add('text-center', 'tracking-widest');
        } else {
            toggleBtn.classList.add('hidden');
            input.placeholder = 'Type here...';
            input.classList.remove('text-center', 'tracking-widest');
        }

        // Show biometric button if supported and enabled
        const isBioEnabled = localStorage.getItem('cn_bio_enabled') === 'true';
        if (window.PublicKeyCredential && isBioEnabled && isPassword) {
            bioBtn.classList.remove('hidden');

            // Auto-trigger biometric after a short delay
            setTimeout(() => {
                if (!modal.classList.contains('hidden')) {
                    bioBtn.click();
                }
            }, 10);
        } else {
            bioBtn.classList.add('hidden');
        }

        bioBtn.onclick = async () => {
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

                cleanup(); // Call cleanup on success
                resolve({ biometric: true });
            } catch (e) {
                console.error('Biometric auth failed:', e);
                // Fallback: try to create credential (Proof of Presence via Creation)
                try {
                    const challenge2 = new Uint8Array(32);
                    window.crypto.getRandomValues(challenge2);

                    await navigator.credentials.create({
                        publicKey: {
                            challenge: challenge2,
                            rp: { name: "Private Notes", id: window.location.hostname },
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

                    cleanup(); // Call cleanup on success
                    resolve({ biometric: true });
                } catch (e2) {
                    console.error('Biometric create failed:', e2);
                    showToast('❌ Biometric authentication failed');
                }
            }
        };

        // Toggle password visibility
        toggleBtn.onclick = () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '<i data-lucide="eye"></i>';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '<i data-lucide="eye-off"></i>';
            }
            safeCreateIcons();
        };

        modal.classList.remove('hidden');
        safeCreateIcons();
        input.focus();

        const cleanup = () => {
            modal.classList.add('hidden');
            window.removeEventListener('keydown', handleKey);
        };

        const handleKey = (e) => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
        };
        window.addEventListener('keydown', handleKey);

        const confirm = () => {
            const val = input.value;
            cleanup();
            resolve(val);
        };

        const cancel = () => {
            cleanup();
            resolve(null);
        };

        document.getElementById('prompt-confirm').onclick = confirm;
        document.getElementById('prompt-cancel').onclick = cancel;
    });
}

export function isColorDark(hex) {
    if (!hex) return true;
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return true;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128;
}

export function safeCreateIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}
