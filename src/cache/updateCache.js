import { combineFeeds } from './combineFeeds.js';

export async function updateCache(feed, cacheInfo) {
    let returnFeed = feed;

    const cacheID = cacheInfo.id;
    const cachePath = `./feed_cache/${cacheID}.json`

    // if cache is available, add items to cache, otherwise create cache
    if (cacheInfo.isCached) {
        const cache = await Deno.readTextFile(cachePath);
        const oldFeed = JSON.parse(cache);
        returnFeed = await combineFeeds(oldFeed, feed);
    } else {
        // cache not available so nothing to do except save feed to cache
    }
    // save feed to cache
    await Deno.writeTextFile(cachePath, JSON.stringify(returnFeed));
    return returnFeed;
}