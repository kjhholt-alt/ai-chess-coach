/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lichess.org",
      },
    ],
  },
};

export default nextConfig;
