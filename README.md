# calcified-fragments

A website tool that helps you know which calcified fragments you've obtained
in Destiny. It also contains some links to guides and videos to help you
get them.

## How

It's based off grimoire cards. So if you've gotten the fragment, you'll also have
the grimoire card. Unfortunately if you did this on multiple characters, it does
not differentiate between them.

## Production notes

Nothing too special, ran on Heroku. Needs a `BUNGIE_API_KEY` in its environment
variables which can be obtained at https://www.bungie.net/en/User/API

## Dev

I hope you have some installation of Node.js

```
npm install
./bin/www
open http://localhost:3000
```

Make sure you have your own `.env` file with the appropriate `BUNGIE_API_KEY`

## License

MIT

