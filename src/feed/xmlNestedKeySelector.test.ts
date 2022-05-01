/*

deno test --allow-net src/feed/xmlNestedKeySelector.test.js

*/

import { xmlNestedKeySelector } from "./xmlNestedKeySelector.ts"
import { assert } from 'https://deno.land/std/testing/asserts.ts';

Deno.test("xmlNestedKeySelector() :: basic test", async () => {
    // const url = "https://lorem-rss.herokuapp.com/feed";
    // const feed = await getFeed(url);
    // console.log(feed.items.length);
    // assert(feed.items.length == 15)

    // ideally operator overload like: item~"thing.thing.thing"

    const s = xmlNestedKeySelector;
    const feedJSON: any = {
        key1: {key2: {key3: {"#text": "10"}}}
    }
    
    //           feedJSON.key1?.key2?.key3?.["#text"]
    const test = s(feedJSON, "key1.key2.key3");

    assert(test === "10");
});
