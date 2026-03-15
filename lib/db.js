import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // depuis .env.local
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}