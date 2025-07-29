
import { Planner } from '@/components/planner/Planner';
import { AppHeader } from '@/components/layout/AppHeader';
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home as HomeIcon, FileText } from 'lucide-react';

export default function Home() {
  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton isActive>
                            <HomeIcon />
                            Dashboard
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton>
                            <FileText />
                            Reports
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <AppHeader />
            <main>
                <Planner />
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
