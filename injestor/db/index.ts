import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const dbUrl = process.env.TRADE_HISTORY_DB!;

if (dbUrl && dbUrl.startsWith('file:')) {
	const dbPath = dbUrl.replace(/^file:/, '');
	const dir = path.dirname(dbPath);

	try {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		if (!existsSync(dbPath)) {
			writeFileSync(dbPath, '');
			console.log(`Created SQLite DB file at ${dbPath}`);
		}
	} catch (e) {
		console.error(`Failed to ensure SQLite DB file: ${dbPath}`, e);
	}
}

export const client = createClient({ url: dbUrl });
export const ldb = drizzle(client, { schema });