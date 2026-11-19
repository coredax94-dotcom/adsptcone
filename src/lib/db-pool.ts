import { Pool } from 'pg';
const globalForPool=globalThis as unknown as {pgPool?:Pool};
const connectionString=process.env.DATABASE_URL;
if(!connectionString) throw new Error('DATABASE_URL is required');
export const pool=globalForPool.pgPool??new Pool({connectionString,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:undefined,max:Number(process.env.DB_POOL_MAX||10),idleTimeoutMillis:30000,connectionTimeoutMillis:5000});
if(process.env.NODE_ENV!=='production')globalForPool.pgPool=pool;
