import { xmlFeedToJSONFeed } from './xmlFeedToJSONFeed.ts';
import { JSONFeed } from './feedTypes.ts';

export async function getFeed(url: string) {
    const req: any = await fetch(url).catch(() => {
        console.log("Error fetching feed:\n" + url);
    }); // 99% of time in this function is spent running fetch()

    const feed: string = await req.text();

    // if RSS or Atom, convert to JSON Feed, else grab the json feed
    if (feed.includes('<rss') || feed.includes('<feed')) {
        const JSONFeed: JSONFeed = await xmlFeedToJSONFeed(feed);
        return JSONFeed;
    } else {
        return await req.json();
    }
}