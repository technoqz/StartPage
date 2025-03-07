const rssBlock = {
   props: ['items', 'contentLimit'],
   setup(props) {
      const truncate = (text, limit) => {
         if (text && text.length > limit) {
            return text.substring(0, limit) + '...';
         }
         return text;
      };
      return { truncate };
   },
   template: `
     <div>
       <p v-if="!items.length">No RSS items available.</p>
       <div v-for="item in items" :key="item.link">
         <a :href="item.link" target="_blank">{{ item.title }}</a>
         <p class="block-item-description" v-if="contentLimit > 0">
           {{ truncate(item.description, contentLimit) }}
         </p>
       </div>
     </div>
   `
};