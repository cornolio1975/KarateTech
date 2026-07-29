import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Karate Tech",
  description: "SP SportData Solution - Professional Karate Tournament Management Platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="font-sans h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
