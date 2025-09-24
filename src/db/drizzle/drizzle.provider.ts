import "dotenv/config";
import { Injectable } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './drizzle.schema';

if (!process.env.PG_URL) throw new Error("PG_URL is not defined in .env file");
const sql = postgres(process.env.PG_URL, {
    ssl: {
        rejectUnauthorized: false,
    },
});

@Injectable()
export class DrizzleProvider {
    db: PostgresJsDatabase<typeof schema> = drizzle(sql, {
        schema: schema
    });
}