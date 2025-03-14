import { int, sqliteTable } from "drizzle-orm/sqlite-core";

export const itemsTable = sqliteTable("items", {
    id: int("id").notNull().primaryKey(),
    bestPrice: int("bestPrice").default(0).notNull(),
    totalSellers: int("totalSellers").default(0).notNull(),
});

export const serialsTable = sqliteTable("serials", {
    itemId: int("itemId").references(() => itemsTable.id).notNull(),
    serial: int("serial").notNull(),
    userId: int("userId").notNull(),
});