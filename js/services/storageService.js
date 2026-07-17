export default {
    STORAGE_KEY: 'appState',

    loadState() {
        const savedState = localStorage.getItem(this.STORAGE_KEY);
        if (savedState) {
            try {
                return JSON.parse(savedState);
            } catch (e) {
                console.error('Error parsing saved state:', e);
                return null;
            }
        }
        return null;
    },

    saveState(state) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    },

    importSettings(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Import error:', error);
            alert('Invalid JSON');
            return null;
        }
    }
};
