export function getPool(): never {
  throw new Error("Database integration is disabled in local preview mode.");
}
