goals: 
- ✅ new items coming into the db from the api + update averagePrice coming from same api endpoint
- ✅ historical serial data
- ✅ historical amount of listings / best price
everything is gonna be synced from ldb (local read/write) and db (actual cloud db) to reduce latency & bandwidth for checking every single serial

apis:
- https://polytoria.com/api/store/items?sort=createdAt&order=desc&collectiblesOnly=true (gives best price, but limited to 15 per page and kinda :( when 94 total)
- https://api.polytoria.com/v1/store?sort=createdAt&order=desc&collectiblesOnly=true&limit=100 (gives all 94 collectables in 1 page, with a limit of 100 so might need next page but gives average price)
- https://polytoria.com/api/store/listings/51385 (gives total amount of listings)

1. initialize by getting all the items from the API, we will continuously do this to meet goal #1 and make sure this time to be sending deals through this since it's more effective
sometimes, polytoria.com is behind a cloudflare status code, so we might need to switch to api.polytoria.com. maybe we can
2. after initializing, we're gonna save those items into an array and then loop through them, getting serials and comparing them throught the ldb. using NEXT_PAGE, NEXT_ITEM, and CYCLE