import { XMLParser } from 'https://cdn.skypack.dev/fast-xml-parser'
import { xmlNestedKeySelector as s } from './xmlNestedKeySelector.ts';
import { JSONFeed, JSONFeedItem, JSONFeedAuthor } from './feedTypes.ts';

/*

REFERERENCE:

https://www.jsonfeed.org/version/1.1/

https://www.jsonfeed.org/mappingrssandatom/
https://www.w3schools.com/xml/xml_rss.asp#rssref

*/

/**
 * Convert an rss or atom feed to a JSONFeed
 * @param feed - The feed to convert to JSONFeed. Either the url or the html string.
 * @returns 
 */
export async function xmlFeedToJSONFeed(feed: string): Promise<JSONFeed> {

    if (feed.startsWith('http')) {
        feed = await fetch(feed).then(res => res.text());
    }

    // Step 1: Convert XML to JSON

    const xmlOptions = {
        preserveOrder: false,
        alwaysCreateTextNode: true,
        trimValues: true,
        ignoreAttributes: false,
        removeNSPrefix: false,
    }
    const parser = new XMLParser(xmlOptions);
    const obj: any = parser.parse(feed);
    const feedJSON = obj.rss?.channel || obj.feed;

    // Step 2: Convert JSON to JSON Feed
    
    const JSONFeed: JSONFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: s(feedJSON,"title"),
        items: [],
    }
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
    const home_page_url = homeLink || feedJSON?.link?.["@_href"] || s(feedJSON,"link")
    if (home_page_url) {
        JSONFeed.home_page_url = home_page_url;
    }
    if (feedLink) {
        JSONFeed.feed_url = feedLink;
    }

    const description = s(feedJSON,"description") || s(feedJSON,"summary") || s(feedJSON,"content");
    if (description) {
        JSONFeed.description = description;
    }

    // const user_comment = "";
    // if (user_comment) {
    //     JSONFeed.user_comment = user_comment;
    // }

    // const next_url = "";
    // if (next_url) {
    //     JSONFeed.next_url = next_url;
    // }

    // const icon = "";
    // if (icon) {
    //     JSONFeed.icon = icon;
    // }

    // const favicon = "";
    // if (favicon) {
    //     JSONFeed.favicon = favicon;
    // }

    const authors: JSONFeedAuthor[] = getAuthors(JSONFeed);
    if (authors && JSON.stringify(authors) !== "[]") {
        JSONFeed.authors = authors;
    }

    // const language = "";
    // if (language) {
    //     JSONFeed.language = language;
    // }

    // const expired = "";
    // if (expired) {
    //     JSONFeed.expired = expired;
    // }

    // const hubs: JSONHub[] = [];
    // let hubItems: any = feedJSON?.link?.["@_href"];
    // if (! isArray(hubItems)) {
    //     hubItems = [hubItems];
    // }
    // for (const hubItem of hubItems) {
    //     const hub: JSONHub = {
    //         type: "",
    //         url: "",
    //     }
    //     hubs.push(hub);
    // }
    // if (hubs) {
    //     JSONFeed.hubs = hubs;
    // }

    let rawItems = feedJSON.item || feedJSON.entry;
    // if only 1 item, put in array so it's still processed in the loop 
    // (xml passer only puts items in array if >1 item)
    if (! isArray(rawItems)) {
        rawItems = [rawItems];
    }

    for (const rawItem of rawItems) {

        const item: JSONFeedItem = {
            id: s(rawItem,"guid") || s(rawItem,"id"),
        }

        const url = rawItem?.link?.["@_href"] || s(rawItem,"link") || rawItem?.link;
        if (url) {
            item.url = url;
        }
        const external_url = "";
        if (external_url) {
            item.external_url = external_url;
        }
        const title = s(rawItem,"title");
        if (title) {
            item.title = title;
        }

        // TODO: maybe do content_html as default (converting any non-html to 
        // html), but also allow user to specify     🚨🚨   🚨🚨   🚨🚨🚨
        const content_text = "";
        if (content_text) {
            item.content_text = content_text;
        }
        const content_html = s(rawItem,"description") || s(rawItem,"summary") || s(rawItem,"content") || s(rawItem,"media:group.media:description") || s(rawItem,"content:encoded") || "";
        if (content_html) {
            item.content_html = content_html;
        }
        // if content is empty, set as empty string
        if (! content_html && ! content_text) {
            item.content_html = "";
        }

        const summary = s(rawItem,"summary");
        if (summary) {
            item.summary = summary;
        }

        const image = rawItem?.["media:group"]?.["media:thumbnail"]?.["@_url"];
        if (image) {
            item.image = image;
        }

        // const banner_image = "";
        // if (banner_image) {
        //     item.banner_image = banner_image;
        // }

        // TODO: need to get the date parsing right
        // e.g. if date is "Sun, 01 May 2022 06:30:00 GMT"
        //   /[a-zA-z]{3}, \d{2} [a-zA-z]{3} \d{4} \d{2}:\d{2}:\d{2} [A-Z]{3}/

        const date_published = s(rawItem,"pubDate") || s(rawItem,"published");
        if (date_published) {
            item.date_published = date_published;
        }

        const date_modified = s(rawItem,"lastBuildDate") || s(rawItem,"updated");
        if (date_modified) {
            item.date_modified = date_modified;
        }

        const authors: JSONFeedAuthor[] = getAuthors(rawItem);
        if (authors && JSON.stringify(authors) !== "[]") {
            item.authors = authors;
        }

        const tags: string[] = [];
        let itemTags: any = rawItem?.category || rawItem?.["dc:subject"];
        if (itemTags) {
            if (! isArray(itemTags)) {
                itemTags = [itemTags];
            }
            for (const itemTag of itemTags) {
                tags.push(itemTag?.["#text"]);
            }
            item.tags = tags;
        }

        // const language: string = "en";
        // if (language) {
        //     item.language = language;
        // }

        // const attachments: JSONFeedAttachment[] = [];
        // {
        //     const attachment: JSONFeedAttachment = {
        //         // adding an image here w/ mime type doesn't cause it to be displayed
        //         url: "",
        //         mime_type: "",
        //     }
        //     const title = "";
        //     if (title) {
        //         attachment.title = title;
        //     }
        //     const size_in_bytes = 0;
        //     if (size_in_bytes) {
        //         attachment.size_in_bytes = size_in_bytes;
        //     }
        //     const duration_in_seconds = 0;
        //     if (duration_in_seconds) {
        //         attachment.duration_in_seconds = duration_in_seconds;
        //     }
        //     attachments.push(attachment);
        // }
        // if (attachments) {
        //     item.attachments = attachments;
        // }

        const _views = Number(rawItem?.["media:group"]?.["media:community"]?.["media:statistics"]?.["@_views"]);
        if (_views) {
            item._views = _views;
        }

        JSONFeed.items.push(item);
    }
    return JSONFeed;
}

function isArray(input: any): boolean {
    return input.splice ? true : false;
}

function getAuthors(obj: any): JSONFeedAuthor[] {
    const authors: JSONFeedAuthor[] = [];
        const itemAuthor = s(obj,"author.name") || s(obj,"dc:creator") || null;
        if (itemAuthor) {
            const author: JSONFeedAuthor =  {};
            const name = itemAuthor;
            if (name) {
                author.name = name;
            }
            const url = "";
            if (url) {
                author.url = url;
            }
            const avatar = "";
            if (avatar) {
                author.avatar = avatar;
            }
            authors.push(author);
        } else {
            const itemAuthors = obj?.author || obj?.["dc:creator"];
            if (itemAuthors) {
                for (const itemAuthor of itemAuthors) {
                    const author: JSONFeedAuthor =  {};
                    const name = itemAuthor?.name?.["#text"] || itemAuthor?.["#text"];
                    if (name) {
                        author.name = name;
                    }
                    const url = "";
                    if (url) {
                        author.url = url;
                    }
                    const avatar = "";
                    if (avatar) {
                        author.avatar = avatar;
                    }
                    authors.push(author);
                }
            }
        }
    return authors;
}