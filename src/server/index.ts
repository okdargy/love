import { z } from "zod";
import { like, eq, count, or, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { collectablesStatsTable, collectablesTable } from "@/lib/db/schema";
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

        return { items, totalPages };
    }),
    getItem: publicProcedure.input(z.number().min(1)).query(async (opts) => {
        return await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, opts.input), with: { stats: true } });
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
    })).mutation(async (opts) => {
        const { id, ...stats } = opts.input;

        // first, check if user is admin, editor, or developer
        const { user } = await validateRequest();

        if (!user || user.role === "user") {
            throw new Error("You do not have permission to edit items");
        }

        // check if item exists
        const item = await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, id) });

        if (!item) {
            throw new Error("Item does not exist");
        } else {
            console.log(item);
        }

        // update item stats
        await db.update(collectablesStatsTable).set(stats).where(eq(collectablesStatsTable.id, id));
    }),
});

export type AppRouter = typeof appRouter;