export const metadata = {
  title: "Stock",
  description: "Stock Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ลิงก์ไปยัง Google Fonts สำหรับ Sarabun */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, backgroundColor: "rgb(216 216 216)" }}>
        <div className="content-body">{children}</div>
        <div className="landscape-warning" style={{ display: "none" }}>
          Please rotate your device back to portrait mode to continue viewing.
        </div>
      </body>
    </html>
  );
}
