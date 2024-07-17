import { z } from "zod";
import { like, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { collectablesStatsTable, collectablesTable } from "@/lib/db/schema";
import { publicProcedure, router } from "./trpc";
import { validateRequest } from "@/lib/auth";

export const appRouter = router({
    searchItems: publicProcedure.input(z.string()).mutation(async (opts) => {
        return await db.query.collectablesTable.findMany({
            where: (collectables, { like, or }) => or(
                like(collectables.shorthand, `%${opts.input}%`),
                like(collectables.name, `%${opts.input}%`)
            ),
            limit: 5,
        });
    }),
    getItems: publicProcedure.input(z.object({
        offset: z.number().optional(),
        limit: z.number().optional(),
    })).mutation(async (opts) => {
        const limit = opts.input.limit ?? 10;
        const offset = opts.input.offset ?? 0;

        return await db.query.collectablesTable.findMany({ limit, offset, with: { stats: true }});
    }),
    getItem: publicProcedure .input(z.number()).query(async (opts) => {
        return await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, opts.input), with: { stats: true } });
    }),
    editItemStats: publicProcedure.input(z.object({
        id: z.number(),
        value: z.number().optional(),
        demand: z.string().optional(),
        trend: z.string().optional(),
        ogStock: z.number().optional(),
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
            throw new Error("You do not have permission to edit item stats");
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