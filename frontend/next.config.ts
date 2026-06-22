import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "www.gstatic.com" }
    ],
    localPatterns: [
      {
        pathname: "/**",
      }
    ]
  }
};

export default nextConfig;
