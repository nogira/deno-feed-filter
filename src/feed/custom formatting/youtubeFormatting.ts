import { JSONFeed, JSONFeedItem } from '../feedTypes.ts';

export async function youtubeFormatting(feed:JSONFeed):Promise<JSONFeed> {
    const formattedItems: JSONFeedItem[]  = [];
    for (const item of feed.items) {
        const imageText = `<img width=\"50%\" src=\"${item.image}\"><br><br>`
        item.content_html = imageText + item.content_html
        item.content_html = item.content_html.replace(/\n/g, "<br>");
        formattedItems.push(item)
    }
    feed.items = formattedItems;
    return feed;
}