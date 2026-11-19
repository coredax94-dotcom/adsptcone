import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
export const db = {
  query<T extends import('pg').QueryResultRow = import('pg').QueryResultRow>(text: string, values: unknown[] = []) {
    return pool.query<T>(text, values);
  },
  async transaction<T>(work: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  },
};
