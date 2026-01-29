import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const BottomDrawer = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <>
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-[420px] bg-[#0F0F14]/90 backdrop-blur-xl border-t border-white/10 transition-all duration-300 ease-in-out z-40 flex flex-col",
                    isOpen ? "h-[400px]" : "h-[40px]"
                )}
            >
                {/* Handle / Tab Bar */}
                <div
                    className="h-[40px] w-full flex items-center justify-between px-6 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-8">
                        <Tab label="Event Log" active />
                        <Tab label="Session Stats" />
                        <Tab label="Stream History" />
                        <Tab label="Advanced Settings" />
                    </div>
                    <div className="text-[#A0A0B8] hover:text-white">
                        {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-auto">
                    {isOpen && (
                        <div className="text-white/50 text-center mt-20 font-mono">
                            [ Drawer Content Area - Event Logs and Stats ]
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const Tab = ({ label, active }: { label: string; active?: boolean }) => (
    <div className={cn(
        "text-sm font-semibold uppercase tracking-wide px-2 py-1 border-b-2 transition-all",
        active ? "text-white border-[#007AFF]" : "text-[#6B6B85] border-transparent hover:text-[#A0A0B8]"
    )}>
        {label}
    </div>
);
