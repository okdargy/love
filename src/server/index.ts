import { z } from "zod";
import { like, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { collectablesStatsTable, collectablesTable } from "@/lib/db/schema";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
    searchItems: publicProcedure.input(z.string()).mutation(async (opts) => {
        return await db.query.collectablesTable.findMany({
            where: (collectables, { like, or }) => or(
                like(collectables.shorthand, `%${opts.input}%`),
                like(collectables.name, `%${opts.input}%`)
            ),
        });
    }),
    getItems: publicProcedure.input(z.object({
        offset: z.number().optional(),
        limit: z.number().optional(),
    })).mutation(async (opts) => {
        const limit = opts.input.limit ?? 10;
        const offset = opts.input.offset ?? 0;

        return await db.query.collectablesTable.findMany({ limit, offset });
    }),
    getItem: publicProcedure .input(z.number()).query(async (opts) => {
        return await db.query.collectablesTable.findFirst({ where: eq(collectablesTable.id, opts.input), with: { stats: true } });
    }),
});

export type AppRouter = typeof appRouter;