function removeEmptyObjKeys(obj) {
    const newObj = {};
    for (let [key, val] of Object.entries(obj)) {
        if (val) {
            if (typeof val === 'object') {
                const isArray = val.splice && true;
                if (isArray) {
                    val = removeEmptyArrayEntries(val)
                } else {
                    val = removeEmptyObjKeys(val)
                }
                if (!val) { // if object is returned as null, dont add it
                    continue;
                }
            }
            newObj[key] = val;
        }
    }
    if (Object.keys(newObj).length === 0) {
        return null;
    } else {
        return newObj;
    }
}

function removeEmptyArrayEntries(arr) {
    const newArr = [];
    for (let item of arr) {
        if (item) {
            if (typeof item === 'object') {
                const isArray = item.splice && true;
                if (isArray) {
                    item = removeEmptyArrayEntries(item)
                } else {
                    item = removeEmptyObjKeys(item)
                }
                if (!item) { // if object is returned as null, dont add it
                    continue;
                }
            }
            newArr.push(item)
        }
    }
    if (newArr.length === 0) {
        return null;
    } else {
        return newArr;
    }
}

export function cleanObject(obj) {
    const isArray = obj.splice && true;
    if (isArray) {
        return removeEmptyArrayEntries(obj)
    } else {
        return removeEmptyObjKeys(obj)
    }
}