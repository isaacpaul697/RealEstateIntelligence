import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
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
            <div className="flex min-h-screen">
              <Sidebar section="housing" />
              <div className="flex-1 min-w-0 flex flex-col">
                <Topbar section="housing" />
                <main className="flex-1 p-6 md:p-8 max-w-[1280px] w-full mx-auto">{children}</main>
              </div>
            </div>
          </NotesProvider>
        </WatchlistProvider>
      </AllApartmentsProvider>
    </LiveDataProvider>
  );
}
