import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AppProviders } from "@/components/AppProviders";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BRAND_INK_900 } from "@/config/brandColors";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face"
});

export const metadata: Metadata = {
  title: "Yamaloon",
  description: "Owner-side construction project control",
  applicationName: "Yamaloon",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yamaloon"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: BRAND_INK_900
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body>
        <AppProviders>
          <div className="opc-app-frame">
            <div className="opc-app-frame__body">{children}</div>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
