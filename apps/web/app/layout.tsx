import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./experience/design-system.css";
import "./ui-overrides.css";
import "./phase12-experience.css";
import "./phase24-experience.css";
import "./phase27-premium.css";
import "./phase28-visual-excellence.css";
import "./ui/primitives.css";
import "./account-menu.css";
import "./infinity-ui.css";
import ThemeToggle from "./theme-toggle";
import AccountMenu from "./account-menu";
import SaveSync from "./save-sync";
import NotificationCenter from "./notification-center";
import CommandPalette from "./command-palette";
import { AuthProvider } from "./auth-provider";

export const metadata: Metadata = {
  title: "EnterpriseVerse — Interactive Enterprise Simulator",
  description: "Run a business. Make decisions. Learn by building.",
};

export const viewport: Viewport = {
  themeColor: "#07090d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="ev-visual-excellence">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <AuthProvider>
          <ThemeToggle />
          <NotificationCenter />
          <AccountMenu />
          <CommandPalette />
          <SaveSync />
          <div id="main-content">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}