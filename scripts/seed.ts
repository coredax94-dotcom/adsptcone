import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!connectionString || !email) throw new Error('DATABASE_URL and ADMIN_EMAIL are required');
  const pool = new Pool({ connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
  try {
    const result = await pool.query('UPDATE users SET role = \'ADMIN\', updated_at = NOW() WHERE email = $1 RETURNING id', [email]);
    if (!result.rowCount) throw new Error(`No user found for ${email}; register that address first.`);
    console.log(`Promoted ${email} to admin.`);
  } finally { await pool.end(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
