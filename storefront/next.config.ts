import type { NextConfig } from "next";

// Old Razor Pages addresses are redirected in src/proxy.ts (case-sensitive, so
// "/Checkout" does not collide with "/checkout").
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // Product photos are uploaded through a server action in /painel/produtos.
    serverActions: { bodySizeLimit: "30mb" },
  },
};

export default nextConfig;
