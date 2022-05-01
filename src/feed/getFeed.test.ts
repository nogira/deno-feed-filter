/*

deno test --allow-net src/feed/getFeed.test.js

*/

import { getFeed } from './getFeed.ts';
import { assert } from 'https://deno.land/std/testing/asserts.ts';

// youtube

Deno.test("getFeed() :: test youtube feed", async () => {
    const url = "https://www.youtube.com/feeds/videos.xml?channel_id=UC5WjFrtBdufl6CZojX3D8dQ";
    const feed = await getFeed(url);
    console.log(feed.items.length);
    assert(feed.items.length == 15)
});


// fake feed

Deno.test("getFeed() :: test fake feed", async () => {
    const url = "https://lorem-rss.herokuapp.com/feed";
    const feed = await getFeed(url);
    // console.log(feed.items.length);
    console.log(feed)
    // console.log(feed.items[0])
    assert(feed.items.length == 10)
});