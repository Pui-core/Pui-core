const { Pool } = require("pg");

function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  return new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: 30_000
  });
}

async function ping(pool) {
  const result = await pool.query("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}

module.exports = {
  createPool,
  ping
};
