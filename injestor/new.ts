import { and, desc, eq, gt, InferInsertModel, or, sql } from "drizzle-orm";

import { ldb } from "./db";
import { db } from "@/lib/db";

import { itemsTable, serialsTable } from "./db/schema";
import { collectablesTable, collectablesStatsTable, listingsHistoryTable, tradeHistoryTable } from "@/lib/db/schema";

import { APIItem, Inventory, Item, ListingsAPIResponse, WebsiteItem } from "./types";
import { getAPIItems, getListings, getOwners, getWebsiteItems } from "./api";
import { helpfulPrint, processDeal, processTrade, sendTradeWebhooks } from "./utils";

const INTERVALS = {
    NEW_ITEMS: 1000 * 60 * 5, // 5 minutes, checking for new items/deals
    NEXT_PAGE: 5 * 1000, // 5 seconds, after getting one page, wait X amount of time (increased from 5s)
    NEXT_ITEM: 30 * 1000, // 30 seconds, after getting one item, wait X amount of time (increased from 30s)
    CYCLE: 1000 * 60 * 60, // 60 minutes, to wait after the entire item cycle (listinsHistory, tradeHistory) is done, indepedent from new items
};

type NullableOptional<T> = {
  [K in keyof T]?: T[K] | null;
};

type MergedItem = Item & NullableOptional<Omit<WebsiteItem, keyof Item> & Omit<APIItem, keyof Item>>;

