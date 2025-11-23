import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import PinGuard from "@/components/PinGuard";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#020817", // Koyu tema rengimiz
  maximumScale: 1,
  userScalable: false, // Mobil zoom'u engeller
};

export const metadata: Metadata = {
  title: "Etsy Manager Pro",
  description: "Advanced E-commerce Tracking and PWA.",
  // Manifest dosyasını buraya ekliyoruz
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, "bg-background text-foreground flex")}>
        <PinGuard>
          <Sidebar />
          <main className="flex-1 ml-64 p-8 min-h-screen">
            {children}
          </main>
        </PinGuard>
      </body>
    </html>
  );
}

