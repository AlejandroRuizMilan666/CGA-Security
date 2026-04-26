import type { NextConfig } from "next";

/**
 * Security HTTP headers applied to every Next.js route.
 *
 * Design rationale
 * ─────────────────
 * • Content-Security-Policy (CSP) — restricts which sources can load scripts,
 *   styles and other subresources, mitigating XSS (OWASP A03).
 *   'unsafe-inline' is kept for styles/scripts because Next.js injects inline
 *   chunks at build time; a nonce-based CSP would require a custom server.
 *   This is documented as a known limitation to be tightened in production.
 * • X-Frame-Options: DENY — prevents clickjacking (OWASP A05).
 * • X-Content-Type-Options: nosniff — stops MIME-type sniffing attacks.
 * • X-XSS-Protection: 1; mode=block — legacy XSS filter for older browsers.
 * • Referrer-Policy — avoids leaking the full URL in the Referer header.
 * • Permissions-Policy — disables browser features not used by the app.
 * • Strict-Transport-Security — enforces HTTPS (max-age 1 year with preload).
 */

const securityHeaders = [
  // Prevents clickjacking: the app must never be loaded in a frame (OWASP A05)
  { key: "X-Frame-Options", value: "DENY" },

  // Blocks MIME-type sniffing — browsers must respect the declared Content-Type
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Legacy XSS filter for browsers that do not support CSP (OWASP A03)
  { key: "X-XSS-Protection", value: "1; mode=block" },

  // Limits Referer header to origin only when navigating cross-origin (privacy)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Disables browser features the application does not require (OWASP A05)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },

  // Forces HTTPS for 1 year; includeSubDomains covers any subdomains (OWASP A02)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },

  // CSP — default to self; allow Next.js inline scripts and styles needed for
  // SSR/hydration. Image sources restricted to self and data URIs. (OWASP A03)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' http://localhost:3001", // backend API
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
