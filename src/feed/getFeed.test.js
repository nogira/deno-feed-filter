import { getFeed } from './getFeed.js';
import { assert } from 'https://deno.land/std/testing/asserts.ts';

// youtube

Deno.test("getFeed() :: test youtube feed", async () => {
    const url = "https://www.youtube.com/feeds/videos.xml?channel_id=UC5WjFrtBdufl6CZojX3D8dQ";
    const feed = await getFeed(url);
    console.log(feed);
    assert(feed.items.length == 15)
});
