import { state, saveLocal } from './state.js';
import { SecurityService as Security } from './security.js';
import { showToast } from './ui-utils.js';
import { KEYS } from './constants.js';

const BACKUP_KEY = 'cn_local_backups_v3';

export class BackupService {
    /**
     * Creates a data object containing notes and categories
     */
    static async createBackupData() {
        return {
            notes: state.notes,
            categories: state.categories,
            timestamp: Date.now(),
            version: '3.0'
        };
    }

    /**
     * Exports the backup to a file (encrypted)
     */
    static async exportToFile() {
        const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
        if (!vaultKey) throw new Error('Vault not unlocked');

        const data = await this.createBackupData();
        const encrypted = await Security.encrypt(data, vaultKey);

        const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];

        a.href = url;
        a.download = `private_notes_backup_${date}.cnb`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Imports a backup from a file
     */
    static async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const encryptedData = JSON.parse(e.target.result);
                    const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
                    if (!vaultKey) throw new Error('Vault not unlocked');

                    const decrypted = await Security.decrypt(encryptedData, vaultKey);

                    if (decrypted && decrypted.notes && decrypted.categories) {
                        state.notes = decrypted.notes;
                        state.categories = decrypted.categories;
                        await saveLocal();
                        resolve(true);
                    } else {
                        throw new Error('Invalid backup format');
                    }
                } catch (err) {
                    console.error('Import error:', err);
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('File reading error'));
            reader.readAsText(file);
        });
    }

    /**
     * Management of local Daily Backups
     */
    static async runAutoBackup() {
        const backups = this.getLocalBackups();
        const now = Date.now();
        const lastBackup = backups.length > 0 ? backups[0].timestamp : 0;

        const ONE_DAY = 24 * 60 * 60 * 1000;

        if (now - lastBackup > ONE_DAY) {
            console.log('[Backup] Running daily auto-backup...');
            await this.saveLocalBackup();
        }
    }

    static getLocalBackups() {
        const stored = localStorage.getItem(KEYS.BACKUPS);
        return stored ? JSON.parse(stored) : [];
    }

    static async saveLocalBackup() {
        const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
        if (!vaultKey) return; // Can't backup if locked

        const data = await this.createBackupData();
        const encrypted = await Security.encrypt(data, vaultKey);

        const backups = this.getLocalBackups();
        const newBackup = {
            id: 'bak_' + Date.now(),
            timestamp: Date.now(),
            data: encrypted
        };

        // Add to the beginning, keep last 7
        const updated = [newBackup, ...backups].slice(0, 7);
        localStorage.setItem(KEYS.BACKUPS, JSON.stringify(updated));
    }

    static async restoreFromLocal(id) {
        const backups = this.getLocalBackups();
        const backup = backups.find(b => b.id === id);
        if (!backup) throw new Error('Backup not found');

        const vaultKey = sessionStorage.getItem(KEYS.VAULT_KEY) || localStorage.getItem(KEYS.VAULT_KEY);
        const decrypted = await Security.decrypt(backup.data, vaultKey);

        if (decrypted && decrypted.notes && decrypted.categories) {
            state.notes = decrypted.notes;
            state.categories = decrypted.categories;
            await saveLocal();
            return true;
        }
        throw new Error('Invalid backup data');
    }

    static clearAllBackups() {
        localStorage.removeItem(KEYS.BACKUPS);
    }
}
