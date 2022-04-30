/*
--------------------------------------------------------------------------------

FOR USE
deno run --allow-net --allow-read=./ --allow-write=./feed_cache app.js
or (though its like 30mb instead of <1mb)
deno compile --lite --allow-net --allow-read=./ --allow-write=./feed_cache app.js

FOR DEVELOPMENT
deno run --allow-net --allow-read=./ --allow-write=./feed_cache --watch app.js

--------------------------------------------------------------------------------
*/

import { opine } from "https://deno.land/x/opine@2.1.4/mod.ts";

import { sleep } from "./src/sleep.js";
import { getCacheInfo } from './src/cache/getCacheInfo.js'
import { updateCache } from './src/cache/updateCache.js'
import { getFeed } from './src/feed/getFeed.js';
import { getTwitterSearchFeed } from './src/feed/custom feed/getTwitterSearchFeed.js';
import { getYTSearchFeed } from './src/feed/custom feed/getYTSearchFeed.js';
import { filter } from './src/feed/filter.js';
import { youtubeFormatting } from './src/feed/custom formatting/youtubeFormatting.js';

const app = opine();
export const PORT = 8000;
export const UPDATE_FREQ = "1hrs"; // 🚨🚨🚨🚨 should swap to default every day at 6am (and no requests from 12am to 6am), but can be changed
export let cacheIndex;
// check if folder and file exists, if not, create it
// throws error if folder/file doesn't exist
try {
    cacheIndex = await Deno.readTextFile("./feed_cache/_index.json");
    cacheIndex = JSON.parse(cacheIndex);
} catch {
    // create folder and file
    await Deno.mkdir("./feed_cache")
    await Deno.writeTextFile("./feed_cache/_index.json", "{}");
    cacheIndex = {};
}

const trackRequests = {
    Any: 0, New: 0,
    log(type) {
        this[type]++;
        console.log(`${type}: `, this[type]);
    },
};

// input boxes to build urls
app.get('/', async (req, res) => {
    /*
    example URL:                
    http://localhost:8000/
    */
    const exampleInputs = {
        twitterSearch: "from:balajis -filter:replies",
        youtubeChannel: "https://www.youtube.com/c/lexfridman",
    }
    res.send(`
        <!--
        <b>URL test output</b>: params = ${JSON.stringify(req.query)}<br>
        (e.g. change url to http://localhost:8000/?hello=from:balajis%20-filter:replies
        to make sure the resulting object in javascript is what you expect)<br>
        <br>
        <hr>
        <br>

        WILL CHANGE TO DO DROPDOWN INSTEAD TO CHANGE MAIN INPUT, AND HAVE PERM 
        INPUTS FOR TITLE_EXCL, ETC

        <select id="cars" name="cars">
            <option value="volvo">Volvo</option>
            <option value="saab">Saab</option>
            <option value="fiat">Fiat</option>
            <option value="audi">Audi</option>
        </select><br>
        -->

        <br>
        <b>Twitter search query</b>:<br>
        <input type="text" id="twitter-query" value="${exampleInputs.twitterSearch}" style="width:30%">
        → <span id="twitter-query"></span><br>
        <br>
        <b>Youtube channel</b>:<br>
        <input type="text" id="yt-channel" value="${exampleInputs.youtubeChannel}" style="width:30%">
        → <span id="yt-channel"></span><br>

        <script>
            const twitterQueryInput = document.querySelector('input#twitter-query');
            const twitterQueryOutput = document.querySelector('span#twitter-query');
            function updateTwitterQueryOutput() {
                twitterQueryOutput.innerHTML = "http://localhost:8000/twitter/?query="
                                                + encodeURI(twitterQueryInput.value);
            }
            updateTwitterQueryOutput();
            twitterQueryInput.addEventListener('input',updateTwitterQueryOutput);

            const ytChannelInput = document.querySelector('input#yt-channel');
            const ytChannelOutput = document.querySelector('span#yt-channel');
            async function updateYTChannelOutput() {
                // http://localhost:8000/yt/c/UC5WjFrtBdufl6CZojX3D8dQ/?title_excl=tesla
                const ytID = await fetch("http://localhost:8000/getYTID/?url=" + ytChannelInput.value)
                                    .then(res => res.json())
                                    .then(obj => obj.id);
                ytChannelOutput.innerHTML = "http://localhost:8000/yt/c/" + ytID;
                                            // + encodeURI("?title_excl=" + "yes");
            }
            updateYTChannelOutput();
            ytChannelInput.addEventListener('input',updateYTChannelOutput);
        </script>
    `);
    // logReq("Any");
});
app.get('/getYTID', async (req, res) => {
    const id = await fetch(req.query.url + "/featured")
                    .then(res => res.text())
                    .then(text => text.match( /(?<=<link rel="canonical" href="https:\/\/www.youtube.com\/channel\/).+?(?=">)/ )[0]);
    res.send({id: id})
})

// handle /favicon.ico request that is sent by netnewswire so it doesn't go in 
// the cache index
app.get('/favicon.ico', async (req, res) => {
    res.send("");
})
app.get('/reset-cache-time', async (req, res) => {
    /*
    examples:
    http://127.0.0.1:8000/reset-cache-time/?id=/yt/c/UCkrwgzhIBKccuDsi_SvZtnQ/
    http://127.0.0.1:8000/reset-cache-time/?all=true
    */
    // reset cache time to zero to allow a new cache update
    const id = req.query.id
    if (id) {
        cacheIndex[id].lastRequest = 0;
    } else if (req.query.all == "true") {
        for (let key in cacheIndex) {
            cacheIndex[key].lastRequest = 0;
        }
    }
    
    res.send(`<h1>Reset ${id || "all"} :)</h1>`);
})


