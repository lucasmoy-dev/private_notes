
/**
 * Auth & Security Module
 * Handles Password Hashing, Key Derivation, and AES-256-GCM Encryption
 */

export class Security {
    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt_cloud_notes_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: 250000,
                hash: 'SHA-512'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encrypt(data, password) {
        try {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await this.deriveKey(password, this.bufToHex(salt));
            const encoder = new TextEncoder();
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encoder.encode(typeof data === 'string' ? data : JSON.stringify(data))
            );

            return {
                payload: this.bufToHex(new Uint8Array(encrypted)),
                iv: this.bufToHex(iv),
                salt: this.bufToHex(salt)
            };
        } catch (e) {
            console.error('Encryption failed', e);
            throw e;
        }
    }

    static async decrypt(encryptedObj, password) {
        try {
            const { payload, iv, salt } = encryptedObj;
            const key = await this.deriveKey(password, salt);
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: this.hexToBuf(iv) },
                key,
                this.hexToBuf(payload)
            );

            const decoder = new TextDecoder();
            const result = decoder.decode(decrypted);
            try {
                return JSON.parse(result);
            } catch {
                return result;
            }
        } catch (e) {
            console.error('Decryption failed. Wrong password?', e);
            throw e;
        }
    }

    static bufToHex(buffer) {
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static hexToBuf(hex) {
        return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }
}
