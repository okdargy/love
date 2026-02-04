import { z } from "zod";
import { like, eq, count, or, desc, and, inArray, InferSelectModel, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { collectablesStatsTable, collectablesTable, itemTagsTable, auditLogsTable, tradeHistoryTable, tagsTable, listingsHistoryTable } from "@/lib/db/schema";
import { publicProcedure, router } from "./trpc";
import { validateRequest } from "@/lib/auth";
import type { User } from "lucia";
import { USER_AGENT } from "@/lib/utils";

const sanitizeSearchInput = (input: string | undefined) => {
    if(!input) return input;
    return input.replace(/[^a-zA-Z0-9+\s']/g, '');
}; 

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const RISING_EMOJI = "<:rising:1226349827843948586>"
const DECREASING_EMOJI = "<:decreasing:1226349823985193030>"

const userConnectionCodes = new Map<string, {
    code: string;
    polytoriaUserId: number;
    polytoriaUsername: string;
    expiresAt: number;
    userId: string;
}>();

const connectionRateLimit = new Map<string, number>();

const generateConnectionCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of userConnectionCodes.entries()) {
        if (now > data.expiresAt) {
            userConnectionCodes.delete(userId);
        }
    }
}, 5 * 60 * 1000);


const sendValueChangeAlert = ({
    item,
    stats,
    author,
    newValue,
    reason,
}: {
    item: InferSelectModel<typeof collectablesTable>;
    stats: InferSelectModel<typeof collectablesStatsTable>;
    author: User;
    newValue: number | null;
    reason: string;
}) => {
    let embedColor: number;
    
    if (stats.value !== null && newValue === null) {
        embedColor = 2303786;
    } else if (stats.value === null && newValue !== null) {
        embedColor = 2850815;
    } else if (stats.value !== null && newValue !== null) {
        if (newValue > stats.value) {
            embedColor = 5763719;
        } else if (newValue < stats.value) {
            embedColor = 15548997;
        } else {
            embedColor = 16777215;
        }
    }

    const payload = JSON.stringify({
        username: "LOVE Updates",
        avatar_url: "https://polytoria.trade/bot_icon.png",
        content: `<@&${process.env.VALUE_ROLE_ID}>`,
        embeds: [
            {
                title: `${item.name} ${item.shorthand ? "(" + item.shorthand + ")" : ""}`,
                description: `${stats.value !== null ? formatNumber(stats.value) : "N/A"} ➡ ${newValue === null ? "N/A" : formatNumber(newValue)}   ${newValue !== null && stats.value ? (newValue > stats.value ? RISING_EMOJI : newValue < stats.value ? DECREASING_EMOJI : "") : ""}${reason ? `\n> **Reason:** ${reason}` : ""}`,
                thumbnail: {
                    url: item.thumbnailUrl,
                },
                footer: {
                    "text": author.display_name || author.username,
                    "icon_url": author.avatar ? `https://cdn.discordapp.com/avatars/${author.discordId}/${author.avatar}.webp?size=44` : "https://polytoria.trade/bot_icon.png"
                },
                timestamp: new Date().toISOString(),
                ...(embedColor ? { color: embedColor } : {})
            }
        ]
    });

    fetch(process.env.VALUE_WEBHOOK_URL!, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: payload
    });
}

