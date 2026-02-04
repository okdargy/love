import { collectablesTable, tradeHistoryTable } from "@/lib/db/schema";
import { Listing } from "./types";
import { db } from "@/lib/db";
import { eq, InferSelectModel, inArray } from "drizzle-orm";
import { existsSync, readFileSync } from "fs";

const tags = await db.query.tagsTable.findMany();

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * Post deal to the webhook
 * @param item the old item data, before the deal
 * @param listing the new listing information
 * @param date the date of the listing
 * @returns 
 */
export const processDeal = async (item: {
    id: number;
    bestPrice: number;
    averagePrice?: number;
}, listing: {
    price: number
}, date?: Date) => {
    const deal = (item.bestPrice - listing.price) / item.bestPrice * 100;
    if (deal < 10) return console.log(`Deal for ${item.id} is less than 10%, skipping (${deal.toFixed(2)}%)`);
    
    const itemInfo = await db.query.collectablesTable.findFirst({
        where: eq(collectablesTable.id, item.id),
        with: { tags: true }
    });

    if(!itemInfo) return console.error(`Failed to find item ${item.id} in db, cannot post webhook`);

    const payload = JSON.stringify({
        username: "LOVE Deals",
        avatar_url: "https://polytoria.trade/bot_icon.png",
        embeds: [
            {
                title: itemInfo.name + (itemInfo.shorthand ? ` (${itemInfo.shorthand})` : ""),
                description: itemInfo.description + (itemInfo.tags.length > 0) ? `\n\n${itemInfo.tags.map(t => {
                    let i = tags.find(tag => tag.id === t.tagId)
                    return "`" + (i ? i.emoji + " " + i.name : "Unknown") + "`"
                }).join("\n")}` : "",
                color: 15680580,
                thumbnail: {
                    url: itemInfo.thumbnailUrl,
                },
                fields: [
                    {
                        name: "Price",
                        value: formatNumber(item.bestPrice) + "  ➡  " + formatNumber(listing.price) + " (" + Math.round(deal) + "%)",
                        inline: true
                    },
                    {
                        "name": "Item",
                        "value": "[Visit here](https://polytoria.com/store/" + item.id + ")",
                        "inline": true
                    },
                    ...(itemInfo.recentAverage ? [{
                        name: "Recent Average",
                        value: formatNumber(itemInfo.recentAverage!),
                        inline: true
                    }] : [])
                ],
                footer: {
                    "text": "polytoria.trade",
                    "icon_url": "https://polytoria.trade/bot_icon.png"
                },
                timestamp: date ? date.toISOString() : new Date().toISOString(),
            }
        ]
    });

    const res = await fetch(process.env.DEALS_WEBHOOK_URL!, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: payload
    });
    const json = await res.json();
    console.log(res.status, json);
}

type TradeHistoryWithItem = InferSelectModel<typeof tradeHistoryTable> & {
  item: InferSelectModel<typeof collectablesTable>
}

export const processTrade = async (
    leftSide: {
        id: number;
        username: string;
    }, 
    rightSide: {
        id: number;
        username: string;
    }, 
    history: TradeHistoryWithItem[],
    currentTrades: {
        itemId: number;
        serial: number;
        userId: number;
        username: string;
        oldUserId: number;
    }[]
) => {
    const leftSideItems = currentTrades.filter(t => t.userId === leftSide.id);
    const rightSideItems = currentTrades.filter(t => t.userId === rightSide.id);

    if (leftSideItems.length === 0 && rightSideItems.length === 0) {
        console.log(`No trades found between ${leftSide.id} and ${rightSide.id}, skipping trade webhook`);
        return null;
    }

    // Build a lookup of itemId -> item name to list confirmed items from this cycle
    const itemIds = Array.from(new Set(currentTrades.map(t => t.itemId)));
    const itemLookup = itemIds.length > 0
        ? (await db.query.collectablesTable.findMany({
            where: inArray(collectablesTable.id, itemIds),
            columns: { id: true, name: true }
        })).reduce<Record<number, string>>((acc, item) => {
            acc[item.id] = item.name;
            return acc;
        }, {})
        : {};

    const formatTradeLine = (trade: { itemId: number; serial: number }) => {
        const name = itemLookup[trade.itemId] ?? `Item ${trade.itemId}`;
        return `${name} (#${trade.serial})`;
    };

        let desc = `Side 1: **${leftSide.username}** (${leftSide.id})`;
        let title = `${leftSide.username} <-> ${rightSide.username}`;

    const leftConfirmed = leftSideItems.map(formatTradeLine);
    const rightConfirmed = rightSideItems.map(formatTradeLine);

    if (leftSideItems.length > 0) {
        desc += `\n> Received ${leftSideItems.length} item${leftSideItems.length > 1 ? 's' : ''}`;
    } else {
        desc += `\n> Received nothing`;
    }
    if (leftConfirmed.length > 0) {
        desc += `\n${leftConfirmed.map(item => `> ${item}`).join('\n')}`;
    }

    desc += `\n\nSide 2: **${rightSide.username}** (${rightSide.id})`;

    if (rightSideItems.length > 0) {
        desc += `\n> Received ${rightSideItems.length} item${rightSideItems.length > 1 ? 's' : ''}`;
    } else {
        desc += `\n> Received nothing, posssibly currency trade`;
    }
    if (rightConfirmed.length > 0) {
        desc += `\n${rightConfirmed.map(item => `> ${item}`).join('\n')}`;
    }

    // Add condensed trade history at the bottom
    desc += `\n\n**Possible Items (recent trades, 6h)**`;
    
    const leftHistory = history.filter(h => h.userId === leftSide.id);
    const rightHistory = history.filter(h => h.userId === rightSide.id);

    if (leftHistory.length > 0) {
        desc += `\n${leftSide.username}: `;
        desc += leftHistory.map(h => `[${h.item.name}](https://polytoria.trade/store/${h.item.id})`).join(', ');
    }

    if (rightHistory.length > 0) {
        desc += `\n${rightSide.username}: `;
        desc += rightHistory.map(h => `[${h.item.name}](https://polytoria.trade/store/${h.item.id})`).join(', ');
    }

    if (leftHistory.length === 0 && rightHistory.length === 0) {
        desc += `\n> No other recent trades found`;
    }

    return {
        title: title,
        description: desc,
        color: 15680580,
        timestamp: new Date().toISOString(),
    };
}