// applied right before every get request below
app.use(async (req, res, next) => {
    const cacheInfo = await getCacheInfo(req.url);

    // trackRequests.log("Any");
    if (cacheInfo.isRecentlyCached) {
        const cache = await Deno.readTextFile(`./feed_cache/${cacheInfo.id}.json`);
        const feed = JSON.parse(cache);
        res.send(feed);
    } else {
        console.log("START: " + req.url);
        req.cacheInfo = cacheInfo;
        next();
    }
});

app.get('/default/', async (req, res, next) => {
    /*
    example URL:
    http://localhost:8000/default/?url=https://somefeed.com
    */
    const { url, ...filters } = req.query;
    req.filters = filters;
    req.feed = await getFeed(url);
    next();
})

app.get('/twitter/', async (req, res, next) => {
    /*
    example URL:
    http://localhost:8000/twitter/?query=from:balajis+-filter:replies
    */
    const { query, ...filters } = req.query;
    req.filters = filters;
    req.feed = await getTwitterSearchFeed(query); // 99.9% of time in this function is spent running getFeed()
    next();
})

app.get('/yt/c/:channelID/', async (req, res, next) => {
    /*
    example URL:
    http://localhost:8000/yt/c/UC5WjFrtBdufl6CZojX3D8dQ/?title_excl=tesla
    */




    /*
    change this to input channel url, and have this find the channel id
    */




    req.filters = req.query;
    const url = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + req.params.channelID;
    req.feed = await getFeed(url);
    req.feed = await youtubeFormatting(req.feed);
    next();
})

app.get('/yt/s/', async (req, res, next) => {
    /*
    example URL:
    http://localhost:8000/yt/s/?query=tesla
    */
    const { query, ...filters } = req.query;
    req.filters = filters;
    const url = `https://www.youtube.com/results?search_query=${query}&sp=CAI`;
    req.feed = await getYTSearchFeed(url, query);    // end part of url is to sort by newest first




    // add this to filter




    // filter out items that have over 50% latin characters
    req.feed.items = req.feed.items.filter(item => {
        const latinChars = item.title.match(/[a-z]/gi)?.length;
        const totalChars = item.title.length;
        // non-english usually under 20%, english usually over 80%, so 
        // split the difference
        const percentLatin = latinChars / totalChars;
        // add item if over 50% latin characters
        return percentLatin > 0.5;
    });
    next();
})

// applied after every get request above
app.use(async (req, res) => {
    let feed = req.feed
    // if-statement to ignore if its the homepage, not a feed request
    if (feed) {
        feed = await filter(feed, req.filters);
        feed = await updateCache(feed, req.cacheInfo);
        console.log(req.url); trackRequests.log("New");
        res.send(feed);
    }
});

app.listen(PORT, () => {
    console.log(`Server has started on http://localhost:${PORT} 🚀`)
});








/*

STILL NEED A WAY TO DELETE CACHED FILES WHEN THEY ARE NEVER REQUESTED BY 
ANYTHING OTHER THAN THE AUTO-CACHE WHILE-LOOP

SHOULD JUST TRACK THE NUMBER OF CACHE REQUESTS, AND IF 0 IN 1 WEEK, DELETE

THIS OF COURSE COULD BE IMPEDED IF STILL WORKING ON THE CODE SINCE IT FETCHES 
ALL URLS EVERY TIME THE CODE IS UPDATED AND SAVED
 - could just do a manual reset by deleting the cache folder

*/



// while (true) {
//     // every 20 min
//     // if last request was >10min ago
//     // 1) delete getCache cache
//     // 2) delete feed caches that have zero requests ONLY if >50% of requests have caches
// }









/*
UPDATE RESULTS X HOURS SO FEEDS ARE INSTANTLY FETCHED BY FEED VIEWER SINCE FEEDS
ARE ALL CACHED
*/
while (true) {
    console.log("ℹ️ Updating cache...");
    for (const k in cacheIndex) {
        const endURL = k;
        await fetch(`http://127.0.0.1:${PORT}` + endURL);
        await sleep("100ms") // sleep 2s to prevent too many concurrent twitter requests that blocks loop
    }
    console.log("ℹ️ Cache updated.");
    // due to sleep in loop above, this will always run slightly longer than 
    // UPDATE_FREQ, so should never return a cache
    await sleep(UPDATE_FREQ);
}


// ⬇️ ⬇️ ⬇️ THIS DOESN'T WORK YET BC WORKERS ARE NOT FULLY IMPLEMENTED IN DENO

/*
WORKER TO UPDATE CACHE ON A LOOP EVERY 2HRS BUT ONLY FROM 6AM TO 11PM
(FORCE RELOAD STILL POSSIBLE EVER HOUR, 24 HOURS A DAY)
*/

// 🚨🚨🚨 REQUIRES UNSTABLE FOR DENO COMMANDS IN WORKER !!!
// const worker = new Worker(
//     new URL("./updateWorker.js", import.meta.url).href,
//     {
//         type: "module",
//         deno: {
//             namespace: true,
//         },
//         permissions: {
//             net: true,
//             read: [
//                 new URL("./feed_cache", import.meta.url),
//             ],
//             write: [
//                 new URL("./feed_cache", import.meta.url),
//             ],
//         },
//     },
// );

// worker.onmessage = async (e) => {console.log(e.data)}
// await worker.postMessage({})
