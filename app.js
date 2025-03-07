const { createApp, ref, reactive, onMounted, computed } = Vue;

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
            updateFrequency: 30,
            maxItemsPerFeed: 30,
            appBackgroundColor: '#ffffff',
            blockBackgroundColor: '#f0f0f0',
            blockNameColor: '#000000',
            blockBorderColor: '#cccccc',
            rssHeaderColor: '#000000',
            rssTextColor: '#333333',
            buttonBackgroundColor: '#f0f0f0',
            buttonTextColor: '#000000'
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
         const savedState = localStorage.getItem('appState');
         if (savedState) {
            const parsed = JSON.parse(savedState);
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
         localStorage.setItem('appState', JSON.stringify(state));
      };

      const addColumn = () => {
         const newColumn = {
            id: state.nextColumnId,
            blocks: []
         };
         state.columns.push(newColumn);
         state.nextColumnId++;
         addBlockToColumn(newColumn); // Automatically add a block to the new column
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
         root.style.setProperty('--block-border-color', state.globalSettings.blockBorderColor);
         root.style.setProperty('--block-name-color', state.globalSettings.blockNameColor);
         root.style.setProperty('--rss-header-color', state.globalSettings.rssHeaderColor);
         root.style.setProperty('--rss-text-color', state.globalSettings.rssTextColor);
         root.style.setProperty('--button-background-color', state.globalSettings.buttonBackgroundColor);
         root.style.setProperty('--button-text-color', state.globalSettings.buttonTextColor);
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
         }
      };

      const stripHtml = (html) => {
         const tmp = document.createElement('div');
         tmp.innerHTML = html;
         return tmp.textContent || tmp.innerText || '';
      };

      const fetchFeedApi = async (feedUrl) => {
         try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.status === 'ok') {
               return data.items.map(item => ({
                  title: item.title,
                  link: item.link,
                  pubDate: item.pubDate,
                  description: stripHtml(item.description || '')
               }));
            }
            return [];
         } catch (error) {
            console.error('Error fetching feed via API:', feedUrl, error);
            return [];
         }
      };

      const fetchFeedDirect2 = async (feedUrl) => {
         try {
            if (!state.globalSettings.corsProxyUrl) {
               throw new Error('CORS Proxy URL is not set in Global Settings');
            }
            const proxyUrl = `${state.globalSettings.corsProxyUrl}?url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(proxyUrl, {
               headers: { 'Accept': 'text/plain' } // Force text/plain
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const xmlText = await response.text();
            console.log('Raw XML Response:', xmlText); // Debug
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => ({
               title: item.querySelector('title')?.textContent || '',
               link: item.querySelector('link')?.textContent || '',
               pubDate: item.querySelector('pubDate')?.textContent || '',
               description: stripHtml(item.querySelector('description')?.textContent || '')
            }));
            return items;
         } catch (error) {
            console.error('Error fetching feed via proxy:', feedUrl, error);
            alert(`Failed to fetch ${feedUrl}: ${error.message}. Please check the CORS Proxy URL in Global Settings.`);
            return [];
         }
      };

      const fetchFeedDirect_html = async (feedUrl) => {
         try {
            const proxyUrl = `${state.globalSettings.corsProxyUrl}?url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const xmlText = await response.text();
            //console.log('Raw XML:', xmlText); // Debug

            // Parse as HTML (more lenient)
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(xmlText, 'text/html');

            // Extract items using querySelector on the HTML DOM
            const items = Array.from(htmlDoc.querySelectorAll('item')).map(item => ({
               title: item.querySelector('title')?.textContent || '',
               link: item.querySelector('link')?.textContent || '',
               pubDate: item.querySelector('pubDate')?.textContent || '',
               description: item.querySelector('description')?.textContent || ''
            }));

            if (items.length === 0) {
               console.warn('No items found; feed may still be malformed.');
            }

            return items;
         } catch (error) {
            console.error('Error fetching or parsing feed:', feedUrl, error);
            alert(`Failed to fetch ${feedUrl}: ${error.message}. Check your CORS proxy settings.`);
            return [];
         }
      };

      const fetchFeedDirect = async (feedUrl) => {
         try {
            if (!state.globalSettings.corsProxyUrl) {
               throw new Error('CORS Proxy URL is not set in Global Settings');
            }
            const proxyUrl = `${state.globalSettings.corsProxyUrl}?url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            let xmlText = await response.text();
            xmlText = xmlText.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            if (xmlDoc.querySelector('parsererror')) {
               throw new Error('XML parsing failed after sanitization');
            }

            const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => ({
               title: item.querySelector('title')?.textContent || '',
               link: item.querySelector('link')?.textContent || '',
               pubDate: item.querySelector('pubDate')?.textContent || '',
               description: stripHtml(item.querySelector('description')?.textContent || '')
            }));

            return items;
         } catch (error) {
            console.error('Error fetching feed via proxy:', feedUrl, error);
            alert(`Failed to fetch ${feedUrl}: ${error.message}. Please check the CORS Proxy URL in Global Settings.`);
            return [];
         }
      };

      const updateFeeds = async () => {
         const allFeeds = new Set();
         state.columns.forEach(column => {
            column.blocks.forEach(block => {
               if (block.type === 'RSS' && block.feeds) {
                  block.feeds.forEach(feed => allFeeds.add(feed));
               }
            });
         });

         const now = new Date();
         const updateThreshold = now.getTime() - state.globalSettings.updateFrequency * 60 * 1000;

         const fetchMethod = state.globalSettings.rssFetchMethod === 'api' ? fetchFeedApi : fetchFeedDirect;

         for (const feedUrl of allFeeds) {
            const feedData = state.rssData[feedUrl];
            if (!feedData || new Date(feedData.lastFetch).getTime() < updateThreshold) {
               const items = await fetchMethod(feedUrl);
               state.rssData[feedUrl] = {
                  items: items.slice(0, state.globalSettings.maxItemsPerFeed),
                  lastFetch: now.toISOString()
               };
            }
         }
         saveState();
      };

      const getBlockRssItems = (block) => {
         if (block.type !== 'RSS' || !block.feeds) return [];
         const allItems = block.feeds.flatMap(feedUrl => state.rssData[feedUrl]?.items || []);
         return allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, state.globalSettings.maxItemsPerFeed);
      };

      const truncate = (text, limit) => {
         if (text && text.length > limit) {
            return text.substring(0, limit) + '...';
         }
         return text;
      };

      onMounted(() => {
         loadState();
         applyStyles();
         updateFeeds();
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
         getBlockRssItems,
         truncate
      };
   }
});

app.mount('#app');