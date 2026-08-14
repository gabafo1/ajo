import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSideBar } from "@/app/(dashboard)/components/SideBar";
import { Toaster } from "@/components/ui/sonner";
import Headers from "@/app/(dashboard)/components/Headers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
          <SidebarProvider>
              <div className="flex h-screen w-full overflow-hidden">
              <AppSideBar />
                  <SidebarInset className="flex-1 overflow-auto">
                      <Headers />
                      {children}
                  </SidebarInset>
              </div>
              <Toaster />
          </SidebarProvider>
    </>
  );
}

