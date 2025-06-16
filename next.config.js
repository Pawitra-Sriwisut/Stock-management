const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/stock/home",
        permanent: true,
      },
      {
        source: "/stock",
        destination: "/stock/home",
        permanent: true,
      },
    ];
  },
  images: {
    domains: ["drive.google.com"], // เพิ่มโดเมนของ Google Drive
  },
};

module.exports = nextConfig;
