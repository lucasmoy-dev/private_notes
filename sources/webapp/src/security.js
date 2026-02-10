
/**
 * Security Service
 * Centralized module for all encryption, decryption, hashing and compression.
 */

export class SecurityService {
    /**
     * Hashes a password using SHA-512
     */
    static async hash(text, salt = 'salt_cloud_notes_2026') {
        const encoder = new TextEncoder();
        const data = encoder.encode(text + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Derives a vault key from a password to avoid storing the plain text password.
     */
    static async deriveVaultKey(password) {
        return await this.hash(password, 'vault_v3_internal_key');
    }

    /**
     * Helper for Compression (GZIP)
     */
    static async compress(text) {
        const stream = new Blob([text]).stream();
        const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
        const response = new Response(compressedStream);
        return await response.arrayBuffer();
    }

    static async decompress(buffer) {
        const stream = new Blob([buffer]).stream();
        const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
        const response = new Response(decompressedStream);
        return await response.text();
    }

    /**
     * Derives a cryptographic key from a password
     */
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

    /**
     * Encrypts any data object using AES-256-GCM + GZIP Compression
     */
    static async encrypt(data, password, options = { algo: 'aes-256-gcm' }) {
        try {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await this.deriveKey(password, this.bufToBase64(salt));

            const payload = typeof data === 'string' ? data : JSON.stringify(data);

            // 1. Compress
            const compressed = await this.compress(payload);

            // 2. Encrypt
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                compressed
            );

            return {
                payload: this.bufToBase64(new Uint8Array(encrypted)),
                iv: this.bufToBase64(iv),
                salt: this.bufToBase64(salt),
                algo: options.algo || 'aes-256-gcm',
                compressed: true,
                v: '4.0'
            };
        } catch (e) {
            console.error('[Security] Encryption failed:', e);
            throw new Error('No se pudo encriptar la información');
        }
    }

    /**
     * Decrypts an encrypted object back to its original form
     */
    static async decrypt(encryptedObj, password) {
        try {
            if (!encryptedObj || !encryptedObj.payload || !encryptedObj.iv || !encryptedObj.salt) {
                throw new Error('Formato de datos encriptados inválido');
            }

            const { payload, iv, salt, compressed } = encryptedObj;
            const key = await this.deriveKey(password, salt);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: this.base64ToBuf(iv) },
                key,
                this.base64ToBuf(payload)
            );

            // Decompress if needed
            const finalData = compressed
                ? await this.decompress(decrypted)
                : new TextDecoder().decode(decrypted);

            try {
                return JSON.parse(finalData);
            } catch {
                return finalData;
            }
        } catch (e) {
            console.error('[Security] Decryption failed:', e);
            throw new Error('Contraseña incorrecta o datos corruptos');
        }
    }

    // Modern Encoding Utilities (Base64 instead of Hex for 33% smaller size)
    static bufToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    static base64ToBuf(base64) {
        return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
    }
}
