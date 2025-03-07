const exportSettingsModal = {
   props: ['exportJson'],
   emits: ['close', 'copy'],
   setup(props, { emit }) {
      return {
         copyToClipboard() {
            emit('copy');
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
         <h2>Export Settings</h2>
         <textarea readonly :value="exportJson"></textarea>
         <button @click="copyToClipboard">Copy to clipboard</button>
         <button @click="closeModal">Close</button>
       </div>
     </div>
   `
};