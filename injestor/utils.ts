import { collectablesTable, tradeHistoryTable } from "@/lib/db/schema";
import { Listing } from "./types";
import { db } from "@/lib/db";
import { eq, InferSelectModel } from "drizzle-orm";

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
                }).join("  ")}` : "",
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
                    }
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

export const processTrade = async (newOwner: {
    id: number;
    username: string;
}, oldOwner: {
    id: number;
}, history: TradeHistoryWithItem[]) => {
    let isBlank = true;
    const newOwnerHistory = history.filter(h => h.userId === newOwner.id);
    const oldOwnerHistory = history.filter(h => h.userId === oldOwner.id);

    if (newOwnerHistory.length === 0 && oldOwnerHistory.length === 0) {
        console.log(`No trade history found for users ${newOwner.id} and ${oldOwner.id}, skipping trade webhook`);
        return;
    }

    let desc = `Side 1: **${newOwner.username}** (${newOwner.id})`;
    let title = `${newOwner.username} (${newOwner.id}) transferred items with`;

    if (newOwnerHistory.length > 0) {
        isBlank = false;
        for (const h of newOwnerHistory) {
            desc += `\n> [${h.item.name}](https://polytoria.trade/store/${h.item.id}) - <t:${Math.floor(new Date(h.created_at + ' UTC').getTime() / 1000)}:R>`;
        }
    } else {
        desc += `\n> No recent trades found`;
    }

    if (oldOwnerHistory.length > 0) {
        isBlank = false;
        title += ` ${oldOwnerHistory[0].username} (${oldOwner.id})`;
        desc += `\n\nSide 2: **${oldOwnerHistory[0].username}** (${oldOwner.id})`;

        for (const h of oldOwnerHistory) {
            desc += `\n> [${h.item.name}](https://polytoria.trade/store/${h.item.id}) - <t:${Math.floor(new Date(h.created_at + ' UTC').getTime() / 1000)}:R>`;
        }
    } else {
        title += ` - (${oldOwner.id})`;
        desc += `\n\nSide 2: **-** (${oldOwner.id})\n> No recent trades found`;
    }


    const payload = JSON.stringify({
        username: "LOVE Trades",
        avatar_url: "https://polytoria.trade/bot_icon.png",
        embeds: [
            {
                title: title,
                description: desc,
                color: isBlank ? 0 : 15680580,
                timestamp: new Date().toISOString(),
            }
        ]
    });

    const res = await fetch(process.env.TRADES_WEBHOOK_URL!, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: payload
    });
    const json = await res.json();
    console.log(res.status, json);
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
