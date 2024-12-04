import { z } from "zod";
import { like, eq, count, or, desc, and, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { collectablesStatsTable, collectablesTable, itemTagsTable, auditLogsTable, tradeHistoryTable } from "@/lib/db/schema";
import { publicProcedure, router } from "./trpc";
import { validateRequest } from "@/lib/auth";

const sanitizeSearchInput = (input: string) => {
    return input.replace(/[^a-zA-Z0-9\s']/g, '');
}; 

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
        page: z.number().min(1),
        total: z.number().min(1).max(25),
        search: z.string(),
        filters: z.object({
            sortBy: z.string(),
            order: z.string(),
            types: z.array(z.string())
        }).optional(),
    })).mutation(async (opts) => {
        const offset = (opts.input.page - 1) * opts.input.total;
        const limit = opts.input.total;

        const sanitizedSearch = sanitizeSearchInput(opts.input.search);
        let searchCondition = opts.input.search
        ? or(
            like(collectablesTable.shorthand, `%${sanitizedSearch}%`),
            like(collectablesTable.name, `%${sanitizedSearch}%`)
        )
        : undefined;

        const sortOptions: { [key: string]: any } = {
            date: collectablesTable.id
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

        const items = await db.query.collectablesTable.findMany({
            limit,
            offset,
            where: searchCondition,
            orderBy: sortOrder,
            with: { stats: true, tags: true }
        });

        const searchItem = items.findIndex(item => item.shorthand && item.shorthand.toLowerCase() === sanitizedSearch.toLowerCase());

        if (searchItem > -1) {
            const [item] = items.splice(searchItem, 1);
            items.unshift(item);
        }

        const allTags = await db.query.tagsTable.findMany();

        return { items, totalPages, allTags };
    }),
    getItem: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        return await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, opts.input), with: { stats: true, tags: true } });
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

            const allTags = await db.query.tagsTable.findMany();

            return { item, allTags };
        } catch (e) {
            console.error(e);
        }
    }),
    editItemStats: publicProcedure.input(z.object({
        id: z.number().min(1),
        value: z.number().nullable().optional(),
        demand: z.enum(["awful", "low", "normal", "great", "high", ""]).optional(),
        trend: z.enum(["stable", "unstable", "fluctuating", "rising", "lowering", ""]).optional(),
        funFact: z.string().optional(),
        rare: z.boolean().optional(),
        freaky: z.boolean().optional(),
        projected: z.boolean().optional(),
        tags: z.array(z.number()).optional(),
        shorthand: z.string().optional(),
    })).mutation(async (opts) => {
        const { id, tags, shorthand, ...stats } = opts.input;
        const { user } = await validateRequest();

        if (!user || user.role === "user") {
            throw new Error("You do not have permission to edit items");
        }

        // check if item exists
        const item = await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, id), with: { tags: true } });

        if (!item) {
            throw new Error("Item does not exist");
        }

        const filteredStats = Object.fromEntries(
            Object.entries(stats).filter(([_, value]) => value !== undefined)
        );

        return await db.transaction(async (tx) => {
            let logData: { id: number; tags: number[] | undefined; shorthand?: string } = { id, ...filteredStats, tags };

            console.log(filteredStats)
            if (Object.keys(filteredStats).length > 0) {
                console.log("Updating stats");
                await tx.update(collectablesStatsTable).set(filteredStats).where(eq(collectablesStatsTable.id, id));
            }

            // Update tags
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

            // Update shorthand if it's changed and user is an admin
            if (shorthand && shorthand !== item.shorthand && user.role === "admin") {
                logData = { ...logData, shorthand: shorthand };
                await tx.update(collectablesTable).set({ shorthand: shorthand }).where(eq(collectablesTable.id, id));
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
    getAllItemOwners: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        const id = opts.input;
        
        let allOwners: Inventory[] = [];
        let page = 1;
        let hasMore = true;
    
        do {
            try {
                const response = await fetch(`https://api.polytoria.com/v1/store/${id}/owners?limit=100&page=${page}`);
                if (!response.ok) {
                    throw new Error(`Error fetching data: ${response.statusText}`);
                }
    
                const data: OwnersResponse = await response.json();
    
                if (data.inventories.length === 0) {
                    break;
                }
    
                allOwners.push(...data.inventories);

                hasMore = page < data.pages;
                page++;
            } catch (error) {
                console.error(`Failed to fetch owners on page ${page}:`, error);
                hasMore = false;
            }
        } while (hasMore);
    
        // Create a map to count the number of items each owner has
        const ownerMap: { [key: string]: { username: string; id: number; serials: number[] } } = {};
    
        allOwners.forEach(inventory => {
            const owner = inventory.user;
            
            if (!ownerMap[owner.id]) {
                ownerMap[owner.id] = { username: owner.username, id: owner.id, serials: [] };
            }
            ownerMap[owner.id].serials.push(inventory.serial);
        });
    
        // Convert the map to an array and sort it by the number of items in descending order
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
                limit: 5
            });

            return res;
        } catch (e) {
            console.error(e);
        }
    }),
});

export type AppRouter = typeof appRouter;

export interface User {
    id: number;
    username: string;
}

export interface Inventory {
    serial: number;
    purchasedAt: string;
    user: User;
}

export interface OwnersResponse {
    inventories: Inventory[];
    pages: number;
    total: number;
}