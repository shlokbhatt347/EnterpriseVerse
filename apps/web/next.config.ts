import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/EnterpriseVerse",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
