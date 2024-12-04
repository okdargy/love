import { db } from '@/lib/db';
import { ldb } from './db';
import { OwnerAPIResponse, Inventory, StoreAPIResponse } from './types';
import { itemsTable, serialsTable } from './db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import { tradeHistoryTable } from '@/lib/db/schema';

const newItemInterval = 1000 * 60 * 5; // Interval to check for new items

const nextPageCooldown = 5 * 1000; // Amount of time to wait before getting the next page
const nextItemCooldown = 30 * 1000; // Amount of time to wait before getting the next item

const cycleCooldown = 1000 * 60 * 10; // Amount of time to wait before repeating

/*
1. First, we need to have a interval to find new items and store them in the ldb.
2. Then, we need to go thru each item of the ldb, and get serials for each item. With these serials, we should first check if 
they are already in ldb, and if not, add them to ldb and push them to the db. If the serial is already in ldb, we should check if
the owner has changed, and if it has, update the owner in the ldb and push the change to the db.
*/

// Only gives 5 owners per page
const getOwners = async (id: number, page: number = 1, limit: number = 100): Promise<OwnerAPIResponse> => {
    const response = await fetch(`https://api.polytoria.com/v1/store/${id}/owners?page=${page}&limit=${limit}`);
    const data = await response.json();
    return data;
}

const getItems = async (page: number = 1): Promise<StoreAPIResponse> => {
    const response = await fetch('https://polytoria.com/api/store/items?sort=createdAt&order=desc&showOffsale=true&collectiblesOnly=true&page=' + page);
    const data = await response.json();
    return data;
}

async function loadItems() {
    const initItems = await ldb.select({ count: sql<number>`count(*)` }).from(itemsTable);
    console.log(`Found ${initItems[0].count} items in ldb`);

    if (initItems[0].count === 0) {
        let page = 1;
        const items = await getItems(page);
    
        while (items.data.length < items.meta.total) {
            page++;
            const newItems = await getItems(page);
            items.data = items.data.concat(newItems.data);
        }
    
        console.log(`Found ${items.data.length} items, inserting into ldb`);
        await ldb.insert(itemsTable).values(items.data.map((item) => ({ id: item.id }))).execute();
    } else {
        await updateItems();
    }

    return true;
}

async function updateItems() {
    const items = await getItems();
    const ldbItems = await ldb.select().from(itemsTable).orderBy(asc(itemsTable.id));

    for (const item of items.data) {
        if (!ldbItems.find((i) => i.id === item.id)) {
            ldb.insert(itemsTable).values(item).execute();
        }
    }

    return true;
}

async function actOnSerial(serial: Inventory, itemId: number) {
    try {
        const serials = await ldb.select().from(serialsTable).where(and(eq(serialsTable.itemId, itemId), eq(serialsTable.serial, serial.serial)));

        if (serials.length === 0) {
            const payload = {
                itemId,
                serial: serial.serial,
                userId: serial.user.id
            }
            
            ldb.insert(serialsTable).values(payload).execute();
            db.insert(tradeHistoryTable).values({
                ...payload,
                username: serial.user.username
            }).execute();
        } else {
            const oldSerial = serials[0];

            if (oldSerial.userId !== serial.user.id) {
                ldb.update(serialsTable).set({ userId: serial.user.id }).where(and(eq(serialsTable.itemId, itemId), eq(serialsTable.serial, serial.serial))).execute();
                db.insert(tradeHistoryTable).values({ itemId, serial: serial.serial, userId: serial.user.id, username: serial.user.username }).execute();
            }
        }

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function updateSerials() {
    const items = await ldb.select().from(itemsTable).orderBy(asc(itemsTable.id));

    for (const item of items) {
        let allSerials: Inventory[] = [];
        const owners = await getOwners(item.id, 1, 100);

        allSerials = allSerials.concat(owners.inventories);
        console.log(`(${item.id}) 1/${owners.pages} pages collected`);

        if(owners.pages > 1) {
            for (let i = 2; i <= owners.pages; i++) {
                const owners = await getOwners(item.id, i, 100);
                allSerials = allSerials.concat(owners.inventories);
    
                console.log(`(${item.id}) ${i}/${owners.pages} pages collected, waiting for ${nextPageCooldown}ms before next page`);
                await new Promise((resolve) => setTimeout(resolve, nextPageCooldown));
            }
        }

        console.log(`(${item.id}) Processing ${allSerials.length} serials...`);

        for (const serial of allSerials) {
            await actOnSerial(serial, item.id);
        }

        console.log(`(${item.id}) Done, waiting for ${nextItemCooldown}ms before next item`);
        await new Promise((resolve) => setTimeout(resolve, nextItemCooldown));
    }

    console.log(`Cycle done, waiting for ${cycleCooldown}ms before next cycle`);
    await new Promise((resolve) => setTimeout(resolve, cycleCooldown));

    return updateSerials();
}

(async () => {
    await loadItems();

    setInterval(updateItems, newItemInterval);

    await updateSerials();
})();