export const sendTradeWebhooks = async (embeds: any[]) => {
    if (embeds.length === 0) return;

    // Discord allows max 10 embeds per message
    const chunks = [];
    for (let i = 0; i < embeds.length; i += 10) {
        chunks.push(embeds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
        const payload = JSON.stringify({
            username: "LOVE Trades",
            avatar_url: "https://polytoria.trade/bot_icon.png",
            embeds: chunk
        });

        try {
            const res = await fetch(process.env.TRADES_WEBHOOK_URL!, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: payload
            });
            const json = await res.json();
            console.log(res.status, json);
        } catch (error) {
            console.error(`Failed to send trade webhook:`, error);
        }

        // Small delay between chunks to avoid rate limiting
        if (chunks.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

type PRIORITY_TYPES = "INFO" | "WARNING" | "ERROR";

export const helpfulPrint = async (message: string, priority: PRIORITY_TYPES = "INFO", noWebhook: boolean = false) => {
    console.log(`\x1b[0;92;49m[${priority}] \x1b[0m${message}`);
    if (noWebhook) return;

    const body = JSON.stringify({
        username: "LOVE Alerts",
        avatar_url: "https://polytoria.trade/bot_icon.png",
        embeds: [
            {
                title: (priority === "ERROR" ? ":x:  " : priority === "WARNING" ? ":warning:  " : ":information_source:  ") + priority.charAt(0).toUpperCase() + priority.slice(1),
                description: message,
                color: priority === "ERROR" ? 14495300 : priority === "WARNING" ? 16763981 : 3901635,
                timestamp: new Date().toISOString(),
            }
        ]
    });

    console.log(body)

    try {
        const res = await fetch(process.env.ALERTS_WEBHOOK_URL!, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: body
        });
        const json = await res.json();
        console.log(res.status, json);
    } catch {
        console.error(`Failed to send alert: ${message}`);
    }
}

export const helpfulPrintWithDbAttachment = async (message: string, priority: PRIORITY_TYPES = "INFO") => {
    console.log(`\x1b[0;92;49m[${priority}] \x1b[0m${message}`);

    const webhookUrl = process.env.ALERTS_WEBHOOK_URL;
    if (!webhookUrl) return;

    const embed = {
        username: "LOVE Alerts",
        avatar_url: "https://polytoria.trade/bot_icon.png",
        embeds: [
            {
                title: (priority === "ERROR" ? ":x:  " : priority === "WARNING" ? ":warning:  " : ":information_source:  ") + priority.charAt(0).toUpperCase() + priority.slice(1),
                description: message,
                color: priority === "ERROR" ? 14495300 : priority === "WARNING" ? 16763981 : 3901635,
                timestamp: new Date().toISOString(),
            }
        ]
    };

    const form = new FormData();
    form.append("payload_json", JSON.stringify(embed));

    const dbUrl = process.env.TRADE_HISTORY_DB;
    let dbPath: string | undefined;
    if (dbUrl && dbUrl.startsWith("file:")) {
        dbPath = dbUrl.replace(/^file:/, "");
    }

    if (dbPath && existsSync(dbPath)) {
        try {
            const buffer = readFileSync(dbPath);
            const blob = new Blob([buffer], { type: "application/octet-stream" });
            const filename = dbPath.split(/\\|\//).pop() || "trade-history.db";
            form.append("files[0]", blob, filename);
        } catch (e) {
            console.error("Failed to read DB file for attachment:", e);
        }
    } else {
        console.warn("TRADE_HISTORY_DB not set to a file: URL or path does not exist; sending alert without attachment.");
    }

    try {
        const res = await fetch(webhookUrl, { method: "POST", body: form });
        const json = await res.json();
        console.log(res.status, json);
    } catch (e) {
        console.error("Failed to send alert with DB attachment:", e);
    }
}
