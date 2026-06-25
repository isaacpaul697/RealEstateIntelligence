import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function DevelopmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar section="development" />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar section="development" />
        <main className="flex-1 p-6 md:p-8 max-w-[1280px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
