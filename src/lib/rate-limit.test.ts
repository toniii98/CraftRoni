import assert from "node:assert/strict";
import test from "node:test";
import { clientIp, rateLimit } from "./rate-limit";

test("clientIp ufa pojedynczemu poprawnemu CF-Connecting-IP", () => {
  const request = new Request("https://example.test", {
    headers: {
      "cf-connecting-ip": "203.0.113.7",
      "x-forwarded-for": "198.51.100.10",
    },
  });

  assert.equal(clientIp(request), "203.0.113.7");
});

test("clientIp ignoruje X-Forwarded-For i odrzuca listę w nagłówku Cloudflare", () => {
  const forwardedOnly = new Request("https://example.test", {
    headers: { "x-forwarded-for": "198.51.100.10" },
  });
  const invalidCloudflare = new Request("https://example.test", {
    headers: { "cf-connecting-ip": "203.0.113.7, 198.51.100.10" },
  });

  assert.equal(clientIp(forwardedOnly), "unknown");
  assert.equal(clientIp(invalidCloudflare), "unknown");
});

test("rate limiter usuwa najdawniej używany wpis po osiągnięciu twardego limitu", () => {
  const prefix = `capacity-${Date.now()}-${Math.random()}`;
  const oldestKey = `${prefix}:oldest`;

  assert.equal(rateLimit(oldestKey, 1, 60_000).ok, true);
  assert.equal(rateLimit(oldestKey, 1, 60_000).ok, false);

  for (let index = 0; index < 10_000; index += 1) {
    rateLimit(`${prefix}:${index}`, 1, 60_000);
  }

  // Pierwszy wpis został usunięty przez LRU, więc powstaje świeży bucket.
  assert.equal(rateLimit(oldestKey, 1, 60_000).ok, true);
});
