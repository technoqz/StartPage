export default {
    stripHtml(html) {
        let text = html.replace(/(<([^>]+)>)/g, ""); // Remove HTML tags
        text = text.replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x27;/g, "'"); // Common entities

        return text.trim(); // Remove extra whitespace
    },

    async fetchFeedApi(feedUrl) {
        try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.status === 'ok') {
                return data.items.map(item => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    description: this.stripHtml(item.description || '')
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching feed via API:', feedUrl, error);
            return [];
        }
    },

    async fetchFeedDirect(feedUrl, corsProxyUrl) {
        try {
            if (!corsProxyUrl) {
                throw new Error('CORS Proxy URL is not set in Global Settings');
            }
            const proxyUrl = `${corsProxyUrl}?url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            let xmlText = await response.text();
            xmlText = xmlText.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Sanitize control characters
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            if (xmlDoc.querySelector('parsererror')) {
                throw new Error('XML parsing failed after sanitization');
            }

            let items = [];
            if (xmlDoc.querySelector('feed')) {
                // Atom feed (e.g., Reddit)
                items = Array.from(xmlDoc.querySelectorAll('entry')).map(entry => ({
                    title: entry.querySelector('title')?.textContent || '',
                    link: entry.querySelector('link')?.getAttribute('href') || '',
                    pubDate: entry.querySelector('updated')?.textContent || '',
                    description: this.stripHtml(entry.querySelector('content')?.textContent || '')
                }));
            } else {
                // Traditional RSS feed
                items = Array.from(xmlDoc.querySelectorAll('item')).map(item => ({
                    title: item.querySelector('title')?.textContent || '',
                    link: item.querySelector('link')?.textContent || '',
                    pubDate: item.querySelector('pubDate')?.textContent || '',
                    description: this.stripHtml(item.querySelector('description')?.textContent || '')
                }));
            }
            return items;
        } catch (error) {
            console.error('Error fetching feed via proxy:', feedUrl, error);
            return [];
        }
    },

    async updateFeeds(state) {
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

        for (const feedUrl of allFeeds) {
            const feedData = state.rssData[feedUrl];
            if (!feedData || new Date(feedData.lastFetch).getTime() < updateThreshold) {
                const fetchMethod = state.globalSettings.rssFetchMethod === 'api'
                    ? (url) => this.fetchFeedApi(url)
                    : (url) => this.fetchFeedDirect(url, state.globalSettings.corsProxyUrl);

                const items = await fetchMethod(feedUrl);

                if (items && items.length > 0) {
                    state.rssData[feedUrl] = {
                        items: items.slice(0, state.globalSettings.maxItemsPerFeed),
                        lastFetch: now.toISOString()
                    };
                }
            }
        }
    },

    getBlockRssItems(block, state) {
        if (block.type !== 'RSS' || !block.feeds) return [];
        const allItems = block.feeds.flatMap(feedUrl => state.rssData[feedUrl]?.items || []);
        return allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, state.globalSettings.maxItemsPerFeed);
    }
};
