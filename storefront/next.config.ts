import type { NextConfig } from "next";

// Old Razor Pages addresses are redirected in src/proxy.ts (case-sensitive, so
// "/Checkout" does not collide with "/checkout").
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Editorial photos for the home page (src/lib/media.ts), resized and converted on the server.
    remotePatterns: [{ protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net", pathname: "/user_3MZGFF2AvawycafmJp4EIhu007L/**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
  },
  experimental: {
    // Product photos are uploaded through a server action in /painel/produtos.
    serverActions: { bodySizeLimit: "30mb" },
  },
};

export default nextConfig;
