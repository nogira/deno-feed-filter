export async function filter(feed, filters) {
    const items = feed.items
    // simple way to pass filter key such as "author" to get an item's author
    const filterKeyToItemKey = {
        title: (item) => item.title,
        desc: (item) => item.content_html,
        author: (item) => item.authors[0]?.name,
    };
    const filteredItems = [];
    loop1:
    for (const item of items) {
        // loop2:
        for (const key in filters) {
            const val = filters[key]
            if (key.endsWith("excl")) {
                const regex = new RegExp(val, "i");
                const string = filterKeyToItemKey[key.split("_")[0]](item);
                // item should EXCLUDE everything in the filter
                const itemContainsSomethinginFilter = regex.test(string);
                if (itemContainsSomethinginFilter) {
                    // skip adding item to filteredItems
                    continue loop1;
                }
            } else if (key.endsWith("incl")) {
                const regex = new RegExp(val, "i");
                const string = filterKeyToItemKey[key.split("_")[0]](item);
                // item should INCLUDE something in the filter
                const itemContainsSomethinginFilter = regex.test(string);
                if (! itemContainsSomethinginFilter) {
                    // skip adding item to filteredItems
                    continue loop1;
                }
            } else if (key == "min_views") {
                // item should have at least the min views
                if (item.views < val) {
                    // skip adding item to filteredItems
                    continue loop1;
                }
            } else {
                console.log("Unknown filter key: " + key);
            }
        }
        // skip video items with 0 views, as it means the video hasn't been 
        // posted yet
        if (item.views === 0) { continue loop1};

        // if item has passsed all filters, add it to the filteredItems
        filteredItems.push(item);
    }
    feed.items = filteredItems;
    return feed
}