import dotenv from 'dotenv';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

dotenv.config();

export const connection = createClient({
	url: process.env.TURSO_CONNECTION_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
})

export const db = drizzle(connection, { schema });
