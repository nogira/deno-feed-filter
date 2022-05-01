import { cacheIndex } from '../../app.ts';

export async function getCacheInfo(reqURL: string) {
    const cacheID = reqURL.replace(/^.*?0\/|\W/g, "");
    const urlInCacheIndex = cacheIndex[reqURL];

    // if url IS in cache index, make sure it's also in file cache
    let urlHasCacheFile: boolean = false;
    if (urlInCacheIndex) {
        await Deno.stat(`./feed_cache/${cacheID}.json`)
            .then(() => {urlHasCacheFile = true})
            .catch(() => {urlHasCacheFile = false});
    }

    const urlNotCached = (! urlInCacheIndex) && (! urlHasCacheFile);
    if (urlNotCached) {
        cacheIndex[reqURL] = {
            lastRequest: Date.now(),
            id: cacheID,
        }
        await Deno.writeTextFile("./feed_cache/_index.json", JSON.stringify(cacheIndex));
        return { isCached: false, isRecentlyCached: false, id: cacheID };
    }
    const timeOfLastRequest = cacheIndex[reqURL].lastRequest;
    const time1hrAgo = Date.now() - 3600000; // (60 * 60 * 1000) is 1hr
    if (timeOfLastRequest < time1hrAgo) {
        cacheIndex[reqURL].lastRequest = Date.now(); // update lastRequest time
        await Deno.writeTextFile("./feed_cache/_index.json", JSON.stringify(cacheIndex));
        return { isCached: true, isRecentlyCached: false, id: cacheID };
    }
    return { isCached: true,  isRecentlyCached: true, id: cacheID };
}