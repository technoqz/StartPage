const { createApp, ref, reactive, onMounted, onUnmounted, computed, watch } = Vue;

// services
import rssService from './services/rssService.js';
import storageService from './services/storageService.js';

// blocks
import bookmarkBlock from './blocks/bookmarkBlock.js';
import rssBlock from './blocks/rssBlock.js';

// modals
import blockSettingsModal from './modals/blockSettingsModal.js'
import exportSettingsModal from './modals/exportSettingsModal.js'
import globalSettingsModal from './modals/globalSettingsModal.js'
import importSettingsModal from './modals/importSettingsModal.js'

const app = createApp({
    setup() {
        const state = reactive({
            nextColumnId: 1,
            nextBlockId: 1,
            columns: [],
            rssData: {},
            globalSettings: {
                rssFetchMethod: 'api',
                corsProxyUrl: '',
                updateFrequency: 30, // In minutes
                maxItemsPerFeed: 30,
                appBackgroundColor: '#392e5a',
                blockBackgroundColor: '#dbdbdb',
                blockGradientBackgroundColor: '#dbdbdb',
                blockNameColor: '#928043',
                blockBorderColor: '#f3f3f3',
                rssHeaderColor: '#000000',
                rssTextColor: '#333333',
                buttonBackgroundColor: '#d2d2d2',
                buttonTextColor: '#575757',
                rssblockHeaderFontSize: 16,
                rssblockDescriptionFontSize: 15,
            }
        });

        const editingBlock = ref(null);
        const tempBlock = ref(null);
        const feedsText = ref('');
        const bookmarksText = ref('');
        const showGlobalSettings = ref(false);
        const tempGlobalSettings = ref({});
        const showExport = ref(false);
        const showImport = ref(false);
        const importJson = ref('');

        let draggedBlock = null;
        let sourceColumn = null;
        let updateInterval = null; // To store the interval ID

        const exportJson = computed(() => {
            const exportData = {
                columns: state.columns,
                globalSettings: state.globalSettings,
                nextColumnId: state.nextColumnId,
                nextBlockId: state.nextBlockId
            };
            return JSON.stringify(exportData, null, 2);
        });

        const loadState = () => {
            const parsed = storageService.loadState();
            if (parsed) {
                state.columns = parsed.columns || [];
                state.rssData = parsed.rssData || {};
                state.globalSettings = { ...state.globalSettings, ...parsed.globalSettings };
                const maxColumnId = state.columns.length ? Math.max(...state.columns.map(c => c.id), 0) : 0;
                state.nextColumnId = maxColumnId + 1;
                const allBlocks = state.columns.flatMap(c => c.blocks || []);
                const maxBlockId = allBlocks.length ? Math.max(...allBlocks.map(b => b.id), 0) : 0;
                state.nextBlockId = maxBlockId + 1;
            } else {
                state.columns = [
                    {
                        id: state.nextColumnId,
                        blocks: [
                            {
                                id: state.nextBlockId,
                                name: 'New Block',
                                type: 'Bookmarks',
                                bookmarks: []
                            }
                        ]
                    }
                ];
                state.nextColumnId = 2;
                state.nextBlockId = 2;
            }
        };

        const saveState = () => {
            storageService.saveState(state);
        };


        const addColumn = () => {
            const newColumn = {
                id: state.nextColumnId,
                blocks: []
            };
            state.columns.push(newColumn);
            state.nextColumnId++;
            addBlockToColumn(newColumn);
            saveState();
        };

        const addBlockToColumn = (column) => {
            column.blocks.push({
                id: state.nextBlockId,
                name: 'New Block',
                type: 'Bookmarks',
                bookmarks: []
            });
            state.nextBlockId++;
            saveState();
        };

        const deleteBlock = (column, block) => {
            if (window.confirm('Are you sure you want to delete this block?')) {
                const blockIndex = column.blocks.indexOf(block);
                if (blockIndex !== -1) {
                    column.blocks.splice(blockIndex, 1);
                    if (column.blocks.length === 0) {
                        const columnIndex = state.columns.indexOf(column);
                        if (columnIndex !== -1) {
                            state.columns.splice(columnIndex, 1);
                        }
                    }
                    saveState();
                }
            }
        };

        const onDragStart = (event, column, block) => {
            draggedBlock = block;
            sourceColumn = column;
            event.dataTransfer.effectAllowed = 'move';
            event.target.closest('.block').classList.add('dragging');
        };

        const onDragEnd = (event) => {
            event.target.closest('.block').classList.remove('dragging');
            draggedBlock = null;
            sourceColumn = null;
        };

        const onDrop = (event, targetColumn) => {
            event.preventDefault();
            if (!draggedBlock || !sourceColumn) return;

            const sourceIndex = sourceColumn.blocks.indexOf(draggedBlock);
            if (sourceIndex === -1) return;

            sourceColumn.blocks.splice(sourceIndex, 1);

            const blocks = targetColumn.blocks;
            const dropY = event.clientY;
            const blockElements = event.currentTarget.querySelectorAll('.block');
            let insertIndex = blocks.length;

            for (let i = 0; i < blockElements.length; i++) {
                const rect = blockElements[i].getBoundingClientRect();
                if (dropY < rect.top + rect.height / 2) {
                    insertIndex = i;
                    break;
                }
            }

            blocks.splice(insertIndex, 0, draggedBlock);
            saveState();
        };

        const openSettings = (block) => {
            tempBlock.value = JSON.parse(JSON.stringify(block));
            editingBlock.value = tempBlock.value;
            if (tempBlock.value.type === 'RSS') {
                feedsText.value = tempBlock.value.feeds ? tempBlock.value.feeds.join('\n') : '';
            } else if (tempBlock.value.type === 'Bookmarks') {
                bookmarksText.value = tempBlock.value.bookmarks ? tempBlock.value.bookmarks.map(b => b.name ? `${b.name}####${b.url}` : b.url).join('\n') : '';
            }
        };

        const saveSettings = () => {
            if (editingBlock.value) {
                const blockIndex = state.columns.flatMap(c => c.blocks).findIndex(b => b.id === editingBlock.value.id);
                if (blockIndex !== -1) {
                    const column = state.columns.find(c => c.blocks.some(b => b.id === editingBlock.value.id));
                    const block = column.blocks.find(b => b.id === editingBlock.value.id);
                    if (editingBlock.value.type === 'RSS') {
                        editingBlock.value.feeds = feedsText.value.split('\n').filter(url => url.trim());
                        editingBlock.value.contentLimit = parseInt(editingBlock.value.contentLimit, 10) || 0;
                        delete editingBlock.value.bookmarks;
                    } else if (editingBlock.value.type === 'Bookmarks') {
                        editingBlock.value.bookmarks = bookmarksText.value.split('\n').filter(line => line.trim()).map(line => {
                            const parts = line.split('####');
                            if (parts.length === 2) {
                                return { name: parts[0].trim(), url: parts[1].trim() };
                            } else {
                                return { name: '', url: parts[0].trim() };
                            }
                        });
                        delete editingBlock.value.feeds;
                        delete editingBlock.value.contentLimit;
                    }
                    Object.assign(block, editingBlock.value);
                    saveState();
                    updateFeeds();
                }
                editingBlock.value = null;
            }
        };

        const cancelSettings = () => {
            editingBlock.value = null;
        };

        const openGlobalSettings = () => {
            tempGlobalSettings.value = JSON.parse(JSON.stringify(state.globalSettings));
            showGlobalSettings.value = true;
        };

        const saveGlobalSettings = () => {
            state.globalSettings = { ...tempGlobalSettings.value };
            applyStyles();
            saveState();
            showGlobalSettings.value = false;
        };

        const cancelGlobalSettings = () => {
            showGlobalSettings.value = false;
        };

        const applyStyles = () => {
            const root = document.documentElement;
            root.style.setProperty('--app-background-color', state.globalSettings.appBackgroundColor);
            root.style.setProperty('--block-background-color', state.globalSettings.blockBackgroundColor);
            root.style.setProperty('--block-gradient-background-color', state.globalSettings.blockGradientBackgroundColor);
            root.style.setProperty('--block-border-color', state.globalSettings.blockBorderColor);
            root.style.setProperty('--block-name-color', state.globalSettings.blockNameColor);
            root.style.setProperty('--rss-header-color', state.globalSettings.rssHeaderColor);
            root.style.setProperty('--rss-text-color', state.globalSettings.rssTextColor);
            root.style.setProperty('--button-background-color', state.globalSettings.buttonBackgroundColor);
            root.style.setProperty('--button-text-color', state.globalSettings.buttonTextColor);

            root.style.setProperty('--rssblock-header-font-size', state.globalSettings.rssblockHeaderFontSize + 'px');
            root.style.setProperty('--rssblock-description-font-size', state.globalSettings.rssblockDescriptionFontSize + 'px');

        };

        const openExportSettings = () => {
            showExport.value = true;
        };

        const copyToClipboard = () => {
            navigator.clipboard.writeText(exportJson.value);
            alert('Settings copied to clipboard');
        };

        const openImportSettings = () => {
            showImport.value = true;
        };

        const importSettings = () => {
            try {
                const parsed = JSON.parse(importJson.value);
                state.columns = parsed.columns;
                state.globalSettings = parsed.globalSettings;
                state.nextColumnId = parsed.nextColumnId;
                state.nextBlockId = parsed.nextBlockId;
                saveState();
                applyStyles();
                showImport.value = false;
            } catch (error) {
                alert('Invalid JSON');
                console.log('Import error:', error);
            }
        };

        const updateFeeds = () => {
            rssService.updateFeeds(state);
        };

        const getBlockRssItems = (block) => rssService.getBlockRssItems(block, state);


        // Setup automatic RSS updates
        const setupFeedUpdateInterval = () => {
            if (updateInterval) {
                clearInterval(updateInterval); // Clear existing interval
            }
            const intervalMs = state.globalSettings.updateFrequency * 60 * 1000; // Convert minutes to milliseconds
            updateInterval = setInterval(() => {
                //console.log('Auto-updating RSS feeds at:', new Date().toISOString()); // Debug log
                updateFeeds();
            }, intervalMs);
        };

        onMounted(() => {
            loadState();
            applyStyles();
            updateFeeds(); // Initial fetch
            setupFeedUpdateInterval(); // Start auto-updates
        });

        onUnmounted(() => {
            if (updateInterval) {
                clearInterval(updateInterval); // Cleanup on unmount
            }
        });

        // Watch for changes to updateFrequency and adjust the interval
        watch(() => state.globalSettings.updateFrequency, (newValue, oldValue) => {
            console.log(`Update frequency changed from ${oldValue} to ${newValue} minutes`);
            setupFeedUpdateInterval(); // Reset interval with new frequency
        });

        return {
            state,
            editingBlock,
            feedsText,
            bookmarksText,
            showGlobalSettings,
            tempGlobalSettings,
            showExport,
            showImport,
            importJson,
            exportJson,
            addColumn,
            addBlockToColumn,
            deleteBlock,
            onDragStart,
            onDragEnd,
            onDrop,
            openSettings,
            saveSettings,
            cancelSettings,
            openGlobalSettings,
            saveGlobalSettings,
            cancelGlobalSettings,
            openExportSettings,
            copyToClipboard,
            openImportSettings,
            importSettings,
            getBlockRssItems
        };
    }
});

// Register components
app.component('bookmark-block', bookmarkBlock);
app.component('rss-block', rssBlock);
app.component('block-settings-modal', blockSettingsModal);
app.component('global-settings-modal', globalSettingsModal);
app.component('export-settings-modal', exportSettingsModal);
app.component('import-settings-modal', importSettingsModal);

app.mount('#app');