export async function isLimited(db: D1Database, key: string, limit: number, windowMs: number): Promise<boolean> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM auth_attempts WHERE key = ? AND ts > ?")
    .bind(key, Date.now() - windowMs)
    .first<{ n: number }>();
  return (row?.n ?? 0) >= limit;
}

export async function recordAttempt(db: D1Database, key: string): Promise<void> {
  await db.prepare("INSERT INTO auth_attempts (key, ts) VALUES (?, ?)").bind(key, Date.now()).run();
  if (Math.random() < 0.02) {
    await db.prepare("DELETE FROM auth_attempts WHERE ts < ?").bind(Date.now() - 24 * 60 * 60 * 1000).run();
  }
}

export async function clearAttempts(db: D1Database, key: string): Promise<void> {
  await db.prepare("DELETE FROM auth_attempts WHERE key = ?").bind(key).run();
}
