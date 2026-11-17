/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Miniature du clip : récupérée par le serveur, pas par le visiteur.
    remotePatterns: [{ protocol: 'https', hostname: 'img.youtube.com', pathname: '/vi/**' }],
  },
  // react-three-fiber / three transpile safety
  transpilePackages: ['three'],
  // Stems des mini-jeux (hors public/) embarqués avec la route qui les sert.
  experimental: {
    outputFileTracingIncludes: {
      '/api/minigame/media/[slug]/[file]': ['./games/*/media/**'],
    },
  },
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
