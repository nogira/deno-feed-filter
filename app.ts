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
import { getCacheInfo } from './src/cache/getCacheInfo.ts'
import { updateCache } from './src/cache/updateCache.ts'
import { JSONFeed } from './src/feed/feedTypes.ts';
import { getFeed } from './src/feed/getFeed.ts';
import { getTwitterSearchFeed } from './src/feed/custom feed/getTwitterSearchFeed.ts';
import { getYTSearchFeed } from './src/feed/custom feed/getYTSearchFeed.ts';
import { filter } from './src/feed/filter.ts';
import { youtubeFormatting } from './src/feed/custom formatting/youtubeFormatting.ts';

const app = opine();
export const PORT = 8000;
export const UPDATE_FREQ = "1hrs"; // TODO: should swap to default every day at 6am (and no requests from 12am to 6am), but can be changed
export let cacheIndex: any;
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

const trackRequests: any = {
    Any: 0, New: 0,
    log(type: string) {
        this[type]++;
        console.log(`${type}: `, this[type]);
    },
};

// TODO: send fetch requests to worker threads

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
        ??? <span id="twitter-query"></span><br>
        <br>
        <b>Youtube channel</b>:<br>
        <input type="text" id="yt-channel" value="${exampleInputs.youtubeChannel}" style="width:30%">
        ??? <span id="yt-channel"></span><br>
        <br>
        <hr>
        <br>


        <h2>Cached</h2>
        <p> * editable list of cached feeds * </p>


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
    const id: string | undefined = await fetch(req.query.url + "/featured")
        .then(res => res.text())
        .then((text: string) => text?.match( /(?<=<link rel="canonical" href="https:\/\/www.youtube.com\/channel\/).+?(?=">)/ )?.[0]);
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
    const id: string = req.query.id
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
async function checkIfSendCache(req: any, res: any): Promise<any> {
    const cacheInfo: any = await getCacheInfo(req.url);
    // trackRequests.log("Any");
    if (cacheInfo.isRecentlyCached) {
        const cache = await Deno.readTextFile(`./feed_cache/${cacheInfo.id}.json`);
        const feed = JSON.parse(cache);
        res.send(feed);
    } else {
        console.log("START: " + req.url);
        return cacheInfo
    }
}

app.get('/default/', async (req, res) => {
    /*
    example URL:
    http://localhost:8000/default/?url=https://somefeed.com
    */
    const cacheInfo = await checkIfSendCache(req, res);
    // if returns something, cache was not sent
    if (cacheInfo) {
        const { url, ...filters } = req.query;
        const feed = await getFeed(url);
        updateCacheAndSend(feed, filters, cacheInfo, req, res);
    }
})

app.get('/twitter/', async (req, res, next) => {
    /*
    example URL:
    http://localhost:8000/twitter/?query=from:balajis+-filter:replies
    */
    const cacheInfo = await checkIfSendCache(req, res);
    // if returns something, cache was not sent
    if (cacheInfo) {
        const { query, ...filters } = req.query;
        const feed = await getTwitterSearchFeed(query); // 99.9% of time in this function is spent running getFeed()
        updateCacheAndSend(feed, filters, cacheInfo, req, res);
    }
})

app.get('/yt/c/:channelID/', async (req, res, next) => {
    /*
    example URL:
    http://localhost:8000/yt/c/UC5WjFrtBdufl6CZojX3D8dQ/?title_excl=tesla
    */




    /*
    change this to input channel url, and have this find the channel id
    */


    const cacheInfo = await checkIfSendCache(req, res);
    // if returns something, cache was not sent
    if (cacheInfo) {
        const filters = req.query;
        const url = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + req.params.channelID;
        let feed = await getFeed(url);
        feed = await youtubeFormatting(feed);
        updateCacheAndSend(feed, filters, cacheInfo, req, res);
    }
})

app.get('/yt/s/', async (req, res) => {
    /*
    example URL:
    http://localhost:8000/yt/s/?query=tesla
    */

    const cacheInfo = await checkIfSendCache(req, res);
    // if returns something, cache was not sent
    if (cacheInfo) {
        const { query, ...filters } = req.query;
        const url = `https://www.youtube.com/results?search_query=${query}&sp=CAI`;
        let feed = await getYTSearchFeed(url, query);    // end part of url is to sort by newest first
        // TODO: add this to filter
        // filter out items that have over 50% latin characters
        feed.items = feed.items.filter((item: any) => {
            const latinChars: number = item.title.match(/[a-z]/gi)?.length;
            const totalChars: number = item.title.length;
            // non-english usually under 20%, english usually over 80%, so 
            // split the difference
            const percentLatin = latinChars / totalChars;
            // add item if over 50% latin characters
            return percentLatin > 0.5;
        });
        updateCacheAndSend(feed, filters, cacheInfo, req, res);
    }
});

// applied after every get request above
async function updateCacheAndSend(
    feed: JSONFeed,
    filters: any,
    cacheInfo: any,
    req: any,
    res: any
    ): Promise<void> {

    feed = await filter(feed, filters);
    feed = await updateCache(feed, cacheInfo);
    console.log(req.url); trackRequests.log("New");
    res.send(feed);

}

app.listen(PORT, () => {
    console.log(`Server has started on http://localhost:${PORT} ????`)
});

/*

TODO: STILL NEED A WAY TO DELETE CACHED FILES WHEN THEY ARE NEVER REQUESTED BY 
ANYTHING OTHER THAN THE AUTO-CACHE WHILE-LOOP

SHOULD JUST TRACK THE NUMBER OF CACHE REQUESTS, AND IF 0 IN 1 WEEK, DELETE

THIS OF COURSE COULD BE IMPEDED IF STILL WORKING ON THE CODE SINCE IT FETCHES 
ALL URLS EVERY TIME THE CODE IS UPDATED AND SAVED
 - could just do a manual reset by deleting the cache folder

*/

// while (true) {
    // cache getCache requests (i.e. requests from NetNewsWire, as auto-requests
    //from here will only ever update the cache, not call the cache)
//     // every 20 min
//     // if last request was >2min ago
//     // 1) delete getCache cache
//     // 2) delete feed caches that have zero requests ONLY if >50% of requests have caches
//     // 3) reset getCache cache
// }

/*
UPDATE RESULTS X HOURS SO FEEDS ARE INSTANTLY FETCHED BY FEED VIEWER SINCE FEEDS
ARE ALL CACHED
*/
while (true) {
    console.log("?????? Updating cache...");
    for (const k in cacheIndex) {
        const endURL = k;
        await fetch(`http://127.0.0.1:${PORT}` + endURL);
        await sleep("100ms") // sleep 2s to prevent too many concurrent twitter requests that blocks loop
    }
    console.log("?????? Cache updated.");
    // due to sleep in loop above, this will always run slightly longer than 
    // UPDATE_FREQ, so should never return a cache
    await sleep(UPDATE_FREQ);
}


// ?????? ?????? ?????? THIS DOESN'T WORK YET BC WORKERS ARE NOT FULLY IMPLEMENTED IN DENO

/*
WORKER TO UPDATE CACHE ON A LOOP EVERY 2HRS BUT ONLY FROM 6AM TO 11PM
(FORCE RELOAD STILL POSSIBLE EVER HOUR, 24 HOURS A DAY)
*/

// ???????????? REQUIRES UNSTABLE FOR DENO COMMANDS IN WORKER !!!
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
