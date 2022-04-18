export function xml2jsNestedKeySelector(feed, selectorArray) {
    /*
    simplify calling nested keys from xml2js:
      before:  feedJSON.key1?.key2?.key3?.["#text"];
      after:   s(feedJSON, "key1.key2.key3");
    */
    let obj = feed;
    let arr = selectorArray;
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
        return xml2jsNestedKeySelector(obj, arr);
    }
    return obj?.["#text"];
}

/*

TEST:

const s = xml2jsNestedKeySelector;
const feedJSON = {
    key1: {key2: {key3: {"#text": 10}}}
}

//           feedJSON.key1?.key2?.key3?.["#text"]
const test = s(feedJSON, "key1.key2.key3");

console.log(test);

*/