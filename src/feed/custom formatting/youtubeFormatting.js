export async function youtubeFormatting(feed) {
    const formattedItems  = [];
    for (const item of feed.items) {
        const imageText = `<img width=\"50%\" src=\"${item.image}\"><br><br>`
        item.content_html = imageText + item.content_html
        item.content_html = item.content_html.replace(/\n/g, "<br>");
        formattedItems.push(item)
    }
    feed.items = formattedItems;
    return feed;
}