import { bigint, boolean, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

const nowEpochMs = sql`(extract(epoch from now()) * 1000)::bigint`;

export const userTable = pgTable("user", {
	id: text("id").notNull().primaryKey(),
	username: text("username").notNull(),
	discordId: text("discordId").notNull(),
	polytoriaId: integer("polytoriaId").references(() => polytoriaUserTable.id),
	display_name: text("display_name").notNull(),
	accessToken: text("accessToken").notNull(),
	refreshToken: text("refreshToken").notNull(),
	accessTokenExpiresAt: bigint("accessTokenExpiresAt", { mode: 'number' }).notNull(),
	avatar: text("avatar").notNull(),
	role: text('role', { enum: ['user', 'developer', 'admin', 'editor']}).default('user').notNull(),
	created_at: bigint("created_at", { mode: 'number' }).notNull().default(nowEpochMs),
	updated_at: bigint("updated_at", { mode: 'number' }).notNull().default(nowEpochMs),
});

export const polytoriaUserTable = pgTable("polytoria_user", {
	id: integer("id").notNull().primaryKey(),
	username: text("username").notNull(),
	thumbnailUrl: text("thumbnailUrl").notNull(),
});

export const polytoriaUserRelations = relations(polytoriaUserTable, ({ one }) => ({
	user: one(userTable)
}));

export const sessionTable = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => userTable.id),
	expiresAt: timestamp("expiresAt", { withTimezone: true, mode: 'date' }).notNull(),
});

export const collectablesTable = pgTable("collectables", {
	id: integer("id").notNull().primaryKey(),
	type: text("type").notNull(),
	name: text("name").notNull(),
	shorthand: text("shorthand"),
	description: text("description").notNull(),
	thumbnailUrl: text("thumbnailUrl"),
	price: bigint("price", { mode: 'number' }).notNull(),
	recentAverage: bigint("recentAverage", { mode: 'number' }),
	stock: bigint("stock", { mode: 'number' }),
	created_at: bigint("created_at", { mode: 'number' }).notNull().default(nowEpochMs),
	updated_at: bigint("updated_at", { mode: 'number' }).notNull().default(nowEpochMs)
});

export const tagsTable = pgTable("tags", {
	id: serial("id").primaryKey().notNull(),
    name: text("name").notNull(),
	emoji: text("emoji").notNull()
});

export const itemTagsTable = pgTable("item_tags", {
    itemId: integer("itemId").notNull().references(() => collectablesTable.id),
    tagId: integer("tagId").notNull().references(() => tagsTable.id),
}, (table) => [
	index("item_tags_item_id_index").on(table.itemId),
]);

export const collectablesStatsTable = pgTable("collectables_stats", {
	id: integer("id").notNull().references(() => collectablesTable.id).primaryKey(),
	value: bigint("value", { mode: 'number' }),
    demand: text("demand", { enum: ["awful", "low", "normal", "high", "great"] }),
    trend: text("trend", { enum: ["stable", "unstable", "fluctuating", "rising", "lowering"] }),
    funFact: text("funFact"),
	valueLow: bigint("valueLow", { mode: 'number' }),
	valueHigh: bigint("valueHigh", { mode: 'number' }),
    valueNote: text("valueNote"),
	created_at: bigint("created_at", { mode: 'number' }).notNull().default(nowEpochMs),
	updated_at: bigint("updated_at", { mode: 'number' }).notNull().default(nowEpochMs)
});

export const collectablesRelations = relations(collectablesTable, ({ one, many }) => ({
    stats: one(collectablesStatsTable, {
        relationName: 'stats',
        fields: [collectablesTable.id],
        references: [collectablesStatsTable.id],
    }),
    tags: many(itemTagsTable),
	listings: many(listingsHistoryTable),
}));

export const tagsRelations = relations(itemTagsTable, ({ one }) => ({
	item: one(collectablesTable, {
		relationName: 'item',
		fields: [itemTagsTable.itemId],
		references: [collectablesTable.id],
	})
}));

export const auditLogsTable = pgTable("audit_logs", {
	id: serial("id").notNull().primaryKey(),
	userId: text("userId").notNull().references(() => userTable.id),
	action: text("action").notNull(),
	where: text("where").notNull(),
	payload: text("payload").notNull(),
	timestamp: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
    user: one(userTable, {
        fields: [auditLogsTable.userId],
        references: [userTable.id],
    }),
}));

export const tradeHistoryTable = pgTable("trade_history", {
	id: serial("id").notNull().primaryKey(),
	itemId: integer("itemId").notNull().references(() => collectablesTable.id),
	serial: bigint("serial", { mode: 'number' }).notNull(),
	userId: bigint("userId", { mode: 'number' }).notNull(),
	username: text("username").notNull(),
	isFirst: boolean("isFirst").default(false).notNull(),
	created_at: bigint("created_at", { mode: 'number' }).notNull().default(nowEpochMs),
}, (table) => [
	index("trade_history_user_id_index").on(table.userId),
]);

export const tradeHistoryRelations = relations(tradeHistoryTable, ({ one }) => ({
	item: one(collectablesTable, {
		fields: [tradeHistoryTable.itemId],
		references: [collectablesTable.id],
	})
}));

export const listingsHistoryTable = pgTable("listings_history", {
	id: serial("id").notNull().primaryKey(),
	itemId: integer("itemId").notNull().references(() => collectablesTable.id),
	bestPrice: bigint("price", { mode: 'number' }).notNull(),
	sellers: bigint("sellers", { mode: 'number' }).notNull(),
	created_at: bigint("created_at", { mode: 'number' }).notNull().default(nowEpochMs),
}, (table) => [
	index("listings_history_item_id_index").on(table.itemId),
]);

export const listingsHistoryRelations = relations(listingsHistoryTable, ({ one }) => ({
	item: one(collectablesTable, {
		relationName: 'listings',
		fields: [listingsHistoryTable.itemId],
		references: [collectablesTable.id],
	})
}));

export const playersTable = pgTable("players", {
	id: integer("id").notNull().primaryKey(),
	username: text("username").notNull(),
	thumbnailUrl: text("thumbnailUrl").notNull(),
});

export const playerNetworthHistoryTable = pgTable("player_networth_history", {
	id: serial("id").notNull().primaryKey(),
	playerId: integer("playerId").notNull().references(() => playersTable.id),
	rank: integer("rank").notNull(),
	networth: bigint("networth", { mode: 'number' }).notNull(),
	created_at: bigint("created_at", { mode: 'number' }).notNull().default(nowEpochMs),
}, (table) => [
	index("player_networth_history_player_id_index").on(table.playerId),
]);

export const playerNetworthHistoryRelations = relations(playerNetworthHistoryTable, ({ one }) => ({
	player: one(playersTable, {
		fields: [playerNetworthHistoryTable.playerId],
		references: [playersTable.id],
	})
}));
