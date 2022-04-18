export async function updateCache(feed, cacheID) {
    const fp = `./feed_cache/${cacheID}.json`
    const onlyItems = ! feed.items;
    if (onlyItems) {
        const cache = await Deno.readTextFile(fp);
        const old = JSON.parse(cache);
        const items = [...old.items, ...feed.items]
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
        feed.items = oneHundredItems || items;
    }
    await Deno.writeTextFile(fp, JSON.stringify(feed));
    return feed;
}