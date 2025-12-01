import dotenv from 'dotenv';
import * as schema from './schema';
import { Logger } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

dotenv.config();

export const connection = createClient({
	url: process.env.TURSO_CONNECTION_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
})


class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.log({ query, params });
  }
}

export const db = drizzle(connection, { schema, logger: new MyLogger() });