import { toJSONFeed } from './toJSONFeed.js';

export async function getFeed(url, cacheInfo) {
    const r = await fetch(url); // 99% of time in this function is spent running fetch()
    const feed = await r.text();
    // if RSS or Atom, convert to JSON Feed
    if (feed.includes('<rss') || feed.includes('<feed')) {
        const JSONFeed = toJSONFeed(feed, cacheInfo);
        return JSONFeed;
    }
    return feed;
}