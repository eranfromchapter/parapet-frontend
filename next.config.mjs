/** @type {import('next').NextConfig} */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

const nextConfig = {
  // Same-origin proxy to the Railway backend.
  //
  // Why: the backend's CORS preflight returns HTTP 400 (with valid ACL headers).
  // Chrome is lenient and accepts this; Safari strictly requires 2xx and rejects
  // the preflight, so every cross-origin fetch from Safari fails with "Load failed"
  // before the actual GET is ever sent. Additionally, parapet-ai.com is not in
  // the backend's Access-Control-Allow-Origin whitelist.
  //
  // Routing browser fetches through /api/backend/* turns them into same-origin
  // requests. Vercel forwards server-to-server to Railway, so CORS never applies.
  // This is the reliable fix regardless of how the backend CORS middleware is
  // configured.
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
