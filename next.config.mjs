/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/accounts',
        destination: '/account',
        permanent: true,
      },
      {
        source: '/accounts/:path*',
        destination: '/account/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
