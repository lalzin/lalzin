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
      {
        // Fichier de versions interrogé une fois par jour par les plugins
        // installés : il doit rester frais, mais pas marteler le serveur.
        source: '/plugins/versions.json',
        headers: [
          { key: 'Content-Type', value: 'application/json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
