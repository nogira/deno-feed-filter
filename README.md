# Deno feed filter

Small self-hosted server that allows you to input rss/atom/json feeds, filter them, then output them as new localhost urls which you can use in a feed viewer app on your computer.
<br>

- Generate feed based on youtube channel ID.
  - `http://localhost:8000/yt/c/UC5WjFrtBdufl6CZojX3D8dQ`
- Generate feed based on youtube search query.
  - `http://localhost:8000/yt/s/?query=tesla`
- Generate feed based on twitter search query.
  - `http://localhost:8000/twitter/?query=from:balajis+-filter:replies`
- Generate feed based on atom/rss/json feed.
  - `http://localhost:8000/default/?url=https://somefeed.com`
<br>

- **Filtering feeds**
  - Example url: `http://localhost:8000/yt/c/UC5WjFrtBdufl6CZojX3D8dQ/?title_excl=door&desc_incl=drink`
  - `excl` is short for excluding, `incl` -> including, `desc` -> description/content
  - **Filters** (values are regex with the `i` flag enabled)
    - `title_excl=bad_word_1|bad_word_2` since it's regex, you separate different words with a `|`
    - `title_incl=words`
    - `desc_excl=words`
    - `desc_incl=words`
    - `author_excl=authors`
    - `author_incl=authors`
<br>

## Requirements

- [Deno](https://github.com/denoland/deno) installed
<br>

## Run

1. Clone this repository
2. `cd` to it's folder
3. `deno run --allow-net --allow-read=./ --allow-write=./feed_cache app.js`
4. Start entering urls into you feed reader

<br>

<h2>
  <a href="https://nogira.github.io/generate/donate.html" ><b>Support Me 🌞</b></a>
</h2>
