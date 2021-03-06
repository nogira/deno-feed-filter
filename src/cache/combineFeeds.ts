import { JSONFeed, JSONFeedItem } from '../feed/feedTypes.ts';

export async function combineFeeds(oldFeed: JSONFeed, newFeed: JSONFeed): Promise<JSONFeed> {
    /* remove if same id as cached item to prevent duplicates when 
    these items are appended to array of old items */
    const oldItems: JSONFeedItem[] = oldFeed.items;
    const oldItemIDs: string[] = oldItems.map(item => item.id);
    let newItems: JSONFeedItem[] = newFeed.items;
    // filter out newItems that are already in oldItems
    newItems = newItems.filter(item => ! oldItemIDs.includes(item.id));

    // join newItems and oldItems
    const items: JSONFeedItem[] = [...oldItems, ...newItems]
    // console.log(items.length);

    // sort: newest first, oldest last
    // converted dates to unix timestamps to allow sorting by date
    items.sort((a: any, b: any) =>  Date.parse(b.date_published) - Date.parse(a.date_published));

    /* CHECK IF ITEMS > 100, IF SO DELETE THE OLDEST */
    if (items.length > 100) {
        const numToDelete: number = items.length - 100;
        // since already sorted by newsest to oldest, remove last x items 
        // (oldest items over 100)
        items.splice(100, numToDelete);
    }

    // if filtered to one hundred items, use that, else use items
    const returnFeed: JSONFeed = {...newFeed};
    returnFeed.items = items;

    return returnFeed;
}