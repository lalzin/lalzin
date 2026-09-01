/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // react-three-fiber / three transpile safety
  transpilePackages: ['three'],
  async headers() {
    return [
      {
        // Environnement HDR de la boule disco : contenu figé → cache long
        source: '/hdr/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
