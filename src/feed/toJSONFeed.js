import { XMLParser } from 'https://cdn.skypack.dev/fast-xml-parser'

import { xml2jsNestedKeySelector as s } from './xml2jsNestedKeySelector.js';
import { cleanObject } from '../cleanObject.js';

export async function toJSONFeed(feed, cacheInfo) {
    // Step 1: Convert XML to JSON
    const options = {
        preserveOrder: false,
        alwaysCreateTextNode: true,
        trimValues: true,
        ignoreAttributes: false,
        removeNSPrefix: false,
    }
    const parser = new XMLParser(options);
    const obj = parser.parse(feed);
    const feedJSON = obj.rss?.channel || obj.feed;
    // Step 2: Convert JSON to JSON Feed
    // sort links
    const links = feedJSON?.link;
    let feedLink = null;
    let homeLink = null;
    if (JSON.stringify(links)[0] === "[") {
        for (const link of links) {
            if (link["@_rel"] === "self") {
                feedLink = link["@_href"];
            }
            if (link["@_rel"] === "alternate") {
                homeLink = link["@_href"];
            }
        }
    }
    let JSONFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: s(feedJSON,"title"),
        home_page_url: homeLink || feedJSON?.link?.["@_href"] || s(feedJSON,"link"),
        feed_url: feedLink,
        description: s(feedJSON,"description") || s(feedJSON,"summary") || s(feedJSON,"content"),
        user_comment: "",
        next_url: "",
        icon: "",
        favicon: "",
        authors: [{name: "", url: "", avatar: ""}],
        language: "en",
        expired: "",
        hubs: [{type: "", url: ""}],
        items: await (async () => {
            let itemsIDCache;
            if (cacheInfo.isCached) {
                const cache = await Deno.readTextFile(`./feed_cache/${cacheInfo.id}.json`);
                const itemsCache = JSON.parse(cache).items;
                itemsIDCache = itemsCache.map(item => item.id);
            }
            
            const items = feedJSON.item || feedJSON.entry;
            const JSONFeedItems = [];
            for (const item of items) {
                /* was going to insert the filter here instead of running filter
                after, but the computation is so small compared to fetch so idc */
                
                // skip video items with 0 views, as it means the video hasn't been posted yet
                const views = item?.["media:group"]?.["media:community"]?.["media:statistics"]?.["@_views"];
                if (views === "0") { continue };

                /* skip if same id as cached item to prevent duplicates when 
                these items are appended to array of old items */
                const id = s(item,"guid") || s(item,"id");
                if (itemsIDCache?.includes(item.id)) { continue };

                JSONFeedItems.push({
                    id: id,
                    url: item?.link?.["@_href"] || s(item,"link") || item?.link,
                    external_url: "",
                    title: s(item,"title"),
                    content_text: "",
                    content_html: s(item,"description") || s(item,"summary") || s(item,"content") || s(item,"media:group.media:description") || s(item,"content:encoded") || "",
                    summary: "",
                    image: item?.["media:group"]?.["media:thumbnail"]?.["@_url"],
                    banner_image: "",
                    date_published: s(item,"pubDate") || s(item,"published"),
                    date_modified: s(item,"lastBuildDate") || s(item,"updated"),
                    authors: (() => {
                        const itemAuthor = s(item,"author.name") || s(item,"dc:creator") || null;
                        if (itemAuthor) {
                            return [{
                                name: itemAuthor,
                                url: "",
                                avatar: "",
                            }];
                        } else {
                            const itemAuthors = item?.author || item?.["dc:creator"];
                            if (!itemAuthors) {
                                return [{
                                    name: "",
                                    url: "",
                                    avatar: "",
                                }];
                            }
                            const authors = [];
                            for (const author of itemAuthors) {
                                authors.push({
                                    name:author?.name?.["#text"] || author?.["#text"],
                                    url: "",
                                    avatar: "",
                                });
                            }
                            return authors;
                        }
                    })(),
                    tags: [""],
                    language: "en",
                    attachments: [{
                        // adding an image here w/ mime type doesn't cause it to be displayed
                        url: "",
                        mime_type: "",
                        title: "",
                        size_in_bytes: 0,
                        duration_in_seconds: 0,
                    }],
                    views: views,
                });
            };
            return JSONFeedItems;
        })(),
    }
    // Remove keys with null values
    JSONFeed = cleanObject(JSONFeed);
    // add back content_html in case it just got deleted (some youtube videos 
    // have no description)
    for (const i in JSONFeed.items) {
        const item = JSONFeed.items[i];
        if (!item.content_html) {
            JSONFeed.items[i].content_html = "";
        }
    }
    return JSONFeed;
}