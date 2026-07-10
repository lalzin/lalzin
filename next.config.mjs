/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // react-three-fiber / three transpile safety
  transpilePackages: ['three'],
};

export default nextConfig;
