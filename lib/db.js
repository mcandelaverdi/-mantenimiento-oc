import { neon } from '@neondatabase/serverless';

let sql;

export function getDb() {
  if (!sql) {
    sql = neon(process.env.POSTGRES_URL);
  }
  return sql;
}

export async function query(text, params = []) {
  const db = getDb();
  return db(text, params);
}
