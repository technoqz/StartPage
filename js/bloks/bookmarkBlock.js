const bookmarkBlock = {
   props: ['bookmarks'],
   setup(props) {
      const getIcon = (url) => {
         if (url.length > 0) {
            let host = new URL(url).host;
            return `<img class="bookmark-icon" src="https://f.start.me/${host}" alt="" />`;
         }
      };
      return { getIcon };
   },
   template: `
     <div>
       <p v-if="!bookmarks.length">No bookmarks added yet.</p>
       <div v-for="bookmark in bookmarks" :key="bookmark.url">
         <a :href="bookmark.url" target="_blank">
           <span v-html="getIcon(bookmark.url)"></span>
           <span>{{ bookmark.name || bookmark.url }}</span>
         </a>
       </div>
     </div>
   `
};