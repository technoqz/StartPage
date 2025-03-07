const importSettingsModal = {
   props: ['importJson'],
   emits: ['import', 'close'],
   setup(props, { emit }) {
      return {
         importSettings() {
            emit('import');
         },
         closeModal() {
            emit('close');
         }
      };
   },
   template: `
     <div>
       <div class="modal-overlay v-cloak" @click="closeModal"></div>
       <div class="modal v-cloak">
         <h2>Import Settings</h2>
         <textarea v-model="importJson" placeholder="Paste JSON here"></textarea>
         <button @click="importSettings">Import</button>
         <button @click="closeModal">Cancel</button>
       </div>
     </div>
   `
};