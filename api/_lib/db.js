const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function query(sql, params = []) {
  return pool.query(sql, params);
}

module.exports = { query };
