/*

deno test --allow-net src/cache/combineFeeds.test.ts

*/

import { getFeed } from '../feed/getFeed.ts';
import { combineFeeds } from './combineFeeds.ts';
import { assert } from 'https://deno.land/std/testing/asserts.ts';

const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

Deno.test("combineFeeds() :: basic feed combiner", async () => {
    const url = "https://www.youtube.com/feeds/videos.xml?channel_id=UC5WjFrtBdufl6CZojX3D8dQ";
    const feed = await getFeed(url);
    // using full feed to imitate new feed. deep clone to prevent mutation
    const newFeed: any = JSON.parse(JSON.stringify(feed));
    // remove first 5 items of feed
    feed.items.splice(0, 5); // using truncated feed to imitate old feed

    const updatedFeed = await combineFeeds(feed, newFeed);

    const newFeedIds: string[] = newFeed.items.map((item: any) => item.id);
    const updatedFeedIds: string[] = updatedFeed.items.map(item => item.id);
    for (const i in newFeedIds) {
        assert(newFeedIds[i] === updatedFeedIds[i]);
    }
});

Deno.test("combineFeeds() :: >100 items combined feed combiner", async () => {
    const url = "https://www.youtube.com/feeds/videos.xml?channel_id=UC5WjFrtBdufl6CZojX3D8dQ";
    // gets 15 item feed
    const feed = await getFeed(url);

    // to check oldest and newest items are removed
    const newestDatePre = Date.parse(feed.items[0].date_published);
    // console.log(feed.items[0].date_published);
    // console.log("NEWEST-pre: ", newestDatePre, feed.items[0].id);

    const newFeed = clone(feed);
    // remove first 5 items of feed, and replace newFeed's items with these 5
    newFeed.items = feed.items.splice(0, 5);

    console.log("newFeed length: ", newFeed.items.length);
    console.log("feed length: ", feed.items.length);

    // 10x the feed items to get 100 items in feed and 50 items in newFeed
    const newFeedItems = clone(newFeed.items);
    const feedItems = clone(feed.items);
    for (const i of [1,2,3,4,5,6,7,8,9]) {
        newFeed.items.push(...clone(newFeedItems));
        feed.items.push(...clone(feedItems));
    }
    console.log("newFeed length post-10x: ", newFeed.items.length);

    const updatedFeed = await combineFeeds(feed, newFeed);
    console.log("updatedFeed length: ", updatedFeed.items.length);

    const newestUpdatedItem = updatedFeed.items[0];
    const date = newestUpdatedItem.date_published;
    let newestDatePost;
    if (date) {
        newestDatePost = Date.parse(date);
    }
    
    // console.log("NEWEST-post: ", newestDatePost, newestUpdatedItem.id);

    assert(newFeed.items !== updatedFeed.items);
    assert(newestDatePre == newestDatePost);
    assert(updatedFeed.items.length <= 100);
});