import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { AppBackground } from "@/components/AppBackground";
import { ScrollSkylineRail } from "@/components/ScrollSkylineRail";
import { MobileNavProvider } from "@/components/MobileNav";
import { LiveDataProvider } from "@/lib/live/provider";
import { AllApartmentsProvider } from "@/lib/live/allApartments";
import { WatchlistProvider } from "@/lib/watchlist";
import { NotesProvider } from "@/lib/notes";

export default function StudentHousingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <LiveDataProvider>
      <AllApartmentsProvider>
        <WatchlistProvider>
          <NotesProvider>
            <MobileNavProvider>
              <div className="flex min-h-screen">
                <AppBackground />
                <ScrollSkylineRail />
                <Sidebar />
                <div className="flex-1 min-w-0 flex flex-col">
                  <Topbar />
                  <main className="flex-1 px-4 py-5 sm:p-6 md:p-8 max-w-[1280px] w-full mx-auto">{children}</main>
                </div>
              </div>
            </MobileNavProvider>
          </NotesProvider>
        </WatchlistProvider>
      </AllApartmentsProvider>
    </LiveDataProvider>
  );
}
