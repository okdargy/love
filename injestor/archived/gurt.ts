import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

const dbUrl = "file:trade.db"

if (dbUrl && dbUrl.startsWith('file:')) {
    const dbPath = dbUrl.replace(/^file:/, '');
    const dir = path.dirname(dbPath);

    try {
        if (!existsSync(dbPath)) {
            writeFileSync(dbPath, '');
            console.log(`Created SQLite DB file at ${dbPath}`);
        }
    } catch (e) {
        console.error(`Failed to ensure SQLite DB file: ${dbPath}`, e);
    }
}

const client = createClient({ url: dbUrl });
const ldb = drizzle(client, { schema });

await client.execute(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY NOT NULL,
    bestPrice INTEGER,
    totalSellers INTEGER,
    averagePrice INTEGER
)`);

await client.execute(`CREATE TABLE IF NOT EXISTS serials (
    itemId INTEGER NOT NULL,
    serial INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    CONSTRAINT serials_itemid_serial_unique UNIQUE (itemId, serial)
)`);

// const t = readFileSync(path.join(__dirname, 't1.json'), 'utf-8');
// const data = JSON.parse(t);

// for (const item of data) {
//     try {
//         const itemId = item.itemId ?? item.itemid;
//         const userId = item.userId ?? item.userid;
//         const serial = item.serial;

//         if (typeof itemId !== 'number' || typeof serial !== 'number' || typeof userId !== 'number') {
//             console.warn('Skipping invalid record:', { itemId, serial, userId });
//             continue;
//         }

//         await ldb.insert(schema.serialsTable).values({
//             itemId,
//             serial,
//             userId,
//         }).onConflictDoNothing();
//     } catch (e) {
//         console.error(`Failed to insert record:`, e);
//     }
// }

const t = readFileSync(path.join(__dirname, 't2.json'), 'utf-8');
const data = JSON.parse(t);

//   {
//     "itemId": 57509,
//     "bestPrice": null, // sometimes null
//     "totalSellers": 1097,
//     "averagePrice": 117
//   }
// ]
for (const item of data) {
    try {
        const itemId = item.itemId ?? item.itemid;
        const bestPrice = item.bestPrice ?? item.bestprice;
        const totalSellers = item.totalSellers ?? item.totalsellers;
        const averagePrice = item.averagePrice ?? item.averageprice;

        if (typeof itemId !== 'number' || typeof totalSellers !== 'number' || typeof averagePrice !== 'number') {
            console.warn('Skipping invalid record:', { itemId, bestPrice, totalSellers, averagePrice });
            continue;
        }

        await ldb.insert(schema.itemsTable).values({
            id: itemId,
            bestPrice: bestPrice ?? null,
            totalSellers,
            averagePrice,
        }).onConflictDoNothing();
    } catch (e) {
        console.error(`Failed to insert record:`, e);
    }
}
