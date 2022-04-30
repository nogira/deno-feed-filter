import { filter } from './filter.js';
import { getFeed } from './getFeed.js';
import { assert } from 'https://deno.land/std/testing/asserts.ts';

Deno.test("filter() :: test filter of youtube feed with no filters", async () => {
    const url = "https://www.youtube.com/feeds/videos.xml?channel_id=UC5WjFrtBdufl6CZojX3D8dQ";
    const feed = await getFeed(url);
    const filteredFeed = await filter(feed, {});
    assert(feed.items = filteredFeed.items);
});