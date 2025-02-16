import { discord, lucia } from "@/lib/auth";
import { OAuth2RequestError } from "arctic";
import { cookies } from "next/headers";
import { generateId } from "lucia";
import { db } from "@/lib/db";
import { userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const cookiesInstance = await cookies();
	const storedState = cookiesInstance.get("discord_oauth_state")?.value ?? null;

	if (!code || !state || !storedState || state !== storedState.toString()) {
		const errorMessage = !code ? "Missing code parameter" :
							 !state ? "Missing state parameter" :
							 !storedState ? "Missing stored state" :
							 "State parameter does not match stored state";
	
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	try {
		const tokens = await discord.validateAuthorizationCode(code);

		const discordUserResponse = await fetch("https://discord.com/api/users/@me", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});

		const discordUser: DiscordUser = await discordUserResponse.json();
		
		const [existingUser] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.discordId, discordUser.id))
			.limit(1);

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			cookiesInstance.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});

			await db.update(userTable)
				.set({
					accessToken: tokens.accessToken,
					refreshToken: tokens.refreshToken,
					accessTokenExpiresAt: tokens.accessTokenExpiresAt.getTime(),
					username: discordUser.username,
					display_name: discordUser.global_name ?? discordUser.username,
					avatar: discordUser.avatar ?? "",
					updated_at: new Date().getTime()
				})
				.where(eq(userTable.id, existingUser.id));
		} else {
			const userId = generateId(15);

			await db.insert(userTable).values({
				id: userId,
				username: discordUser.username,
				discordId: discordUser.id,
				display_name: discordUser.global_name ?? discordUser.username,
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				accessTokenExpiresAt: tokens.accessTokenExpiresAt.getTime(),
				avatar: discordUser.avatar ?? "",
				created_at: new Date().getTime(),
				updated_at: new Date().getTime(),
			});

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			cookiesInstance.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
		}

		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch (e) {
		console.error(e);

		if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
			return new Response(JSON.stringify({ error: "Invalid code" }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}

		return new Response(null, {
			status: 500
		});
	}
}


interface DiscordUser {
	id: string;
	username: string;
	avatar: string | null;
	banner: string | null;
	global_name: string | null;
	banner_color: string | null;
	mfa_enabled: boolean;
	locale: string;
	email: string | null;
	verified: boolean;
}