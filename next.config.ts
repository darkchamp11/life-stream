import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "http://localhost:3000",
    "192.168.56.1:3000",
    "192.168.0.100:3000",
    "192.168.0.101:3000",
    "192.168.0.102:3000",
    "192.168.1.100:3000",
    "192.168.1.101:3000",
  ],
  reactCompiler: true,
};

export default nextConfig;
