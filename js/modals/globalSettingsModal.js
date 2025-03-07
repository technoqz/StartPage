const globalSettingsModal = {
   props: ['settings'],
   emits: ['save', 'cancel'],
   setup(props, { emit }) {
      return {
         saveGlobalSettings() {
            emit('save');
         },
         cancelGlobalSettings() {
            emit('cancel');
         }
      };
   },
   template: `
     <div>
       <div class="modal-overlay v-cloak" @click="cancelGlobalSettings"></div>
       <div class="modal v-cloak">
         <h2>Global Settings</h2>
         <label>
           RSS Fetch Method:
           <select v-model="settings.rssFetchMethod">
             <option value="api">Via api.rss2json.com</option>
             <option value="direct">Directly via Proxy</option>
           </select>
         </label>
         <label>
           CORS Proxy URL:
           <input v-model="settings.corsProxyUrl" placeholder="e.g., http://yourdomain.com/rss_proxy.php" />
         </label>
         <label>
           Update Frequency (minutes):
           <input type="number" v-model="settings.updateFrequency" min="1" />
         </label>
         <label>
           Max Items per Feed:
           <input type="number" v-model="settings.maxItemsPerFeed" min="1" />
         </label>
         <label>
           App Background Color:
           <input type="color" v-model="settings.appBackgroundColor" />
         </label>
         <label>
           Block Background Color:
           <input type="color" v-model="settings.blockBackgroundColor" />
         </label>
         <label>
           Block Name Color:
           <input type="color" v-model="settings.blockNameColor" />
         </label>
         <label>
           Block Border Color:
           <input type="color" v-model="settings.blockBorderColor" />
         </label>
         <label>
           RSS Header Color:
           <input type="color" v-model="settings.rssHeaderColor" />
         </label>
         <label>
           RSS Text Color:
           <input type="color" v-model="settings.rssTextColor" />
         </label>
         <label>
           Button Background Color:
           <input type="color" v-model="settings.buttonBackgroundColor" />
         </label>
         <label>
           Button Text Color:
           <input type="color" v-model="settings.buttonTextColor" />
         </label>
         <button @click="saveGlobalSettings">Save</button>
         <button @click="cancelGlobalSettings">Cancel</button>
       </div>
     </div>
   `
};