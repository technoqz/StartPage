const rssBlock = {
   props: ['items', 'contentLimit'],
   setup(props) {
      const truncate = (text, limit) => {
         if (text && text.length > limit) {
            return text.substring(0, limit) + '...';
         }
         return text;
      };

      // Input "Sat, 08 Mar 2025 07:26:49 GMT"  -> Output: "08.03.25 07:26"
      function convertDateFormat(dateString) {
         // Create Date object from the input string
         const date = new Date(dateString);

         // Extract components
         const day = String(date.getUTCDate()).padStart(2, '0');
         const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // +1 because months are 0-based
         const year = String(date.getUTCFullYear()).slice(-2);
         const hours = String(date.getUTCHours()).padStart(2, '0');
         const minutes = String(date.getUTCMinutes()).padStart(2, '0');

         // Return formatted string
         return `${day}.${month}.${year} ${hours}:${minutes}`;
      }

      return { truncate, convertDateFormat };
   },
   template: `
     <div class="rssblock">
       <p v-if="!items.length">No RSS items available.</p>
       <div v-for="item in items" :key="item.link">
         <a class="rssblock-item-title" :href="item.link" target="_blank">{{ item.title }}  <span class="rssblock-item-date">[{{convertDateFormat(item.pubDate)}}]</span></a>
         
         <p class="rssblock-item-description" v-if="contentLimit > 0">
           {{ truncate(item.description, contentLimit) }}
         </p>
       </div>
     </div>
   `
};