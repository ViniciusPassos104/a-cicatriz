import type { NextConfig } from "next";

function mediaSource(): string {
  const publicUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!publicUrl) return "";

  try {
    return new URL(publicUrl).origin;
  } catch {
    return "";
  }
}

const r2Origin = mediaSource();
const r2ApiOrigin = (() => {
  try {
    return process.env.R2_ENDPOINT
      ? new URL(process.env.R2_ENDPOINT).origin
      : "";
  } catch {
    return "";
  }
})();
const r2UploadSource = (() => {
  try {
    if (!process.env.R2_ENDPOINT) return "";
    const endpoint = new URL(process.env.R2_ENDPOINT);
    return `${endpoint.protocol}//*.${endpoint.hostname}`;
  } catch {
    return "";
  }
})();
const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:" + (r2Origin ? ` ${r2Origin}` : ""),
  "media-src 'self' blob:" + (r2Origin ? ` ${r2Origin}` : ""),
  "connect-src 'self'" +
    (r2Origin ? ` ${r2Origin}` : "") +
    (r2ApiOrigin ? ` ${r2ApiOrigin}` : "") +
    (r2UploadSource ? ` ${r2UploadSource}` : ""),
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  reactStrictMode: true,
  images: r2Origin
    ? {
        remotePatterns: [
          {
            protocol: new URL(r2Origin).protocol.replace(":", "") as
              "http" | "https",
            hostname: new URL(r2Origin).hostname,
          },
        ],
      }
    : undefined,
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
