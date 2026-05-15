import type { PoolClient, QueryResultRow } from "pg";

import { getPool } from "./connection.js";

/** Convert SQLite-style `?` placeholders to PostgreSQL `$1`, `$2`, … */
export function toPg(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

export function asCount(row: { c: number | string } | undefined): number {
  return Number(row?.c ?? 0);
}

export async function queryOne<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
  client?: PoolClient,
): Promise<T | undefined> {
  const q = client ?? getPool();
  const result = await q.query<T>(toPg(sql), params);
  return result.rows[0];
}

export async function queryAll<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
  client?: PoolClient,
): Promise<T[]> {
  const q = client ?? getPool();
  const result = await q.query<T>(toPg(sql), params);
  return result.rows;
}

export async function execute(
  sql: string,
  params: unknown[] = [],
  client?: PoolClient,
): Promise<{ rowCount: number }> {
  const q = client ?? getPool();
  const result = await q.query(toPg(sql), params);
  return { rowCount: result.rowCount ?? 0 };
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
