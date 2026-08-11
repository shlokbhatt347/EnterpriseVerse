import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./ui-overrides.css";
import "./phase12-experience.css";
import "./phase24-experience.css";
import "./phase27-premium.css";
import "./ui/primitives.css";
import "./account-menu.css";
import ThemeToggle from "./theme-toggle";
import AccountMenu from "./account-menu";
import SaveSync from "./save-sync";
import { AuthProvider } from "./auth-provider";

export const metadata: Metadata = {
  title: "EnterpriseVerse — Interactive Enterprise Simulator",
  description: "Run a business. Make decisions. Learn by building.",
};

export const viewport: Viewport = {
  themeColor: "#070b14",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <AuthProvider>
          <ThemeToggle />
          <AccountMenu />
          <SaveSync />
          <div id="main-content">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
