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
       <div class="modal-overlay" @click="cancelGlobalSettings"></div>
       <div class="modal">
         <h2>Global Settings</h2>
         <div style="display:grid;row-gap: 5px;grid-template-columns: 1fr 1fr;">
            <label>
               RSS Fetch Method:

            </label>
            <select v-model="settings.rssFetchMethod">
               <option value="api">Via api.rss2json.com</option>
               <option value="direct">Directly via Proxy</option>
            </select>
            <label>CORS Proxy URL:</label>
            <input v-model="settings.corsProxyUrl" placeholder="e.g., http://yourdomain.com/rss_proxy.php" />
            
            <label>
            Update Frequency (minutes):
            </label>
            <input type="number" v-model="settings.updateFrequency" min="1" />
            <label>
            Max Items per Feed:
            
            </label>
            <input type="number" v-model="settings.maxItemsPerFeed" min="1" />
            <label>
            RSS header font-size:
            
            </label>
            <input type="number" v-model="settings.rssblockHeaderFontSize" min="1" />
            <label>
            RSS description font-size:
            
            </label>
            <input type="number" v-model="settings.rssblockDescriptionFontSize" min="1" />
            <label>
            App Background Color:
            
            </label>
            <input type="color" v-model="settings.appBackgroundColor" />
            <label>
            Block Background Color:
            
            </label>
            <input type="color" v-model="settings.blockBackgroundColor" />
            
            <label>
            Block Background gradient Color:
            
            </label>
            <input type="color" v-model="settings.blockGradientBackgroundColor" />

            <label>
            Block Name Color:
            
            </label>
            <input type="color" v-model="settings.blockNameColor" />
            <label>
            Block Border Color:
            
            </label>
            <input type="color" v-model="settings.blockBorderColor" />
            <label>
            RSS Header Color:
            
            </label>
            <input type="color" v-model="settings.rssHeaderColor" />
            <label>
            RSS Text Color:
            
            </label>
            <input type="color" v-model="settings.rssTextColor" />
            <label>
            Button Background Color:
            
            </label>
            <input type="color" v-model="settings.buttonBackgroundColor" />
            <label>
            Button Text Color:
            
            </label>
            <input type="color" v-model="settings.buttonTextColor" />
            <button @click="saveGlobalSettings">Save</button>
            <button @click="cancelGlobalSettings">Cancel</button>
         </div>
       </div>
     </div>
   `
};