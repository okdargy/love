import { type Config } from "drizzle-kit";
import { config } from 'dotenv';

config({ path: '.env' });

export default {
	schema: "./src/lib/db/schema.ts",
	out: "./src/lib/db/drizzle",
	driver: "turso",
    dialect: "sqlite",
	dbCredentials: {
		url: process.env.TURSO_CONNECTION_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN!,
	},
} satisfies Config;