import { xmlFeedToJSONFeed } from './xmlFeedToJSONFeed.ts';

export async function getFeed(url) {
    const req = await fetch(url).catch(() => {
        console.log("Error fetching feed:\n" + url);
    }); // 99% of time in this function is spent running fetch()
    const feed = await req.text();

    // if RSS or Atom, convert to JSON Feed, else grab the json feed
    if (feed.includes('<rss') || feed.includes('<feed')) {
        const JSONFeed = xmlFeedToJSONFeed(feed);
        return JSONFeed;
    } else {
        return await req.json();
    }
}