export const appRouter = router({
    searchItems: publicProcedure.input(z.object({
        input: z.string(),
        limit: z.number().min(1).max(25).optional(),
        offset: z.number().min(1).optional(),
    })).mutation(async (opts) => {
        const sanitizedInput = sanitizeSearchInput(opts.input.input);

        return await db.query.collectablesTable.findMany({
            where: (collectables, { like, or }) => or(
                like(collectables.shorthand, `%${sanitizedInput}%`),
                like(collectables.name, `%${sanitizedInput}%`)
            ),
            limit: opts.input.limit ?? 10,
            offset: opts.input.offset ?? 0,
        });
    }),
    getItems: publicProcedure.input(z.object({
        offset: z.number().min(1).optional(),
        limit: z.number().min(1).max(25).optional(),
    })).mutation(async (opts) => {
        const limit = opts.input.limit ?? 10;
        const offset = opts.input.offset ?? 0;

        return await db.query.collectablesTable.findMany({ limit, offset, with: { stats: true }});
    }),
    getItemsByPage: publicProcedure.input(z.object({
        page: z.number().min(1).default(1),
        total: z.number().min(1).max(25).default(10),
        search: z.string().optional(),
        homepage: z.boolean().optional(),
        filters: z.object({
            sortBy: z.string(),
            order: z.string(),
            types: z.array(z.string().regex(/^[a-zA-Z0-9]+$/)),
        }).optional(),
    })).mutation(async (opts) => {
        const offset = (opts.input.page - 1) * opts.input.total;
        const limit = opts.input.total;

        const sanitizedSearch = sanitizeSearchInput(opts.input.search) ?? "";
        let searchCondition = opts.input.search
        ? or(
            like(collectablesTable.shorthand, `%${sanitizedSearch}%`),
            like(collectablesTable.name, `%${sanitizedSearch}%`)
        )
        : undefined;

        const sortOptions: { [key: string]: any } = {
            date: collectablesTable.id,
            recent: collectablesTable.recentAverage,
            stock: collectablesTable.stock,
        };

        let sortOrder = [desc(collectablesTable.id)];

        if(opts.input.filters) {
            const { sortBy, order, types } = opts.input.filters;

            if(sortOptions[sortBy]) {
                sortOrder = [order === "asc" ? sortOptions[sortBy] : desc(sortOptions[sortBy])];
            }

            if(types && types.length > 0) {
                searchCondition = and(searchCondition, inArray(collectablesTable.type, types));
            }
        }

        const [totalCount] = await db.select({ count: count() }).from(collectablesTable).where(searchCondition);
        const totalPages = Math.ceil(totalCount.count / limit);

        const rawItems = await db
            .select({
                id: collectablesTable.id,
                name: collectablesTable.name,
                shorthand: collectablesTable.shorthand,
                thumbnailUrl: collectablesTable.thumbnailUrl,
                recentAverage: collectablesTable.recentAverage,
                ...(opts.input.homepage ? {} : {
                    type: collectablesTable.type,
                    description: collectablesTable.description,
                    price: collectablesTable.price,
                    stock: collectablesTable.stock,
                    created_at: collectablesTable.created_at,
                    updated_at: collectablesTable.updated_at,
                }),
                tags: sql<string>`COALESCE(
                    (SELECT json_group_array(json_array(item_tags.itemId, item_tags.tagId))
                    FROM item_tags
                    WHERE item_tags.itemId = collectables.id),
                    json_array()
                )`.as('tags'),
                stats: sql<string>`COALESCE(
                    (SELECT json_array(
                        collectables_stats.id,
                        collectables_stats.value,
                        collectables_stats.demand,
                        collectables_stats.trend,
                        collectables_stats.funFact,
                        collectables_stats.created_at,
                        collectables_stats.updated_at
                    )
                    FROM collectables_stats
                    WHERE collectables_stats.id = collectables.id
                    LIMIT 1),
                    json_array()
                )`.as('stats')
            })
            .from(collectablesTable)
            .where(searchCondition)
            .orderBy(...sortOrder)
            .limit(limit)
            .offset(offset);
        
        const items = rawItems.map(item => {
            const parsedTags = JSON.parse(item.tags as string);
            const parsedStats = JSON.parse(item.stats as string);
            
            return {
                ...item,
                tags: parsedTags.filter((tag: any) => tag[0] !== null && tag[1] !== null).map((tag: any) => ({
                    itemId: tag[0],
                    tagId: tag[1]
                })),
                stats: parsedStats.length > 0 ? {
                    id: parsedStats[0],
                    value: parsedStats[1],
                    demand: parsedStats[2],
                    trend: parsedStats[3],
                    funFact: parsedStats[4],
                    created_at: parsedStats[5],
                    updated_at: parsedStats[6]
                } : null
            };
        });

        const searchItem = items.findIndex(item => item.shorthand && item.shorthand.toLowerCase() === sanitizedSearch.toLowerCase());

        if (searchItem > -1) {
            const [item] = items.splice(searchItem, 1);
            items.unshift(item);
        }

        const allTags = await db.query.tagsTable.findMany({
            columns: {
                id: true,
                name: true,
                emoji: true
            }
        });

        return { items, totalPages, allTags };
    }),
    getItem: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        return await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, opts.input), with: { stats: true, tags: true } });
    }),
    getMetadataItem: publicProcedure.input(z.number().min(1)).mutation(async (opts) => {
        const item = await db.query.collectablesTable.findFirst({
            where: eq(collectablesTable.id, opts.input),
            columns: {
                id: true,
                name: true,
                description: true,
                thumbnailUrl: true,
            }
        });

        return (item ? item : {})
    }),
    getItemWithTags: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        try {
            const item = await db.query.collectablesTable.findFirst({
                where: eq(collectablesTable.id, opts.input),
                with: {
                    stats: true,
                    tags: true,
                }
            });

            if(!item) {
                throw new Error("Item not found");
            }

            const allTags = await db.query.tagsTable.findMany({
                columns: {
                    id: true,
                    name: true,
                    emoji: true
                }
            });

            const latestListing = await db.query.listingsHistoryTable.findFirst({
                where: eq(listingsHistoryTable.itemId, opts.input),
                orderBy: [desc(listingsHistoryTable.created_at)],
                columns: {
                    bestPrice: true,
                    sellers: true,
                    created_at: true
                }
            });

            return { item, allTags, latestListing };
        } catch (e) {
            console.error(e);
        }
    }),
    editItemStats: publicProcedure.input(z.object({
        id: z.number().min(1),
        value: z.number().nullable().optional(),
        demand: z.enum(["awful", "low", "normal", "high", "great", ""]).optional(),
        trend: z.enum(["stable", "unstable", "fluctuating", "rising", "lowering", ""]).optional(),
        funFact: z.string().optional(),
        valueLow: z.number().nullable().optional(),
        valueHigh: z.number().nullable().optional(),
        valueNote: z.string().optional(),
        rare: z.boolean().optional(),
        freaky: z.boolean().optional(),
        projected: z.boolean().optional(),
        tags: z.array(z.number()).optional(),
        shorthand: z.string().optional(),
        alertOthers: z.boolean().optional(),
        alertReason: z.string().optional(),
    }).refine(
        (data) => {
            const hasLow = data.valueLow !== undefined && data.valueLow !== null;
            const hasHigh = data.valueHigh !== undefined && data.valueHigh !== null;
            return hasLow === hasHigh;
        },
        {
            message: "Both valueLow and valueHigh must be provided together, or both must be empty",
            path: ["valueLow"],
        }
    )).mutation(async (opts) => {
        const { id, tags, shorthand, alertOthers, alertReason, ...stats } = opts.input;
        const { user } = await validateRequest();

        if (!user || user.role === "user") {
            throw new Error("You do not have permission to edit items");
        }

        const item = await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, id), with: { tags: true, stats: true } });

        if (!item) {
            throw new Error("Item does not exist");
        }

        if (alertOthers && alertReason) {
            sendValueChangeAlert({
                item,
                stats: item.stats,
                author: user,
                newValue: stats.value ?? null,
                reason: alertReason,
            });
        }

        const filteredStats = Object.fromEntries(
            Object.entries(stats).filter(([_, value]) => value !== undefined)
        );

        return await db.transaction(async (tx) => {
            let logData: { id: number; tags: number[] | undefined; shorthand?: string } = { id, ...filteredStats, tags };

            if (Object.keys(filteredStats).length > 0) {
                await tx.update(collectablesStatsTable).set(filteredStats).where(eq(collectablesStatsTable.id, id));
            }

            if (tags && tags.length > 0) {
                const existingTagIds = item.tags.map(tag => tag.tagId);
        
                const tagsToAdd = tags.filter(tagId => !existingTagIds.includes(tagId));
                const tagsToRemove = existingTagIds.filter(tagId => !tags.includes(tagId));

                if (tagsToAdd.length > 0) {
                    const tagInserts = tagsToAdd.map(tagId => ({
                        itemId: id,
                        tagId: tagId
                    }));
                    
                    await tx.insert(itemTagsTable).values(tagInserts);
                }
        
                if (tagsToRemove.length > 0) {
                    await tx.delete(itemTagsTable).where(and(eq(itemTagsTable.itemId, id), inArray(itemTagsTable.tagId, tagsToRemove)));
                }
            } else if (tags && tags.length === 0 && item.tags.length > 0) {
                await tx.delete(itemTagsTable).where(eq(itemTagsTable.itemId, id));
            }

            if (shorthand !== undefined && shorthand !== item.shorthand && user.role === "admin") {
                const shorthandValue = shorthand === "" ? null : shorthand;
                logData = { ...logData, shorthand: shorthandValue };
                await tx.update(collectablesTable).set({ shorthand: shorthandValue }).where(eq(collectablesTable.id, id));
            }
            
            await tx.insert(auditLogsTable).values({
                userId: user.id,
                action: 'edit',
                where: 'collectables',
                payload: JSON.stringify(logData),
            });
        });
    }),
    getAuditLogs: publicProcedure.input(z.object({
        page: z.number().min(1),
        total: z.number().min(1).max(25),
    })).mutation(async (opts) => {
        const { user } = await validateRequest();

        if (!user || user.role === "user") {
            throw new Error("You do not have permission to view audit logs");
        }

        const offset = (opts.input.page - 1) * opts.input.total;
        const limit = opts.input.total;

        const [totalCount] = await db.select({ count: count() }).from(auditLogsTable);
        const totalPages = Math.ceil(totalCount.count / limit);

        const logs = await db.query.auditLogsTable.findMany({
            limit,
            offset,
            orderBy: [desc(auditLogsTable.id)],
            with: { user: true }
        });

        return { logs, totalPages };
    }),
    addTag: publicProcedure.input(z.object({
        name: z.string().min(3),
        emoji: z.string().min(1).regex(/[\p{Emoji_Presentation}|\p{Extended_Pictographic}]/u),
    })).mutation(async (opts) => {
        const { user } = await validateRequest();

        if (!user || user.role !== "admin") {
            throw new Error("You do not have permission to add tags");
        }

        await db.transaction(async (tx) => {
            const { name, emoji } = opts.input;
            await tx.insert(tagsTable).values({ name, emoji }).execute();
            await tx.insert(auditLogsTable).values({
                userId: user.id,
                action: 'add',
                where: 'tags',
                payload: JSON.stringify({ name, emoji }),
            });
        });

        return {
            success: true
        }
    }),
    searchTags: publicProcedure.input(z.string().optional()).mutation(async (opts) => {
        return await db.query.tagsTable.findMany({
            limit: 5,
            ...(opts.input ? { where: like(tagsTable.name, `%${opts.input}%`) } : {})
        });
    }),
    removeTag: publicProcedure.input(z.number().min(1)).mutation(async (opts) => {
        const { user } = await validateRequest();

        if (!user || user.role !== "admin") {
            throw new Error("You do not have permission to remove tags");
        }  

        await db.transaction(async (tx) => {
            await tx.delete(itemTagsTable).where(eq(itemTagsTable.tagId, opts.input));
            await tx.delete(tagsTable).where(eq(tagsTable.id, opts.input));

            await tx.insert(auditLogsTable).values({
                userId: user.id,
                action: 'remove',
                where: 'tags',
                payload: JSON.stringify({ id: opts.input }),
            });
        });

        return {
            success: true
        }
    }),
    editTag: publicProcedure.input(z.object({
        id: z.number().min(1),
        name: z.string().min(3),
        emoji: z.string().min(1).regex(/[\p{Emoji_Presentation}|\p{Extended_Pictographic}]/u),
    })).mutation(async (opts) => {
        const { user } = await validateRequest();

        if (!user || user.role !== "admin") {
            throw new Error("You do not have permission to edit tags");
        }

        await db.transaction(async (tx) => {
            await tx.update(tagsTable).set(opts.input).where(eq(tagsTable.id, Number(opts.input.id)));
            await tx.insert(auditLogsTable).values({
                userId: user.id,
                action: 'edit',
                where: 'tags',
                payload: JSON.stringify(opts.input),
            });
        });

        return {
            success: true
        }
    }),
    getAllItemOwners: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        const id = opts.input;
        
        let allOwners: Inventory[] = [];
        let page = 1;
        let hasMore = true;
    
        do {
            try {
                const response = await fetch(`https://api.polytoria.com/v1/store/${id}/owners?limit=100&page=${page}`, {
                    headers: {
                        "User-Agent": USER_AGENT
                    }
                });
                
                // Check if the response is not OK
                if (!response.ok) {
                    console.error(`API request failed with status ${response.status}: ${response.statusText}`);
                    
                    // If it's a 403/Forbidden or 404, break the loop instead of continuing
                    if (response.status === 403 || response.status === 404) {
                        console.warn(`Item ${id} owners data is not accessible (${response.status}). Returning empty results.`);
                        break;
                    }
                    
                    throw new Error(`Error fetching data: ${response.statusText}`);
                }

                // Check content type to ensure we're getting JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.error(`Expected JSON but received ${contentType}`);
                    const text = await response.text();
                    console.error(`Response body: ${text.substring(0, 200)}...`);
                    break;
                }
    
                const data: OwnersResponse = await response.json();
    
                // Validate the response structure
                if (!data.inventories || !Array.isArray(data.inventories)) {
                    console.error(`Invalid response structure:`, data);
                    break;
                }

                if (data.inventories.length === 0) {
                    break;
                }
    
                allOwners.push(...data.inventories);

                hasMore = page < (data.pages || 1);
                page++;

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Failed to fetch owners on page ${page}:`, error);
                hasMore = false;
            }
        } while (hasMore);
    
        const ownerMap: { [key: string]: { username: string; id: number; serials: number[] } } = {};
    
        allOwners.forEach(inventory => {
            const owner = inventory.user;
            
            if (!ownerMap[owner.id]) {
                ownerMap[owner.id] = { username: owner.username, id: owner.id, serials: [] };
            }
            ownerMap[owner.id].serials.push(inventory.serial);
        });
    
        const sortedOwners = Object.values(ownerMap).sort((a, b) => b.serials.length - a.serials.length);
    
        return sortedOwners;
    }),
    getSerialHistory: publicProcedure.input(z.object({
        id: z.number().min(1),
        serial: z.number().min(1),
    })).query(async (opts) => {
        try {
            const res = await db.query.tradeHistoryTable.findMany({
                where: and(
                    eq(tradeHistoryTable.itemId, opts.input.id),
                    eq(tradeHistoryTable.serial, opts.input.serial)
                ),
                orderBy: [desc(tradeHistoryTable.id)]
            });

            const itemInfo = await db.query.collectablesTable.findFirst({
                where: eq(collectablesTable.id, opts.input.id)
            });

            return { history: res, itemInfo };
        } catch (e) {
            console.error(e);
        }
    }),
    getRecentItemHistory: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        try {
            const res = db.query.tradeHistoryTable.findMany({
                where: and(eq(tradeHistoryTable.itemId, opts.input), eq(tradeHistoryTable.isFirst, false)),
                orderBy: [desc(tradeHistoryTable.id)],
                limit: 5
            });

            return res;
        } catch (e) {
            console.error(e);
        }
    }),
    getAllRecentHistory: publicProcedure.input(z.object({
        limit: z.number().min(1).max(25).optional(),
        offset: z.number().min(0).optional(),
    })).mutation(async (opts) => {
        try {
            const res = db.query.tradeHistoryTable.findMany({
                where: eq(tradeHistoryTable.isFirst, false),
                orderBy: [desc(tradeHistoryTable.id)],
                limit: opts.input.limit ?? 10,
                offset: opts.input.offset ?? 0
            });

            return res;
        } catch (e) {
            console.error(e);
        }
    }),
    getUsersLatestHistory: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        try {
            const res = db.query.tradeHistoryTable.findMany({
                where: and(eq(tradeHistoryTable.userId, opts.input), eq(tradeHistoryTable.isFirst, false)),
                orderBy: [desc(tradeHistoryTable.id)],
                limit: 5,
                with: { item: true }
            });

            return res;
        } catch (e) {
            console.error(e);
        }
    }),
    getItemGraph: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        try {
            const res = await fetch("https://polytoria.com/api/store/price-data/" + opts.input, {
                headers: {
                    "User-Agent": USER_AGENT
                }
            });
            const json = await res.json();

            const listings = await db.query.listingsHistoryTable.findMany({
                where: eq(listingsHistoryTable.itemId, opts.input),
                orderBy: [desc(listingsHistoryTable.id)],
                columns: {
                    bestPrice: true,
                    sellers: true,
                    created_at: true
                }
            });

            return { res: json, listings: listings };
        } catch (e) {
            console.error(e);
        }
    }),
    initializeUserConnection: publicProcedure.input(z.object({
        username: z.string().min(1).max(50),
    })).mutation(async (opts) => {
        const { user } = await validateRequest();

        if (!user) {
            throw new Error("You must be logged in to connect a Polytoria account");
        }

        const now = Date.now();
        const lastRequest = connectionRateLimit.get(user.id);
        if (lastRequest && now - lastRequest < 30000) {
            const remainingTime = Math.ceil((30000 - (now - lastRequest)) / 1000);
            throw new Error(`Please wait ${remainingTime} seconds before requesting another code`);
        }

        try {
            const response = await fetch(`https://api.polytoria.com/v1/users/find?username=${encodeURIComponent(opts.input.username)}`, {
                headers: {
                    "User-Agent": USER_AGENT
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to find user on Polytoria");
            }

            const polytoriaUser = await response.json();
            
            if (!polytoriaUser.id || !polytoriaUser.username) {
                throw new Error("User not found on Polytoria");
            }

            userConnectionCodes.delete(user.id);

            const rawCode = generateConnectionCode();
            const code = "pt-" + rawCode;
            const expiresAt = now + (5 * 60 * 1000); // 5 minutes from now

            userConnectionCodes.set(user.id, {
                code,
                polytoriaUserId: polytoriaUser.id,
                polytoriaUsername: polytoriaUser.username,
                expiresAt,
                userId: user.id
            });

            connectionRateLimit.set(user.id, now);

            return {
                code,
                polytoriaUsername: polytoriaUser.username,
                polytoriaUserId: polytoriaUser.id,
                expiresAt,
                message: `Add the code "${code}" to your Polytoria bio and then verify your account.`
            };
        } catch (error) {
            console.error("Error initializing user connection:", error);
            throw new Error("Failed to initialize connection. Please check the username and try again.");
        }
    }),
    verifyUser: publicProcedure.mutation(async () => {
        const { user } = await validateRequest();

        if (!user) {
            throw new Error("You must be logged in to verify a Polytoria account");
        }

        const codeData = userConnectionCodes.get(user.id);
        
        if (!codeData) {
            throw new Error("No connection code found. Please initialize a connection first.");
        }

        if (Date.now() > codeData.expiresAt) {
            userConnectionCodes.delete(user.id);
            throw new Error("Connection code has expired. Please request a new one.");
        }

        try {
            const response = await fetch(`https://api.polytoria.com/v1/users/${codeData.polytoriaUserId}`, {
                headers: {
                    "User-Agent": USER_AGENT
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to fetch user profile from Polytoria");
            }

            const polytoriaProfile = await response.json();
            
            const bio = polytoriaProfile.description || "";
            
            if (!bio.includes(codeData.code)) {
                throw new Error(`Code "${codeData.code}" not found in your Polytoria bio. Please add it to your bio and try again.`);
            }

            userConnectionCodes.delete(user.id);

            // TODO: Store the verified connection in the database
            console.log(`User ${user.id} successfully verified Polytoria account ${polytoriaProfile.username} (ID: ${polytoriaProfile.id})`);

            return {
                success: true,
                polytoriaUsername: polytoriaProfile.username,
                polytoriaUserId: polytoriaProfile.id,
                message: "Successfully verified your Polytoria account!"
            };
        } catch (error) {
            console.error("Error verifying user connection:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to verify connection. Please try again.");
        }
    }),
    searchCalculatorItems: publicProcedure.input(z.object({
        input: z.string(),
        limit: z.number().min(1).max(25).optional(),
        offset: z.number().min(1).optional(),
    })).mutation(async (opts) => {
        const sanitizedInput = sanitizeSearchInput(opts.input.input);

        return await db
            .select({
                id: collectablesTable.id,
                name: collectablesTable.name,
                shorthand: collectablesTable.shorthand,
                thumbnailUrl: collectablesTable.thumbnailUrl,
                recentAverage: collectablesTable.recentAverage,
                value: collectablesStatsTable.value
            })
            .from(collectablesTable)
            .leftJoin(collectablesStatsTable, eq(collectablesTable.id, collectablesStatsTable.id))
            .where(
                or(
                    like(collectablesTable.shorthand, `%${sanitizedInput}%`),
                    like(collectablesTable.name, `%${sanitizedInput}%`)
                )
            )
            .orderBy(desc(collectablesStatsTable.value))
            .limit(opts.input.limit ?? 10)
            .offset(opts.input.offset ?? 0);
    }),
    getTopValueItems: publicProcedure.input(z.object({
        limit: z.number().min(1).max(50).default(25)
    })).query(async (opts) => {
        return await db
            .select({
                id: collectablesTable.id,
                name: collectablesTable.name,
                shorthand: collectablesTable.shorthand,
                thumbnailUrl: collectablesTable.thumbnailUrl,
                recentAverage: collectablesTable.recentAverage,
                value: collectablesStatsTable.value
            })
            .from(collectablesTable)
            .innerJoin(collectablesStatsTable, eq(collectablesTable.id, collectablesStatsTable.id))
            .where(sql`${collectablesStatsTable.value} IS NOT NULL`)
            .orderBy(desc(collectablesStatsTable.value))
            .limit(opts.input.limit);
    })
});

export type AppRouter = typeof appRouter;

export interface InvUser {
    id: number;
    username: string;
}

export interface Inventory {
    serial: number;
    purchasedAt: string;
    user: InvUser;
}

export interface OwnersResponse {
    inventories: Inventory[];
    pages: number;
    total: number;
}