// import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

export async function getYTSearchFeed(url, query, cacheInfo) {
    const htmlStr = await fetch(url).then(r => r.text());
    let data = htmlStr.match(/(?<=<script.+?var ytInitialData = ).+?(?=;<\/script>)/)[0];
        data = JSON.parse(data);

    // const doc = new DOMParser().parseFromString(htmlString, "text/html");
    // const scripts = doc.querySelectorAll("script") //?.textContent;
    // let data;
    // for (let script of scripts) {
    //     const text = script.textContent;
    //     if (/^var ytInitialData/.test(text)) {
    //         // remove "var ytInitialData = " from start and ";" from end
    //         data = text.slice(20, -1);
    //         data = JSON.parse(data);
    //         break;
    //     }
    // }

    const videos = data.contents.twoColumnSearchResultsRenderer.primaryContents
        .sectionListRenderer.contents[0].itemSectionRenderer.contents;
    const JSONFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: `YouTube Search Feed - ${query}`,
        home_page_url: "https://www.youtube.com/",
        items: await (async () => {
            let itemsIDCache;
            if (cacheInfo.isCached) {
                const cache = await Deno.readTextFile(`./feed_cache/${cacheInfo.id}.json`);
                const itemsCache = JSON.parse(cache).items;
                itemsIDCache = itemsCache.map(item => item.id);
            }

            const JSONFeedItems = [];
            for (let item of videos) {
                item = item.videoRenderer;
                if (! item) { continue };

                /* skip if same id as cached item to prevent youtube-search 
                items being when date inevitably changed due to the nature of 
                how to date is calculated */
                const id = item.videoId;
                if (itemsIDCache?.includes(item.id)) { continue };

                JSONFeedItems.push({
                    id: id,
                    url: `https://www.youtube.com/watch?v=${item.videoId}`,
                    title: item?.title?.runs?.[0]?.text,
                    content_html: (() => {
                        const img = item?.thumbnail?.thumbnails?.[0]?.url
                            ?.replace(/(?<=\.jpg).*/, "");
                        const imgTag = `<img width=\"50%\" src=\"${img}\"><br><br>`;
                        const text = item?.detailedMetadataSnippets?.[0]?.snippetText?.runs
                            ?.map(x => x.text)?.join("");
                        return imgTag + text;
                    })() || "",
                    date_published: (() => {
                        const timeText = item?.publishedTimeText?.simpleText;
                        const num = timeText.match(/\d+/)?.[0];
                        let multiplier;
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
                            return new Date(Date.now()).toISOString();
                        }
                        return new Date(Date.now() - (num * multiplier)).toISOString();
                    })(),
                    authors: [{
                        name: item?.longBylineText?.runs?.[0]?.text,
                    }],
                    views: item?.viewCountText?.simpleText
                                ?.replace(/ views?|\.|,/, "")
                                .replace("K", "000")
                                .replace("M", "000000")
                                .replace("No", "0"),
                });
            }
            return JSONFeedItems
        })(),
    }
    return JSONFeed;
}