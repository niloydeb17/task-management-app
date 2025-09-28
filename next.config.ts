import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable experimental features that might help with build issues
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar'],
  },
  webpack: (config, { isServer }) => {
    // Add webpack configuration to handle potential module resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
