import { JSONFeed, JSONFeedItem } from './feedTypes.ts';

export async function filter(feed: JSONFeed, filters: any) {
    /* was going to insert the filter here instead of running filter
    after, but the computation is so small compared to fetch so idc */

    const items: JSONFeedItem[] = feed.items
    // simple way to pass filter key such as "author" to get an item's author
    const filterKeyToItemKey: any = {
        title: (item: JSONFeedItem) => item.title,
        desc: (item: JSONFeedItem) => item.content_html,
        author: (item: JSONFeedItem) => item.authors?.[0]?.name,
    };
    const filteredItems: JSONFeedItem[] = [];
    loop1:
    for (const item of items) {

        /*
        REMEMBER FILTERS WITH NUMBER VALS ARE STRINGS, SO CONVERT TO NUMBER
        */

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
                const itemViews: any = item?._views;
                if (itemViews < Number(val)) {
                    // skip adding item to filteredItems
                    continue loop1;
                }
            } else if (key == "no_self_retweets" && val == "true") {
                /* remove retweets of mid-thread tweets from threads that have 
                been posted/retweeted before */
                const threadID = item._threadId;
                const notFirstTweetinThread = threadID !== item.id;
                if (threadID && notFirstTweetinThread) {
                    // if main tweet (threadID) is already in feed, discard the 
                    // tweet as its a retweet of a mid-thread tweet i've already
                    // read
                    const ids = items.map(item => item.id);
                    if (ids.includes(threadID)) {
                        continue loop1;
                    }
                }
            } else {
                console.log("Unknown filter key: " + key);
            }
        }
        // skip video items with 0 views, as it means the video hasn't been 
        // posted yet
        if (item._views === 0) { continue loop1};

        // if item has passsed all filters, add it to the filteredItems
        filteredItems.push(item);
    }
    feed.items = filteredItems;
    return feed
}