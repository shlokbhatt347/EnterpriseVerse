import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EnterpriseVerse",
  description: "Run a business. Make decisions. Become a better entrepreneur.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
