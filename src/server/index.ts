import { z } from "zod";
import { like, eq, count, or, desc, and, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { collectablesStatsTable, collectablesTable, tagsTable, itemTagsTable } from "@/lib/db/schema";
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
    })).mutation(async (opts) => {
        const offset = (opts.input.page - 1) * opts.input.total;
        const limit = opts.input.total;

        const sanitizedSearch = sanitizeSearchInput(opts.input.search);
        const searchCondition = opts.input.search
            ? or(
                like(collectablesTable.shorthand, `%${sanitizedSearch}%`),
                like(collectablesTable.name, `%${sanitizedSearch}%`)
            )
            : undefined;

        const [totalCount] = await db.select({ count: count() }).from(collectablesTable).where(searchCondition);
        const totalPages = Math.ceil(totalCount.count / limit);

        const items = await db.query.collectablesTable.findMany({
            limit,
            offset,
            where: searchCondition,
            orderBy: [desc(collectablesTable.id)],
            with: { stats: true }
        });

        const searchItem = items.findIndex(item => item.shorthand && item.shorthand.toLowerCase() === sanitizedSearch.toLowerCase());

        if (searchItem > -1) {
            const [item] = items.splice(searchItem, 1);
            items.unshift(item);
        }

        return { items, totalPages };
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
        value: z.number().optional(),
        demand: z.enum(["awful", "low", "normal", "great", "high"]).optional(),
        trend: z.enum(["stable", "unstable", "fluctuating"]).optional(),
        funFact: z.string().optional(),
        effect: z.string().optional(),
        rare: z.boolean().optional(),
        freaky: z.boolean().optional(),
        projected: z.boolean().optional(),
        tags: z.array(z.number()).optional(),
    })).mutation(async (opts) => {
        const { id, tags, ...stats } = opts.input;

        const { user } = await validateRequest();

        if (!user || user.role === "user") {
            throw new Error("You do not have permission to edit items");
        }

        // check if item exists
        const item = await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, id), with: { tags: true } });

        if (!item) {
            throw new Error("Item does not exist");
        } else {
            console.log(item);
        }

        const filteredStats = Object.fromEntries(
            Object.entries(stats).filter(([_, value]) => value !== undefined && value !== null)
        );

        return await db.transaction(async (tx) => {
            // Update item stats
            if (Object.keys(filteredStats).length > 0) {
                console.log('check 0.5');
                await tx.update(collectablesStatsTable).set(filteredStats).where(eq(collectablesStatsTable.id, id));
            } else {
                console.log('No valid stats to update');
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
            }
        });
    }),
});

export type AppRouter = typeof appRouter;