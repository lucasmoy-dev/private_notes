
import { KEYS } from './constants.js';

export class AuthService {
    static async generatePKCE() {
        const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => ('0' + b.toString(16)).slice(-2))
            .join('');

        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        return { verifier, challenge };
    }

    static async exchangeCodeForTokens(code, verifier, clientId) {
        const params = new URLSearchParams({
            client_id: clientId,
            code: code,
            code_verifier: verifier,
            grant_type: 'authorization_code',
            redirect_uri: window.location.origin + window.location.pathname
        });

        // NOTE: Google's token endpoint might block direct CORS from browsers for Web Clients.
        // If this fails, a backend or a CORS proxy would be required.
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_description || 'Failed to exchange code');
        }

        const data = await response.json();
        // data contains: access_token, refresh_token, expires_in, etc.
        data.expires_at = Date.now() + (data.expires_in * 1000);
        return data;
    }

    static async refreshAccessToken(refreshToken, clientId) {
        const params = new URLSearchParams({
            client_id: clientId,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        });

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_description || 'Failed to refresh token');
        }

        const data = await response.json();
        data.expires_at = Date.now() + (data.expires_in * 1000);
        return data;
    }

    // --- IndexedDB Storage for Refresh Token ---
    static async saveRefreshToken(token) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AuthDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('tokens')) {
                    db.createObjectStore('tokens');
                }
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('tokens', 'readwrite');
                tx.objectStore('tokens').put(token, 'refresh_token');
                tx.oncomplete = () => resolve();
                tx.onerror = (err) => reject(err);
            };
            request.onerror = (err) => reject(err);
        });
    }

    static async getRefreshToken() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AuthDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('tokens')) {
                    db.createObjectStore('tokens');
                }
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('tokens', 'readonly');
                const store = tx.objectStore('tokens');
                const getReq = store.get('refresh_token');
                getReq.onsuccess = () => resolve(getReq.result);
                getReq.onerror = (err) => reject(err);
            };
            request.onerror = (err) => reject(err);
        });
    }

    static async clearTokens() {
        return new Promise((resolve) => {
            const request = indexedDB.open('AuthDB', 1);
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('tokens', 'readwrite');
                tx.objectStore('tokens').clear();
                tx.oncomplete = () => resolve();
            };
        });
    }
}
