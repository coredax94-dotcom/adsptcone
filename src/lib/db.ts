import { Pool, PoolClient, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const globalForPool = globalThis as unknown as { ptcPool?: Pool };

export const pool = globalForPool.ptcPool ?? new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

if (process.env.NODE_ENV !== 'production') globalForPool.ptcPool = pool;

export const db = {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
    return pool.query<T>(text, values);
  },
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
