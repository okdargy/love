import { int, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";

export const itemsTable = sqliteTable("items", {
    id: int("id").notNull().primaryKey(),
    bestPrice: int("bestPrice"),
    totalSellers: int("totalSellers"),
    averagePrice: int("averagePrice")
});

export const serialsTable = sqliteTable("serials", {
  itemId: int("itemId").references(() => itemsTable.id).notNull(),
  serial: int("serial").notNull(),
  userId: int("userId").notNull(),
}, (table) => ({
  uniq: uniqueIndex("serials_itemid_serial_unique").on(table.itemId, table.serial),
}));