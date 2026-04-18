import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FruitHealth",
  description: "Snap a fruit. Get a buy / skip / return verdict instantly.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FruitHealth",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-md min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
