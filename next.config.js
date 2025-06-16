const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/stock/home", // เปลี่ยนเส้นทางไปยังหน้า /home
        permanent: true, // การเปลี่ยนเส้นทางแบบถาวร
      },
    ];
  },
  images: {
    domains: ['drive.google.com'], // เพิ่มโดเมนของ Google Drive
  },
};

module.exports = nextConfig;
