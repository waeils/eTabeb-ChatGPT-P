import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
  async rewrites() {
    return [
      {
        source: '/mcp-v2',
        destination: '/mcp',
      },
    ];
  },
};

export default nextConfig;
