import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "./db";
import { sessionTable, userTable } from "./db/schema";
import { Discord } from "arctic";

import { cache } from "react";
import { cookies } from "next/headers";

import type { Session, User } from "lucia";

// @ts-ignore
const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === "production"
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			display_name: attributes.display_name,
			discordId: attributes.discordId,
			polytoriaId: attributes.polytoriaId || null,
			avatar: attributes.avatar,
			role: attributes.role
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: Omit<DatabaseUserAttributes, "id">;
	}
}

export interface DatabaseUserAttributes {
    id: string;
	username: string;
	display_name: string;
	discordId: number;
	polytoriaId?: number;
	avatar: string;
	role: "user" | "developer" | "admin" | "editor";
}

export const validateRequest = cache(
	async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
		const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			return {
				user: null,
				session: null
			};
		}

		const result = await lucia.validateSession(sessionId);
		// next.js throws when you attempt to set cookie when rendering page
		try {
			if (result.session && result.session.fresh) {
				const sessionCookie = lucia.createSessionCookie(result.session.id);
				(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
			if (!result.session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
		} catch {}
		return result;
	}
);

export const discord = new Discord(process.env.DISCORD_CLIENT_ID!, process.env.DISCORD_CLIENT_SECRET!, process.env.DISCORD_REDIRECT_URI!);
