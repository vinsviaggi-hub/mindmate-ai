import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // evita errori ESLint in build
  },
  typescript: {
    ignoreBuildErrors: true, // evita errori TS in build
  },
};

export default nextConfig;
