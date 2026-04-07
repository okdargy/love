import dotenv from 'dotenv';
import * as schema from './schema';
import { Logger } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

dotenv.config();

export const connection = postgres(process.env.DATABASE_URL!);

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.log({ query, params });
  }
}

export const db = drizzle(connection, { schema, logger: new MyLogger() });