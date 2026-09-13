/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep production verification output separate from the running local preview.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
