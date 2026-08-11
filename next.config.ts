import type { NextConfig } from "next";

// Nagłówki bezpieczeństwa — CSP celowo pominięte (wymaga nonce'ów dla Next),
// do rozważenia po stabilizacji frontu.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Działa tylko po HTTPS (na VPS za reverse proxy z certyfikatem)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // SEOHOST ogranicza liczbę procesów i wątków użytkownika. Domyślny build
  // Next.js uruchamia kilka procesów potomnych, co kończy się błędem EAGAIN.
  // Jeden worker thread utrzymuje build w ramach limitów współdzielonego hostingu.
  experimental: {
    cpus: 1,
    workerThreads: true,
    webpackBuildWorker: false,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
    webpackMemoryOptimizations: true,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 100,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
