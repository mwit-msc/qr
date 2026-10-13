import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const outfit = localFont({
  src: "../public/fonts/Outfit.ttf",
  variable: "--font-outfit",
  weight: "100 900",
  display: "swap",
});

const notoThai = localFont({
  src: "../public/fonts/NotoSansThai.ttf",
  variable: "--font-noto-thai",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "สร้าง QR โค้ด | MWIT LINK",
  description: "สร้าง QR โค้ดสวย ๆ พร้อมโลโก้ โดย mwit.link",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${outfit.variable} ${notoThai.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
