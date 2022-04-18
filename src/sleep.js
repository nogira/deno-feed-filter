export async function sleep(time) {
    const unit = time.replace(/^[^a-zA-z]*/, "");
    const num = Number(time.replace(/[^0-9]*$/, ""));
    const multiplier = {
        "ms": 1,
        "s": 1000,
        "sec": 1000,
        "secs": 1000,
        "m": 60000,
        "min": 60000,
        "mins": 60000,
        "h": 3600000,
        "hr": 3600000,
        "hrs": 3600000,
        "d": 86400000,
        "day": 86400000,
        "days": 86400000,
    }
    const ms = num * multiplier[unit];
    return await new Promise(resolve => setTimeout(resolve, ms));
}