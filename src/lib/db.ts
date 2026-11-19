import { Pool, PoolClient, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const globalForPool = globalThis as unknown as { ptcPool?: Pool };
export const pool = globalForPool.ptcPool ?? new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
if (process.env.NODE_ENV !== 'production') globalForPool.ptcPool = pool;

export const db = {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
    return pool.query<T>(text, values);
  },
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* Preserve the original transaction error. */ }
      throw error;
    } finally { client.release(); }
  },
};
