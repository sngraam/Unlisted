/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep production verification output separate from the running local preview.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    outputFileTracingIncludes: {
      "/api/products/export": ["./private/amazon-templates/*.xlsm"],
    },
  },
};

export default nextConfig;