// price in getShopData will always be the best price, aka. the top reseller. if the website request fails, it will be null.
async function getShopData() {
    const items: MergedItem[] = [];
    const wresponse = await getWebsiteItems();

    // first push whatever we get from website, could be null because of cloudflare
    if (wresponse && wresponse.meta && wresponse.data.length > 0) {
        items.push(...wresponse.data);

        for (let page = 2; page <= wresponse.meta.lastPage; page++) {
            await new Promise(resolve => setTimeout(resolve, INTERVALS.NEXT_PAGE));

            const pageResponse = await getWebsiteItems(page);
            if (pageResponse) {
                items.push(...pageResponse.data);
            }
        }
    }

    const aresponse = await getAPIItems();

    if (aresponse && aresponse.assets.length > 0) {
        // if we have received stuff from website, we want to merge it with API data
        if (items.length > 0) {
            const pushInto = (item: APIItem) => {
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
                await new Promise(resolve => setTimeout(resolve, INTERVALS.NEXT_PAGE));

                const pageResponse = await getAPIItems(page);
                if (pageResponse) {
                    pageResponse.assets.forEach((apiItem) =>
                        pushInto(apiItem)
                    );
                }
            }
        } else { // if no items from website, we just add API items just always to get the latest items
            const modifiedAssets = aresponse.assets.map(asset => ({
                ...asset,
                originalPrice: asset.price,
                price: null
            }));
            
            items.push(...modifiedAssets);

            for (let page = 2; page <= aresponse.pages; page++) {
                await new Promise(resolve => setTimeout(resolve, INTERVALS.NEXT_PAGE));

                const pageResponse = await getAPIItems(page);
                if (pageResponse) {
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

async function handleShopData(items: MergedItem[]) {
    if (items.length == 0) return;

    let itemsToUpdate = [];
    const localItems = await ldb.query.itemsTable.findMany({
        orderBy: desc(itemsTable.id),
    });
    helpfulPrint(`Loaded ${localItems.length} local items`, "INFO", true);

    // 1. getting new items
    const highestIds = localItems.map((item) => item.id);
    const newItems = items.filter((item) => !highestIds.includes(item.id));
    itemsToUpdate.push(...newItems);

    // 2. getting updated averagePrice/price
    items.forEach((item) => {
        const existingItem = localItems.find((i) => i.id === item.id);

        if (existingItem) {
            if ((item.price && item.price !== existingItem.bestPrice) || (item.averagePrice && item.averagePrice !== existingItem.averagePrice)) {
                if(item.price && existingItem.bestPrice && item.price < existingItem.bestPrice) processDeal(existingItem, { price: item.price });
                itemsToUpdate.push(item);
            }
        }
    });

    helpfulPrint(`Inserting/updating ${itemsToUpdate.length} items into the database, ${newItems.length} new`, "INFO", true);
    await insertNewItems(itemsToUpdate);
}

async function insertNewItems(values: MergedItem[]) {
    if(values.length === 0) return;

    const collectableValues: InferInsertModel<typeof collectablesTable>[] = values.map(i => ({
        id: i.id,
        type: i.type,
        name: i.name,
        description: i.description,
        thumbnailUrl: (i.thumbnailUrl || i.thumbnail) ?? "https://cdn.polytoria.com/placeholders/asset/pending.png",
        recentAverage: i.averagePrice ?? 0,
        price: i.originalPrice ?? 0,
    }));

    const collectableStatsValues: InferInsertModel<typeof collectablesStatsTable>[] = values.map(i => ({
        id: i.id,
        value: i.averagePrice ?? null,
        demand: null,
        trend: null,
        funFact: null,
    }));

    await db.insert(collectablesTable).values(collectableValues).onConflictDoUpdate({
        target: collectablesTable.id,
        set: {
            recentAverage: sql.raw(`excluded.${collectablesTable.recentAverage.name}`),
            price: sql.raw(`excluded.${collectablesTable.price.name}`)
        }
    });

    await db.insert(collectablesStatsTable).values(collectableStatsValues).onConflictDoNothing();

    const itemsValues = values.map(i => ({
        id: i.id,
        bestPrice: i.price ?? null,
        totalSellers: null,
        averagePrice: i.averagePrice ?? null
    }));

    await ldb.insert(itemsTable).values(itemsValues).onConflictDoUpdate({
        target: itemsTable.id,
        set: {
            bestPrice: sql.raw(`excluded.${itemsTable.bestPrice.name}`),
            averagePrice: sql.raw(`excluded.${itemsTable.averagePrice.name}`)
        }
    });
}

async function getAllItemOwners(itemId: number) {
    const owners: Inventory[] = []
    const response = await getOwners(itemId);

    if(response && response.inventories) {
        owners.push(...response.inventories);
        
        for (let page = 2; page <= response.pages; page++) {
            await new Promise(resolve => setTimeout(resolve, INTERVALS.NEXT_PAGE));
            
            const pageResponse = await getOwners(itemId, page);
            if (pageResponse && pageResponse.inventories) {
                owners.push(...pageResponse.inventories);
            }
        }
        
        return owners;
    } else {
        return [];
    }
}

async function handleOwnersData(itemId: number, owners: Inventory[]) {
    if (owners.length === 0) return;

    let serialsToUpdate: {
        itemId: number,
        serial: number,
        userId: number,
        username: string,
        isFirst?: boolean,
        oldUserId?: number
    }[] = []
    const localItems = await ldb.query.serialsTable.findMany({
        where: eq(serialsTable.itemId, itemId),
    });

    // for fuckass duplicates
    const serialMap = new Map<number, Inventory>();
    for (const owner of owners) {
        const existing = serialMap.get(owner.serial);
        if (!existing || new Date(owner.purchasedAt) > new Date(existing.purchasedAt)) {
            serialMap.set(owner.serial, owner);
        }
    }

    for (const owner of serialMap.values()) {
        const existingOwner = localItems.find((item) => item.serial === owner.serial);

        if (existingOwner) {
            if(existingOwner.userId !== owner.user.id) {
                serialsToUpdate.push({
                    itemId,
                    userId: owner.user.id,
                    username: owner.user.username,
                    serial: owner.serial,
                    oldUserId: existingOwner.userId
                });
            }
        } else {
            serialsToUpdate.push({
                itemId,
                userId: owner.user.id,
                username: owner.user.username,
                serial: owner.serial,
                isFirst: true
            });
        }
    }

    helpfulPrint(`Inserting/updating ${serialsToUpdate.length} serials for item ${itemId}`, "INFO", true);
    return await insertSerialLogs(serialsToUpdate);
}

async function insertSerialLogs(inventories: {
    itemId: number,
    serial: number,
    userId: number,
    username: string,
    isFirst?: boolean,
    oldUserId?: number
}[]) {
    if (inventories.length === 0) return [];

    await db.insert(tradeHistoryTable).values(inventories);

    const nonFirstTimeOwners = inventories.filter(inv => !inv.isFirst && inv.oldUserId);
    
    await ldb.insert(serialsTable).values(inventories)
    .onConflictDoUpdate({
        target: [serialsTable.itemId, serialsTable.serial],
        set: {
            userId: sql.raw(`excluded.${serialsTable.userId.name}`),
        },
    });

    return nonFirstTimeOwners.map(inv => ({
        itemId: inv.itemId,
        serial: inv.serial,
        userId: inv.userId,
        username: inv.username,
        oldUserId: inv.oldUserId!
    }));
}

async function handleListingData(itemId: number , response: ListingsAPIResponse) {
    if (!response || response.data.length === 0) return;

    // why get the iem again when you can just pass it through the cycle? OUTDATED!!!
    // the shop function could reach it after this function is called since it has to loop through all the items with the delays provided
    const item = await ldb.query.itemsTable.findFirst({
        where: eq(itemsTable.id, itemId)
    });

    if(!item) return;

    const cheapestSeller = response.data.reduce((prev, curr) => (prev.price < curr.price ? prev : curr)); // just in case, alyx does write some weird code
    const price = cheapestSeller.price;
    const totalSellers = response.meta.total;

    if (price !== item.bestPrice || totalSellers !== item.totalSellers) {
        if(item.bestPrice && price < item.bestPrice) processDeal(item, cheapestSeller);

        await db.insert(listingsHistoryTable).values({
            itemId: item.id,
            bestPrice: price,
            sellers: totalSellers,
        });

        await ldb.insert(itemsTable).values({
            id: item.id,
            bestPrice: price,
            totalSellers: totalSellers,
        }).onConflictDoUpdate({
            target: itemsTable.id,
            set: {
                bestPrice: price,
                totalSellers: totalSellers
            }
        })
        helpfulPrint(`Updated item ${item.id} with new price ${price} and ${totalSellers} sellers`, "INFO", true);
    }
}

class ItemCycleManager {
    private looping: boolean = true;
    private isRunning: boolean = false;
    private cycleTimeout?: NodeJS.Timeout;
    private tradeAccumulator: {
        itemId: number,
        serial: number,
        userId: number,
        username: string,
        oldUserId: number
    }[] = [];

    start() {
        this.looping = true;
        if(!this.isRunning) this.runCycle();
    }
    
    stop() {
        this.looping = false;
        if (this.cycleTimeout) {
            clearTimeout(this.cycleTimeout);
            this.cycleTimeout = undefined;
        }
    }

    private async runCycle() {
        let startTime = Date.now();
        this.tradeAccumulator = [];
        
        const localItems = await ldb.query.itemsTable.findMany({
            orderBy: desc(itemsTable.id),
            columns: {
                id: true
            }
        });

        let itemsCompleted = 0;
        for (const item of localItems) {
            try {
                const owners = await getAllItemOwners(item.id);
                if(owners) {
                    const trades = await handleOwnersData(item.id, owners);
                    if(trades) this.tradeAccumulator.push(...trades);
                }

                const listings = await getListings(item.id);
                if(listings) await handleListingData(item.id, listings);

                itemsCompleted++;
            } catch (error) {
                helpfulPrint(`Error processing item ${item.id}: ${error}`, "ERROR");
            }

            await new Promise(resolve => setTimeout(resolve, INTERVALS.NEXT_ITEM));
        }

        await this.processAccumulatedTrades();

        helpfulPrint(`Cycle complete in \`${Date.now() - startTime}ms\` with **${itemsCompleted}/${localItems.length}** items processed`);
        if (this.looping) {
            this.cycleTimeout = setTimeout(() => this.runCycle(), INTERVALS.CYCLE);
        } else {
            this.isRunning = false;
        }
    }

    private async processAccumulatedTrades() {
        if (this.tradeAccumulator.length === 0) return;

        helpfulPrint(`Processing ${this.tradeAccumulator.length} accumulated trades`, "INFO", true);
 
        // we need to pair these people and see which items they have traded between each other
        const pairs = new Map<string, typeof this.tradeAccumulator>();

        for (const trade of this.tradeAccumulator) {
            const pairKey = [trade.userId, trade.oldUserId].sort((a, b) => a - b).join('-'); // normalization
            if (pairs.has(pairKey)) {
                pairs.get(pairKey)!.push(trade);
            } else {
                pairs.set(pairKey, [trade]);
            }
        }

        // Collect all trade embeds
        const tradeEmbeds: any[] = [];

        for (const [_, trades] of pairs.entries()) {
            try {
                const leftSide = {
                    id: trades[0].userId,
                    username: trades[0].username
                }

                const rightSide = {
                    id: trades[0].oldUserId,
                    username: trades.find(t => t.userId === trades[0].oldUserId)?.username || 'Unknown'
                }

                const recentTrades = await db.query.tradeHistoryTable.findMany({
                    where: and(
                        gt(tradeHistoryTable.created_at, sql`datetime('now', '-6 hours')`),
                        or(
                            eq(tradeHistoryTable.userId, leftSide.id),
                            eq(tradeHistoryTable.userId, rightSide.id)
                        )
                    ),
                    with: { item: true }
                });

                const embed = await processTrade(leftSide, rightSide, recentTrades, trades);

                if (embed) {
                    tradeEmbeds.push(embed);
                }
            } catch (error) {
                helpfulPrint(`Error processing trade between ${trades[0].userId} and ${trades[0].oldUserId}: ${error}`, "ERROR");
            }
        }

        if (tradeEmbeds.length > 0) {
            await sendTradeWebhooks(tradeEmbeds);
            helpfulPrint(`Sent ${tradeEmbeds.length} trade webhooks in batches`, "INFO", true);
        }
    }
}

const cycleManager = new ItemCycleManager();
cycleManager.start();

setInterval(async () => {
    const shopData = await getShopData();
    handleShopData(shopData);
}, INTERVALS.NEW_ITEMS);

const msToRelative = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
};

let startupMessage = `Startup complete! The time is \`${new Date().toISOString()}\`.\n`;
Object.entries(INTERVALS).forEach(([name, interval]) => {
    startupMessage += `> - ${name}: \`${msToRelative(interval)}\`\n`;
});

helpfulPrint(startupMessage);