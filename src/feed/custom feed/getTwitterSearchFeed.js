import { getSearchQueryTweetsFromQuery } from 'https://deno.land/x/deno_twitter_guest_api@v0.0.2/mod.ts'






/*

IT SEEMS THIS FAILS TO GET RETWEETS SO TRY FIX !!!

ALSO SEEMS TO EXCLUDE SOME TWEETS. GETTING DIRECT FROM PROFILE MIGHT BE ONLY 
SOLUTION. THUS MIGHT BE FORCED TO CALL A SHIT-TONNE, SO PERHAPS VARY THE TIME OF
EACH TWITTER FEED BASED ON THE AVERAGE TWEETS PER DAY



could do no retweets of self filter option to stop pastryeth retweeting the same
thread 10x

*/







export async function getTwitterSearchFeed(query) {

    const tweets = await getSearchQueryTweetsFromQuery(query);

    const JSONFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: `Twitter Query - ${query}`,
        home_page_url: "https://www.twitter.com/",
    }
    
    const JSONFeedItems = [];
    for (let tweet of tweets) {

        const item = {
            id: tweet.id,
        }

        item.url = `https://www.twitter.com/${tweet.user}/status/${tweet.id}`;

        /**
         * remove shortened image urls and convert other urls from shortened to 
         * full
         */
        function parseURLsInText(text, tweet) {
            const urls = tweet.urls
            if (urls) {
                for (const url of urls) {
                    const shortURL = url.twitterLink;
                    const fullURL = url.url;
                    text = text.replace(shortURL, `<a href="${fullURL}">${fullURL}</a>`);
                }
            }
            const media = tweet.media;
            if (media) {
                for (const image of media) {
                    const url = image.twitterLink;
                    text = text.replace(url, "");
                }
            }
            return text;
        }
        item.content_html = tweet.text.replace(/\n/g, "<br>");
        item.content_html = parseURLsInText(item.content_html, tweet);
        
        /**
         * convert image urls to html image tags, and include whether tweet has 
         * images and/or has video
         * @param media
         */
        function parseMedia(media) {
            let imageTags = "";
            let hasImages, hasVideo;
            if (media) {
                for (const image of media) {
                    if (image.type === "photo") {
                        hasImages = true;
                    } else {
                        hasVideo = true;
                    }
                    const url = image.url;
                    const img = `<br><br><img width=\"100%\" src=\"${url}\">`;
                    imageTags += img;
                }
            }
            return [ imageTags, hasImages, hasVideo ];
        }
        let [ imageTags, hasImages, hasVideo] = parseMedia(tweet.media);
        item.content_html += imageTags;
        if (tweet.quote) {
            const quote = tweet.quote;
            const user = quote.user;
            let text = quote.text;
            text = parseURLsInText(text, quote);
            const [ imageTags ] = parseMedia(quote.media);
            item.content_html += `<blockquote>🐦 <b>@${user}</b><br><br>
                ${text + imageTags}</blockquote>`;
        }
        
        item.title = "🐦";
        if (tweet.isThread) {
            item.title += "🧵";
        }
        if (hasImages) {
            item.title += "📷";
        }
        if (hasVideo) {
            item.title += "📹";
        }
        item.title += " @" + tweet.user;

        // example twitter format: "Mon Mar 14 06:07:25 +0000 2022"
        const twitterDate = tweet.date;
        const year = twitterDate.substring(26, 30);
        const monthRef = {
            "Jan": "01",
            "Feb": "02",
            "Mar": "03",
            "Apr": "04",
            "May": "05",
            "Jun": "06",
            "Jul": "07",
            "Aug": "08",
            "Sep": "09",
            "Oct": "10",
            "Nov": "11",
            "Dec": "12",
        }
        const month = monthRef[twitterDate.substring(4, 7)];
        const day = twitterDate.substring(8, 10);
        const hours = twitterDate.substring(11, 13);
        const minutes = twitterDate.substring(14, 16);
        const seconds = twitterDate.substring(17, 19);
        // example ISO format: "2020-03-14T06:07:25.000Z"
        const ISODate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
        item.date_published = ISODate;
        
        item.authors = [{ name: tweet.user }];

        JSONFeedItems.push(item);
    }
    JSONFeed.items = JSONFeedItems;

    return JSONFeed;
}