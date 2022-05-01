import { JSONFeed } from './feedTypes.ts';

/**
 * simplify calling nested keys from xml object:
 * - before:  `feedJSON.key1?.key2?.key3?.["#text"];`
 * - after:   `s(feedJSON, "key1.key2.key3");`
 * @param {*} feed 
 * @param {*} selector
 * @returns 
 */
export function xmlNestedKeySelector(
    feed: JSONFeed,
    selector: string | string[]
    ): string {

    let obj: any = feed;
    let arr: string[];
    if (typeof selector !== 'object') {
        arr = selector.split(".");
    } else {
        arr = selector;
    }
    if (arr.length > 0) {
        // console.log(JSON.stringify(obj))
        // console.log(JSON.stringify(arr))
        obj = obj?.[arr[0]];
        // if key not present, return null
        if (!(obj ?? false)) {
            return "";
        }
        arr.shift();
        return xmlNestedKeySelector(obj, arr);
    }
    return obj?.["#text"];
}
