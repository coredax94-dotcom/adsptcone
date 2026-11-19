import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
  try {
    const sql = await readFile(path.join(process.cwd(), 'database.sql'), 'utf8');
    await pool.query(sql);
    console.log('database.sql applied successfully.');
  } finally { await pool.end(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
