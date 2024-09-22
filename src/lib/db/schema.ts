import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

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
	expiresAt: integer("expiresAt").notNull()
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

export const collectablesStatsTable = sqliteTable("collectables_stats", {
	id: integer("id").notNull().references(() => collectablesTable.id),
	value: integer("value"),
	demand: text("demand", { enum: ["awful", "low", "normal", "great", "high"] }),
	trend: text("trend", { enum: ["stable", "unstable", "fluctuating"] }),
	funFact: text("funFact"),
	effect: text("effect"),
	rare: integer('rare', { mode: 'boolean' }).default(false),
	freaky: integer('freaky', { mode: 'boolean' }).default(false),
	projected: integer('projected', { mode: 'boolean' }).default(false),
	created_at: integer("created_at").notNull().default(sql`(current_timestamp)`),
	updated_at: integer("updated_at").notNull().default(sql`(current_timestamp)`)
});

export const collectablesRelations = relations(collectablesTable, ({ one }) => ({
	stats: one(collectablesStatsTable, {
		relationName: 'stats',
		fields: [collectablesTable.id],
		references: [collectablesStatsTable.id],
	})
}));

function sqliteEnum(arg0: string, arg1: string[]) {
	throw new Error('Function not implemented.');
}

