import { XMLParser } from 'https://cdn.skypack.dev/fast-xml-parser'

import { xml2jsNestedKeySelector as s } from './xml2jsNestedKeySelector.js';
import { cleanObject } from '../cleanObject.js';


/**
 * https://www.jsonfeed.org/version/1.1/
 */
// interface JSONFeed {
//     version: string;
//     title: string;
//     home_page_url?: string;
//     feed_url?: string;
//     description?: string;
//     user_comment?: string;
//     next_url?: string;
//     icon?: string;
//     favicon?: string;
//     authors?: JSONFeedAuthor[];
//     language?: string;
//     expired?: boolean;
//     hubs?: JSONHub[];
//     items: JSONFeedItem[];
// }
// interface JSONFeedAuthor {
//     name?: string;
//     url?: string;
//     avatar?: string;
// }
// interface JSONHub {
//     type: string;
//     url: string;
// }
// interface JSONFeedItem {
//     id: string;
//     url?: string;
//     external_url?: string;
//     title?: string;
//     content_html?: string;
//     content_text?: string;
//     summary?: string;
//     image?: string;
//     banner_image?: string;
//     date_published?: string;
//     date_modified?: string;
//     authors?: JSONFeedAuthor;
//     tags?: string[];
//     language?: string;
//     attachments?: JSONFeedAttachment[];
// }
// interface JSONFeedAttachment {
//     url: string;
//     mime_type: string;
//     title?: string;
//     size_in_bytes?: number;
//     duration_in_seconds?: number;
// }




/* 

change from
let JSONFeed = {
    // etc
}
cleanObject(JSONFeed);

to:
let JSONFeed = {
    // compulsary vars
}
// optional vars

*/



export async function toJSONFeed(feed) {
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
            
            let items = feedJSON.item || feedJSON.entry;
            // if only 1 item, put in array so it's still processed in the loop
            const isArray = items.splice && true;
            if (! isArray) {
                items = [items];
            }
            const JSONFeedItems = [];
            for (const item of items) {

                JSONFeedItems.push({
                    id: s(item,"guid") || s(item,"id"),
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
                    views: Number(item?.["media:group"]?.["media:community"]?.["media:statistics"]?.["@_views"]),
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