import { StatusBar } from './StatusBar';
import { RightSidebar } from './RightSidebar';
import { BottomDrawer } from './BottomDrawer';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white font-sans overflow-hidden">
            {/* Top Status Bar (Fixed 60px) */}
            <StatusBar />

            {/* Main Content Area */}
            <div className="pt-[60px] flex h-screen">

                {/* Left/Center Panel (Fluid) */}
                <main className="flex-1 relative overflow-hidden flex flex-col">

                    {/* Main Visual Workspace */}
                    <div className="flex-1 p-8 flex items-center justify-center bg-gradient-to-b from-[#1C1C28]/20 to-transparent">
                        {children}
                    </div>

                    {/* Bottom Drawer (Overlays bottom of main) */}
                    <BottomDrawer />
                </main>

                {/* Right Sidebar (Fixed 420px) */}
                <RightSidebar />
            </div>
        </div>
    );
};
