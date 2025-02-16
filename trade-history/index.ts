import { db } from "@/lib/db";
import { ldb } from "./db";
import {
    Inventory,
    ListingsAPIResponse,
    OwnerAPIResponse,
    StoreAPIResponse,
} from "./types";
import { itemsTable, serialsTable } from "./db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { listingsHistoryTable, tradeHistoryTable } from "@/lib/db/schema";

const newItemInterval = 1000 * 60 * 5; // Interval to check for new items

const nextPageCooldown = 5 * 1000; // Amount of time to wait before getting the next page
const nextItemCooldown = 30 * 1000; // Amount of time to wait before getting the next item

const cycleCooldown = 1000 * 60 * 30; // Amount of time to wait before repeating

const getOwners = async (
    id: number,
    page: number = 1,
    limit: number = 100,
): Promise<OwnerAPIResponse | null> => {
    try {
        const response = await fetch(
            `https://api.polytoria.com/v1/store/${id}/owners?page=${page}&limit=${limit}`,
            {
                headers: {
                    "User-Agent":
                        "TradeHistory/1.0 (https://polytoria.trade; hello@dargy.party)",
                },
            },
        );
        if (!response.ok) {
            console.error(
                `Failed to get owners for item ${id} page ${page}: ${response.status}`,
            );
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(
            `Error fetching owners for item ${id} page ${page}:`,
            error,
        );
        return null;
    }
};

const getListings = async (id: number): Promise<ListingsAPIResponse | null> => {
    try {
        const response = await fetch(
            `https://polytoria.com/api/store/listings/${id}`,
            {
                headers: {
                    "User-Agent":
                        "TradeHistory/1.0 (https://polytoria.trade; hello@dargy.party)",
                },
            },
        );

        if (!response.ok) {
            console.error(
                `Failed to get listings for item ${id}: ${response.status}`,
            );
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching listings for item ${id}:`, error);
        return null;
    }
};

const getItems = async (page: number = 1): Promise<StoreAPIResponse | null> => {
    try {
        const response = await fetch(
            "https://polytoria.com/api/store/items?sort=createdAt&order=desc&showOffsale=true&collectiblesOnly=true&page=" +
                page,
            {
                headers: {
                    "User-Agent":
                        "TradeHistory/1.0 (https://polytoria.trade; hello@dargy.party)",
                },
            },
        );
        if (!response.ok) {
            console.error(
                `Failed to get items page ${page}: ${response.status}`,
            );
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching items page ${page}:`, error);
        return null;
    }
};

async function loadItems() {
    try {
        const initItems = await ldb.select({ count: sql<number>`count(*)` })
            .from(itemsTable);
        console.log(`Found ${initItems[0].count} items in ldb`);

        if (initItems[0].count === 0) {
            let page = 1;
            const items = await getItems(page);

            if (!items) {
                throw new Error("Failed to get initial items");
            }

            while (items.data.length < items.meta.total) {
                page++;
                const newItems = await getItems(page);

                if (!newItems) {
                    console.error(
                        `Failed to get page ${page}, stopping item collection`,
                    );
                    break;
                }

                items.data = items.data.concat(newItems.data);
            }

            console.log(`Found ${items.data.length} items, inserting into ldb`);
            await ldb.insert(itemsTable).values(
                items.data.map((item) => ({
                    id: item.id,
                    bestPrice: 0,
                    totalSellers: 0,
                })),
            ).execute();
        } else {
            await updateItems();
        }

        return true;
    } catch (error) {
        console.error("Error in loadItems:", error);
        return false;
    }
}

async function updateItems() {
    const items = await getItems();
    if (!items) return false;
    const ldbItems = await ldb.select().from(itemsTable).orderBy(
        desc(itemsTable.id),
    );

    for (const item of items.data) {
        if (!ldbItems.find((i) => i.id === item.id)) {
            ldb.insert(itemsTable).values({
                ...item,
                bestPrice: 0,
                totalSellers: 0,
            }).execute();
        }
    }

    return true;
}

async function actOnSerial(serial: Inventory, itemId: number) {
    try {
        const serials = await ldb.select().from(serialsTable).where(
            and(
                eq(serialsTable.itemId, itemId),
                eq(serialsTable.serial, serial.serial),
            ),
        );

        if (serials.length === 0) {
            const payload = {
                itemId,
                serial: serial.serial,
                userId: serial.user.id,
            };

            ldb.insert(serialsTable).values(payload).execute();
            db.insert(tradeHistoryTable).values({
                ...payload,
                username: serial.user.username,
                isFirst: true,
            }).execute();
        } else {
            const oldSerial = serials[0];

            if (oldSerial.userId !== serial.user.id) { // if its the same
                ldb.update(serialsTable).set({ userId: serial.user.id }).where(
                    and(
                        eq(serialsTable.itemId, itemId),
                        eq(serialsTable.serial, serial.serial),
                    ),
                ).execute();
                db.insert(tradeHistoryTable).values({
                    itemId,
                    serial: serial.serial,
                    userId: serial.user.id,
                    username: serial.user.username,
                }).execute();
            }
        }

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function updateSerials() {
    try {
        const items = await ldb.select().from(itemsTable).orderBy(
            desc(itemsTable.id),
        );

        for (const item of items) {
            let allSerials: Inventory[] = [];
            const itemInfo = await getListings(item.id);

            if(itemInfo) {
                if(itemInfo.data[0] && itemInfo.data[0].price !== item.bestPrice || itemInfo.meta.total !== item.totalSellers) {
                    ldb.update(itemsTable).set({
                        bestPrice: itemInfo.data[0].price,
                        totalSellers: itemInfo.meta.total,
                    }).where(eq(itemsTable.id, item.id)).execute();

                    db.insert(listingsHistoryTable).values({
                        itemId: item.id,
                        bestPrice: itemInfo.data[0].price,
                        sellers: itemInfo.meta.total,
                    }).execute();
                }
            }

            const owners = await getOwners(item.id, 1, 100);

            if (!owners) {
                console.error(`Skipping item ${item.id} due to failed request`);
                continue;
            }

            allSerials = allSerials.concat(owners.inventories);
            console.log(`(${item.id}) 1/${owners.pages} pages collected`);

            if (owners.pages > 1) {
                for (let i = 2; i <= owners.pages; i++) {
                    const nextOwners = await getOwners(item.id, i, 100);

                    if (!nextOwners) {
                        console.error(
                            `Failed to get page ${i} for item ${item.id}, continuing with collected data`,
                        );
                        break;
                    }

                    allSerials = allSerials.concat(nextOwners.inventories);

                    console.log(
                        `(${item.id}) ${i}/${owners.pages} pages collected, waiting for ${nextPageCooldown}ms before next page`,
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, nextPageCooldown)
                    );
                }
            }

            console.log(
                `(${item.id}) Processing ${allSerials.length} serials...`,
            );

            allSerials = allSerials.filter((v, i, a) =>
                a.findIndex((t) => (t.serial === v.serial)) === i
            );

            console.log(
                `(${item.id}) ${allSerials.length} unique serials found...`,
            );

            for (const serial of allSerials) {
                await actOnSerial(serial, item.id);
            }

            console.log(
                `(${item.id}) Done, waiting for ${nextItemCooldown}ms before next item`,
            );
            await new Promise((resolve) =>
                setTimeout(resolve, nextItemCooldown)
            );
        }

        console.log(
            `Cycle done, waiting for ${cycleCooldown}ms before next cycle`,
        );
        await new Promise((resolve) => setTimeout(resolve, cycleCooldown));

        return updateSerials();
    } catch (e) {
        console.error("Error in updateSerials:", e);
        console.log(`Retrying in ${cycleCooldown}ms...`);
        await new Promise((resolve) => setTimeout(resolve, cycleCooldown));
        return updateSerials();
    }
}

(async () => {
    await loadItems();

    setInterval(updateItems, newItemInterval);

    await updateSerials();
})();
