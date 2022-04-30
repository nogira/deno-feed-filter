export async function getYTSearchFeed(url, query) {
    const htmlStr = await fetch(url)
        .then(r => r.text())
        .catch(() => {
            console.log("Error fetching feed:\n" + url);
        });
    let data = htmlStr.match(/(?<=<script.+?var ytInitialData = ).+?(?=;<\/script>)/)[0];
        data = JSON.parse(data);
    let videos;
    try {
        videos = data.contents.twoColumnSearchResultsRenderer.primaryContents
            .sectionListRenderer.contents[0].itemSectionRenderer.contents;
    } catch {
        console.log("Youtube search object structure changed.")
    }
    
    const JSONFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: `YouTube Query - ${query}`,
        home_page_url: "https://www.youtube.com/",
    }

    const JSONFeedItems = [];
    for (let video of videos) {
        video = video.videoRenderer;
        if (! video) { continue };

        const item = {
            id: video.videoId,
            url: `https://www.youtube.com/watch?v=${video.videoId}`,
            title: video.title.runs[0].text,
        }
        
        const imageURL = video.thumbnail.thumbnails?.[0]?.url
            // remove tracking data at and of url
            ?.replace(/(?<=\.jpg).*/, "");
        const img = `<img width=\"50%\" src=\"${imageURL}\"><br><br>`;
        const desc = video.detailedMetadataSnippets?.[0]?.snippetText?.runs
            ?.map(x => x.text)?.join("") || "";
        item.content_html = (img + desc);

        const timeText = video.publishedTimeText?.simpleText;
        const num = timeText.match(/\d+/)?.[0];
        let multiplier = 1;
        let ISODate = "";
        if (/minute/.test(timeText)) {
            multiplier = 1000 * 60;
        } else if (/hour/.test(timeText)) {
            multiplier = 1000 * 60 * 60;
        } else if (/day/.test(timeText)) {
            multiplier = 1000 * 60 * 60 * 24;
        } else if (/month/.test(timeText)) {
            multiplier = 1000 * 60 * 60 * 24 * 30;
        } else if (/year/.test(timeText)) {
            multiplier = 1000 * 60 * 60 * 24 * 365;
        } else {
            ISODate = new Date(Date.now()).toISOString();
        }
        ISODate =  new Date(Date.now() - (num * multiplier)).toISOString();
        item.date_published = ISODate;

        item.authors = [{ name: video.longBylineText?.runs?.[0]?.text }];
        item.views = Number(video.viewCountText?.simpleText
                        ?.replace(/ views?|\.|,/g, "")
                        .replace("K", "000")
                        .replace("M", "000000")
                        .replace("No", "0"));

        JSONFeedItems.push(item);
    }
    JSONFeed.items = JSONFeedItems;

    return JSONFeed;
}