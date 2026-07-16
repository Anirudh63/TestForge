import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder-url';

const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, schema });
export * from '@/db/schema';

/**
 * Retry wrapper for Neon serverless DB queries.
 * Neon free-tier connections can timeout on cold starts (ETIMEDOUT).
 * This retries the query up to `maxRetries` times with exponential backoff.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 500
): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const isRetryable =
                error?.code === 'ETIMEDOUT' ||
                error?.message?.includes('fetch failed') ||
                error?.message?.includes('ETIMEDOUT') ||
                error?.cause?.code === 'ETIMEDOUT' ||
                error?.sourceError?.cause?.code === 'ETIMEDOUT';

            if (!isRetryable || attempt === maxRetries - 1) {
                throw error;
            }

            const delay = baseDelayMs * Math.pow(2, attempt);
            console.log(`[DB RETRY] Attempt ${attempt + 1}/${maxRetries} failed (${error?.cause?.code || 'fetch failed'}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
