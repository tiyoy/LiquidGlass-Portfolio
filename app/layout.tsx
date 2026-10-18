import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portofolio Digital — Personal Portfolio",
  description: "Portofolio personal dengan desain liquid glass, karya digital, layanan, dan informasi kontak.",
  applicationName: "Liquid Glass Portfolio",
};

export const viewport: Viewport = {
  themeColor: "#090b16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
