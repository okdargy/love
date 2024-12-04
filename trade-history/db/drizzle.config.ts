import { type Config } from "drizzle-kit";
import { config } from 'dotenv';

config({ path: '.env' });

export default {
	schema: "./trade-history/db/schema.ts",
	out: "./drizzle",
    dialect: "sqlite",
	dbCredentials: {
		url: process.env.TRADE_HISTORY_DB!,
	},
} satisfies Config;