const blockSettingsModal = {
   props: ['block', 'feedsText', 'bookmarksText'],
   emits: ['save', 'cancel', 'update:feedsText', 'update:bookmarksText'],
   setup(props, { emit }) {
      const updateFeedsText = (event) => {
         emit('update:feedsText', event.target.value);
      };
      const updateBookmarksText = (event) => {
         emit('update:bookmarksText', event.target.value);
      };

      return {
         saveSettings() {
            emit('save');
         },
         cancelSettings() {
            emit('cancel');
         },
         updateFeedsText,
         updateBookmarksText
      };
   },
   template: `
     <div>
       <div class="modal-overlay" @click="cancelSettings"></div>
       <div class="modal modal-settings">
         <h2>Block Settings</h2>
         <label>
           Name:
           <input v-model="block.name" placeholder="Enter block name" />
         </label>
         <label>
           Type:
           <select v-model="block.type">
             <option value="RSS">RSS</option>
             <option value="Bookmarks">Bookmarks</option>
           </select>
         </label>
         <div v-if="block.type === 'RSS'">
           <label>
             Feeds (one per line):
             <textarea :value="feedsText" @input="updateFeedsText" placeholder="Enter RSS feed URLs"></textarea>
           </label>
           <label>
             Content Limit:
             <input type="number" v-model="block.contentLimit" min="0" placeholder="0 for headers only" />
           </label>
         </div>
         <div v-if="block.type === 'Bookmarks'">
           <label>
             Bookmarks (one per line, format: name####url):
             
           </label>
           <textarea :value="bookmarksText" @input="updateBookmarksText" placeholder="Enter bookmark URLs or name####url"></textarea>
         </div>
         <button @click="saveSettings">Save settings</button>
         <button @click="cancelSettings">Cancel</button>
       </div>
     </div>
   `
};