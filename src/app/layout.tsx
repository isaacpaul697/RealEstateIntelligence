import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { SettingsProvider } from "@/lib/settings";
import { LiveDataProvider } from "@/lib/live/provider";
import { AllApartmentsProvider } from "@/lib/live/allApartments";
import { WatchlistProvider } from "@/lib/watchlist";
import { NotesProvider } from "@/lib/notes";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Campus Capital · Student Housing Acquisitions IQ",
  description:
    "Live student-housing acquisitions screening: real university data, demand momentum, on-the-ground apartment supply, and a transparent 0–100 acquisition score.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}>
      <body>
        <SettingsProvider>
          <LiveDataProvider>
            <AllApartmentsProvider>
              <WatchlistProvider>
                <NotesProvider>
                  <div className="flex min-h-screen">
                    <Sidebar />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Topbar />
                      <main className="flex-1 p-6 md:p-8 max-w-[1280px] w-full mx-auto">{children}</main>
                    </div>
                  </div>
                </NotesProvider>
              </WatchlistProvider>
            </AllApartmentsProvider>
          </LiveDataProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
