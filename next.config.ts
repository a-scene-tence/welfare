import type { NextConfig } from "next";

const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (cfg: NextConfig) => cfg;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["react-markdown", "remark-gfm", "rehype-sanitize"],
  },
  env: {
    NEXT_PUBLIC_TARGET: process.env.NEXT_PUBLIC_TARGET ?? "web",
  },
};

export default withBundleAnalyzer(nextConfig);
