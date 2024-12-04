import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq, relations, sql } from 'drizzle-orm';

export const userTable = sqliteTable("user", {
	id: text("id").notNull().primaryKey(),
	username: text("username").notNull(),
	discordId: text("discordId").notNull(),
	polytoriaId: integer("polytoriaId").references(() => polytoriaUserTable.id),
	display_name: text("display_name").notNull(),
	accessToken: text("accessToken").notNull(),
	refreshToken: text("refreshToken").notNull(),
	accessTokenExpiresAt: integer("accessTokenExpiresAt").notNull(),
	avatar: text("avatar").notNull(),
	role: text('role', { enum: ['user', 'developer', 'admin', 'editor']}).default('user').notNull(),
	created_at: integer("created_at").notNull(),
	updated_at: integer("updated_at").notNull(),
});

export const polytoriaUserTable = sqliteTable("polytoria_user", {
	id: integer("id").notNull().primaryKey(),
	username: text("username").notNull(),
	thumbnailUrl: text("thumbnailUrl").notNull(),
});

export const polytoriaUserRelations = relations(polytoriaUserTable, ({ one }) => ({
	user: one(userTable)
}));

export const sessionTable = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer("expiresAt").notNull(),
});

export const collectablesTable = sqliteTable("collectables", {
	id: integer("id").notNull().primaryKey(),
	type: text("type").notNull(),
	name: text("name").notNull(),
	shorthand: text("shorthand"),
	description: text("description").notNull(),
	thumbnailUrl: text("thumbnailUrl").notNull(),
	price: integer("price").notNull(),
	onSaleUntil: integer("onSaleUntil", { mode: 'timestamp' }).notNull(),
	isSoldOut: integer('isSoldOut', { mode: 'boolean' }).default(false).notNull(),
	created_at: integer("created_at").notNull().default(sql`(current_timestamp)`),
	updated_at: integer("updated_at").notNull().default(sql`(current_timestamp)`)
});

export const tagsTable = sqliteTable("tags", {
    id: integer("id").primaryKey({
		autoIncrement: true
	}).notNull(),
    name: text("name").notNull(),
	emoji: text("emoji").notNull()
});

export const itemTagsTable = sqliteTable("item_tags", {
    itemId: integer("itemId").notNull().references(() => collectablesTable.id),
    tagId: integer("tagId").notNull().references(() => tagsTable.id),
});

export const collectablesStatsTable = sqliteTable("collectables_stats", {
    id: integer("id").notNull().references(() => collectablesTable.id),
    value: integer("value"),
    demand: text("demand", { enum: ["awful", "low", "normal", "high", "great"] }),
    trend: text("trend", { enum: ["stable", "unstable", "fluctuating", "rising", "lowering"] }),
    funFact: text("funFact"),
    created_at: integer("created_at").notNull().default(sql`(current_timestamp)`),
    updated_at: integer("updated_at").notNull().default(sql`(current_timestamp)`)
});

export const collectablesRelations = relations(collectablesTable, ({ one, many }) => ({
    stats: one(collectablesStatsTable, {
        relationName: 'stats',
        fields: [collectablesTable.id],
        references: [collectablesStatsTable.id],
    }),
    tags: many(itemTagsTable)
}));

export const tagsRelations = relations(itemTagsTable, ({ one }) => ({
	item: one(collectablesTable, {
		relationName: 'item',
		fields: [itemTagsTable.itemId],
		references: [collectablesTable.id],
	})
}));

export const auditLogsTable = sqliteTable("audit_logs", {
	id: integer("id").notNull().primaryKey({
		autoIncrement: true
	}),
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

export const tradeHistoryTable = sqliteTable("trade_history", {
	id: integer("id").notNull().primaryKey({
		autoIncrement: true
	}),
	itemId: integer("itemId").notNull().references(() => collectablesTable.id),
	serial: integer("serial").notNull(),
	userId: integer("userId").notNull(),
	username: text("username").notNull(),
	isFirst: integer("isFirst", { mode: 'boolean' }).default(false).notNull(),
	created_at: integer("created_at").notNull().default(sql`(current_timestamp)`),
});

export const tradeHistoryRelations = relations(tradeHistoryTable, ({ one }) => ({
	item: one(collectablesTable, {
		fields: [tradeHistoryTable.itemId],
		references: [collectablesTable.id],
	})
}));