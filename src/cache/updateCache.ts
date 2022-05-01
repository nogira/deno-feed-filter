import { combineFeeds } from './combineFeeds.ts';
import { JSONFeed } from '../feed/feedTypes.ts';

export async function updateCache(feed: JSONFeed, cacheInfo: any) {
    let returnFeed: JSONFeed = feed;

    const cacheID: string = cacheInfo.id;
    const cachePath = `./feed_cache/${cacheID}.json`

    // if cache is available, add items to cache, otherwise create cache
    if (cacheInfo.isCached) {
        const cache: string = await Deno.readTextFile(cachePath);
        const oldFeed: JSONFeed = JSON.parse(cache);
        returnFeed = await combineFeeds(oldFeed, feed);
    } else {
        // cache not available so nothing to do except save feed to cache
    }
    // save feed to cache
    await Deno.writeTextFile(cachePath, JSON.stringify(returnFeed));
    return returnFeed;
}