/**
 * simplify calling nested keys from xml object:
 * - before:  `feedJSON.key1?.key2?.key3?.["#text"];`
 * - after:   `s(feedJSON, "key1.key2.key3");`
 * @param {*} feed 
 * @param {*} selectorArray 
 * @returns 
 */
export function xmlNestedKeySelector(feed, selector) {

    let obj = feed;
    let arr = selector;
    if (typeof arr !== 'object') {
        arr = arr.split(".");
    }
    if (arr.length > 0) {
        // console.log(JSON.stringify(obj))
        // console.log(JSON.stringify(arr))
        obj = obj?.[arr[0]];
        // if key not present, return null
        if (!(obj ?? false)) {
            return null;
        }
        arr.shift();
        return xmlNestedKeySelector(obj, arr);
    }
    return obj?.["#text"];
}
