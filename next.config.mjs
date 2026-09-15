/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build for the production Docker image
  // (Dockerfile.frontend) -- no full node_modules copy needed at runtime.
  output: "standalone",
};

export default nextConfig;
