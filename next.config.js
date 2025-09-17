const nextConfig = {
  images: {
    domains: ["localhost", "devnulp.niua.org", "nulp.niua.org"],
    unoptimized: true,
  },
  // Enable gzip compression for responses
  compress: true,
  // Conditionally enable static export only for production builds
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
  async headers() {
    return [
      // Long-cache static Learnathon assets
      {
        source: "/learnathon/:path*.css",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/learnathon/:path*.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/learnathon/:path*.(png|jpg|jpeg|gif|svg|webp|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/learnathon/:path*.(woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/learnathon/:path*.(pdf|json|mp4|webm)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Short-cache HTML documents to allow updates
      {
        source: "/learnathon",
        headers: [{ key: "Cache-Control", value: "public, max-age=300" }],
      },
      {
        source: "/learnathon/:slug",
        headers: [{ key: "Cache-Control", value: "public, max-age=300" }],
      },
    ];
  },
  async rewrites() {
    return [
      // Serve /learnathon and /learnathon/ as /learnathon/index.html
      { source: "/learnathon", destination: "/learnathon/index.html" },
      { source: "/learnathon/", destination: "/learnathon/index.html" },
      // Serve single-segment clean paths as their corresponding .html
      { source: "/learnathon/:slug", destination: "/learnathon/:slug.html" },
      // Back-compat: serve any old /sunbird/* asset from /learnathon/*
      { source: "/sunbird/:path*", destination: "/learnathon/:path*" },
    ];
  },
  async redirects() {
    return [
      // Hide .html extension for learnathon pages
      {
        source: "/learnathon/index.html",
        destination: "/learnathon",
        permanent: true,
      },
      {
        source: "/learnathon/:slug.html",
        destination: "/learnathon/:slug",
        permanent: true,
      },
      // Back-compat: redirect /learnathon/learnathon to the index route
      {
        source: "/learnathon/learnathon",
        destination: "/learnathon/",
        permanent: true,
      },
      // Backward compatibility: redirect old sunbird paths to learnathon
      { source: "/sunbird", destination: "/learnathon", permanent: true },
      { source: "/sunbird/", destination: "/learnathon", permanent: true },
      {
        source: "/sunbird/index.html",
        destination: "/learnathon",
        permanent: true,
      },
      {
        source: "/sunbird/:slug",
        destination: "/learnathon/:slug",
        permanent: true,
      },
      {
        source: "/sunbird/:slug.html",
        destination: "/learnathon/:slug",
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
