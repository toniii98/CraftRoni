import { isIP } from "node:net";

// Prosty rate limiter in-memory (wystarczający dla pojedynczej instancji na VPS).
// Przy skalowaniu na wiele instancji trzeba go zastąpić np. Redisem.

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function purgeExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function makeRoomForNewBucket(now: number) {
  if (buckets.size < MAX_BUCKETS) return;

  purgeExpired(now);

  // Map zachowuje kolejność wstawiania. Istniejące wpisy są poniżej
  // odświeżane, więc pierwszy klucz jest najdawniej używanym aktywnym wpisem.
  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * Zlicza żądania dla klucza (np. "login:1.2.3.4") w oknie czasowym.
 * Zwraca ok=false gdy limit przekroczony.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (bucket) buckets.delete(key);
    makeRoomForNewBucket(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  // Dotknięcie wpisu przesuwa go na koniec kolejki LRU.
  buckets.delete(key);
  buckets.set(key, bucket);
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true, retryAfterSeconds: 0 };
}

function validSingleIp(value: string | null): string | null {
  if (!value || value.includes(",")) return null;
  const normalized = value.trim();
  return isIP(normalized) ? normalized : null;
}

/**
 * Adres IP klienta przekazany przez Cloudflare. Nie ufamy X-Forwarded-For ani
 * X-Real-IP, które klient może ustawić samodzielnie. Origin musi być dostępny
 * wyłącznie przez Cloudflare, aby również CF-Connecting-IP był wiarygodny.
 */
export function clientIp(request: Request): string {
  return validSingleIp(request.headers.get("cf-connecting-ip")) ?? "unknown";
}
