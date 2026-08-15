/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The site used to live at titanium-geometry.vercel.app, and that address is
  // printed on stickers. Anything arriving there is sent on to the real domain:
  // the stickers keep working, and search results, pixel data and analytics all
  // settle on one address instead of splitting across two.
  //
  // Matching the production host exactly leaves preview deployments — which get
  // their own *.vercel.app names — alone.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "titanium-geometry.vercel.app" }],
        destination: "https://titaniumgeometry.com/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
