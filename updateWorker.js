/*

UPDATE CACHE ON A LOOP EVERY 2HRS BUT ONLY FROM 6AM TO 12AM

*/

import { sleep } from './src/sleep.js';
import { PORT, UPDATE_FREQ, cacheIndex } from './app.js'

console.log("Update Worker Running...");

while (true) {
    console.log("ℹ️ Updating cache...");
    for (const k in cacheIndex) {
        console.log("pre-update");
        // 🚨🚨🚨 THIS IS CAUSING THE CRASH. even fetching google.com conflicts with opine.
        // await fetch(`http://127.0.0.1:${PORT}` + k);
        await fetch(`https://google.com`);
        console.log("post-update")
    }
    console.log("ℹ️ Cache updated.");
    await sleep(UPDATE_FREQ);
}
// self.close();