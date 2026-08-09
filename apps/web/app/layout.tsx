import type { Metadata } from "next";
import "./globals.css";
import "./ui-overrides.css";
import "./phase12-experience.css";
import ThemeToggle from "./theme-toggle";

export const metadata: Metadata = {
  title: "EnterpriseVerse — Interactive Enterprise Simulator",
  description: "Run a business. Make decisions. Learn by building.",
  themeColor: "#070b14",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <ThemeToggle />
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
