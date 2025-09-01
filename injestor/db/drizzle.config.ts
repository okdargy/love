import 'dotenv/config';
import { type Config } from "drizzle-kit";

export default {
	schema: "./injestor/db/schema.ts",
	out: "./drizzle",
    dialect: "sqlite",
	dbCredentials: {
		url: process.env.TRADE_HISTORY_DB!,
	},
} satisfies Config;