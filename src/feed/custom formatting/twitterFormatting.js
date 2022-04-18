export async function twitterFormatting(feed) {
    feed.home_page_url = "https://twitter.com/";
    const formattedItems  = [];
    for (const item of feed.items) {
        item.title = item.authors?.[0]?.name;
        item.url = item.url.slice(0,-2);  // remove "#m" from end of url
        formattedItems.push(item)
    }
    feed.items = formattedItems;
    return feed;
}