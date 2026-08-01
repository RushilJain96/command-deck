import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    // A stray package-lock.json in the user's home directory makes Turbopack
    // infer the wrong workspace root. Pin it to this project.
    root: __dirname,
  },
};

export default nextConfig;
