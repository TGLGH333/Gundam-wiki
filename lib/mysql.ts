import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST ?? "127.0.0.1",
      port: Number(process.env.DATABASE_PORT ?? 3306),
      user: process.env.DATABASE_USER ?? "gundam",
      password: process.env.DATABASE_PASSWORD ?? "",
      database: process.env.DATABASE_NAME ?? "gundam_wiki",
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }
  return pool;
}
