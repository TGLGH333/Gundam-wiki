import Database from "better-sqlite3";
import path from "node:path";

// SQLite 数据库存到 named volume /data, 容器重启不丢数据.
// DATABASE_URL=file:/data/app.db 由 compose.yaml 注入, 也允许覆盖到别处
// (例如本地开发指向 /tmp/dev.db).
const dbPath =
  process.env.DATABASE_URL?.replace(/^file:/, "") ??
  path.join("/data", "app.db");

export const db = new Database(dbPath);

// WAL 模式比默认 rollback journal 并发性能好得多, 是生产 SQLite 的标配.
db.pragma("journal_mode = WAL");
