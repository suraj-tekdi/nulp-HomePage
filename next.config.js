const nextConfig = {
  images: {
    domains: ["localhost", "devnulp.niua.org", "nulp.niua.org"],
    unoptimized: true,
  },
  // Conditionally enable static export only for production builds
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
};
module.exports = nextConfig;
