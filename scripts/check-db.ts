import { Pool } from 'pg';
const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error('DATABASE_URL is required');
const pool=new Pool({connectionString,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:undefined});
async function main(){try{const result=await pool.query('SELECT 1');console.log('PostgreSQL connection OK',result.rows[0]);}finally{await pool.end();}}
main().catch(error=>{console.error(error);process.exitCode=1;});
