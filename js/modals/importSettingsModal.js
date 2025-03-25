const importSettingsModal = {
   props: ['importJson'],
   emits: ['import', 'close', 'update:importJson'],
   setup(props, { emit }) {
      const updateImportJson = (event) => {
         emit('update:importJson', event.target.value);
      };

      return {
         importSettings() {
            emit('import');
         },
         closeModal() {
            emit('close');
         },
         updateImportJson
      };
   },
   template: `
     <div>
       <div class="modal-overlay" @click="closeModal"></div>
       <div class="modal modal-settings">
         <h2>Import Settings</h2>
         <textarea :value="importJson" @input="updateImportJson" placeholder="Paste JSON here"></textarea>
         <button @click="importSettings">Import</button>
         <button @click="closeModal">Cancel</button>
       </div>
     </div>
   `
};