type Optional<T> = T | undefined

/**
 * simplify calling nested keys from xml object:
 * - before:  `feedJSON.key1?.key2?.key3?.["#text"];`
 * - after:   `s(feedJSON, "key1.key2.key3");`
 * @param {*} object you are selecting from
 * @param {*} selector
 * @returns 
 */
export function xmlNestedKeySelector(obj: any, selector: string | string[]
    ): Optional<string> {

    // create selector array from initial string to make key selection simpler
    if (typeof selector !== 'object') { selector = selector.split("."); }

    // if still selectors to be applied, apply them
    if (selector.length > 0) {
        obj = obj?.[selector[0]];
        // if key not present, return undefined
        if (obj === undefined) { return undefined; }
        selector.shift();
        return xmlNestedKeySelector(obj, selector);
    }
    return obj?.["#text"];
}
