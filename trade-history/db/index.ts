import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export const client = createClient({ url: process.env.TRADE_HISTORY_DB! });
export const ldb = drizzle(client, { schema });