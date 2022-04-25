export async function updateCache(feed, cacheInfo) {

    const cacheID = cacheInfo.id;
    const cachePath = `./feed_cache/${cacheID}.json`

    // if cache is available, add items to cache, otherwise create cache
    if (cacheInfo.isCached) {
        /* remove if same id as cached item to prevent duplicates when 
        these items are appended to array of old items */
        const cache = await Deno.readTextFile(cachePath);
        const oldFeed = JSON.parse(cache);
        const oldItems = oldFeed.items;
        const oldItemIDs = oldItems.map(item => item.id);
        let newItems = feed.items;
        // filter out newItems that are already in oldItems
        newItems.filter(item => ! oldItemIDs.includes(item.id));

        // join newItems and oldItems
        const items = [...oldItems, ...newItems]

        /* CHECK IF ITEMS > 100, IF SO DELETE THE OLDEST */
        let oneHundredItems;
        if (items.length > 100) {
            const dates = [];
            for (const item of items) {
                dates.push(item.date_published);
            }
            dates.sort((a, b) => b - a); // newest first
            const numToDelete = dates.length - 100;
            // remove oldest from dates and pass removed to oldestDates
            const oldestDates = dates.splice(100, numToDelete);
            oneHundredItems = [];
            for (const item of items) {
                const date = item.date_published;
                const dateNotInOldest = oldestDates.indexOf(date) === -1;
                if (dateNotInOldest) {
                    oneHundredItems.push(item);
                } else {
                    const i = oldestDates.indexOf(date);
                    delete oldestDates[i];
                }
            }
        }
        // if filtered to one hundred items, use that, else use items
        feed.items = oneHundredItems || items;
    } else {
        // cache not available so nothing to do except save feed to cache
    }
    // save feed to cache
    await Deno.writeTextFile(cachePath, JSON.stringify(feed));
    return feed;
}