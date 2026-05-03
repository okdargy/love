import { sql } from "drizzle-orm";

import { ldb } from "./db";
import { itemsTable } from "./db/schema";

import { getAPIItems, getWebsiteItems } from "./api";

const NEXT_PAGE_INTERVAL = 5 * 1000;

async function getShopData() {
    const items: any[] = [];
    console.log("Fetching website items...");
    const wresponse = await getWebsiteItems();

    if (wresponse && wresponse.meta && wresponse.data.length > 0) {
        console.log(`Website page 1/${wresponse.meta.lastPage}: ${wresponse.data.length} items`);
        const transformedItems = wresponse.data.map(item => ({
            ...item,
            originalPrice: item.price,
            price: item.displayPrice !== undefined && item.displayPrice !== item.price ? item.displayPrice : null
        }));
        items.push(...transformedItems);

        for (let page = 2; page <= wresponse.meta.lastPage; page++) {
            await new Promise(resolve => setTimeout(resolve, NEXT_PAGE_INTERVAL));

            const pageResponse = await getWebsiteItems(page);
            if (pageResponse) {
                console.log(`Website page ${page}/${wresponse.meta.lastPage}: ${pageResponse.data.length} items`);
                const transformedItems = pageResponse.data.map(item => ({
                    ...item,
                    originalPrice: item.price,
                    price: item.displayPrice !== undefined && item.displayPrice !== item.price ? item.displayPrice : null
                }));
                items.push(...transformedItems);
            }
        }
    }

    console.log("Fetching API items...");
    const aresponse = await getAPIItems();

    if (aresponse && aresponse.assets.length > 0) {
        console.log(`API page 1/${aresponse.pages}: ${aresponse.assets.length} items`);
        if (items.length > 0) {
            const pushInto = (item: any) => {
                const existingItem = items.find((i) => i.id === item.id);
                if (existingItem) {
                    existingItem.originalPrice = item.price;
                    Object.assign(existingItem, { ...item, price: existingItem.price, originalPrice: item.price });
                } else {
                    item.originalPrice = item.price;
                    item.price = null;
                    items.push(item);
                }
            };

            aresponse.assets.forEach((apiItem) => pushInto(apiItem));
            for (let page = 2; page <= aresponse.pages; page++) {
                await new Promise(resolve => setTimeout(resolve, NEXT_PAGE_INTERVAL));

                const pageResponse = await getAPIItems(page);
                if (pageResponse) {
                    console.log(`API page ${page}/${aresponse.pages}: ${pageResponse.assets.length} items`);
                    pageResponse.assets.forEach((apiItem) =>
                        pushInto(apiItem)
                    );
                }
            }
        } else {
            const modifiedAssets = aresponse.assets.map(asset => ({
                ...asset,
                originalPrice: asset.price,
                price: null
            }));
            
            items.push(...modifiedAssets);

            for (let page = 2; page <= aresponse.pages; page++) {
                await new Promise(resolve => setTimeout(resolve, NEXT_PAGE_INTERVAL));

                const pageResponse = await getAPIItems(page);
                if (pageResponse) {
                    console.log(`API page ${page}/${aresponse.pages}: ${pageResponse.assets.length} items`);
                    const modifiedAssets = pageResponse.assets.map(asset => ({
                        ...asset,
                        originalPrice: asset.price,
                        price: null
                    }));
                    
                    items.push(...modifiedAssets);
                }
            }
        }
    }

    return items;
}

async function main() {
    console.log("Starting bestPrice refetch...");
    const items = await getShopData();
    console.log(`Total items fetched: ${items.length}`);

    if (items.length === 0) {
        console.log("No items to update.");
        process.exit(0);
    }

    const itemsValues = items.map(i => ({
        id: i.id,
        bestPrice: i.price ?? null,
    }));

    const chunkSize = 500;
    const totalChunks = Math.ceil(itemsValues.length / chunkSize);

    for (let i = 0; i < itemsValues.length; i += chunkSize) {
        const chunk = itemsValues.slice(i, i + chunkSize);
        await ldb.insert(itemsTable).values(chunk).onConflictDoUpdate({
            target: itemsTable.id,
            set: {
                bestPrice: sql.raw(`excluded.${itemsTable.bestPrice.name}`)
            }
        });
        console.log(`Updated chunk ${Math.floor(i / chunkSize) + 1}/${totalChunks} (${chunk.length} items)`);
    }

    console.log("bestPrice refetch complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
});
