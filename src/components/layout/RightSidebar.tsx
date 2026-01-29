import { GlassCard } from '../common/GlassCard';
import { Settings, Pause, Square, Radio, Activity, Bell, History } from 'lucide-react';

export const RightSidebar = () => {
    return (
        <div className="w-[420px] h-full fixed top-[60px] right-0 bg-[#0F0F14]/60 backdrop-blur-xl border-l border-white/10 overflow-y-auto p-6 flex flex-col gap-5">

            {/* Stream Control */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-4 text-[15px] font-bold text-white uppercase tracking-wide">
                    <Radio size={18} /> Stream Control
                </div>

                <button className="w-full h-[72px] relative overflow-hidden rounded-xl font-bold text-xl uppercase tracking-wide text-white bg-gradient-to-br from-[#FF3B30] to-[#FF2D55] shadow-[0_8px_24px_rgba(255,59,48,0.4)] hover:-translate-y-1 transition-all active:scale-[0.98]">
                    <span className="relative z-10">Go Live</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite]" />
                </button>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <button className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 rounded-lg font-semibold text-white transition-all">
                        <Pause size={18} /> Pause
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 rounded-lg font-semibold text-white transition-all">
                        <Square size={18} /> Stop
                    </button>
                </div>

                <div className="mt-4 p-3 bg-black/20 rounded-lg text-sm">
                    <div className="text-[#6B6B85] text-xs uppercase mb-1">Destination</div>
                    <div className="text-white font-medium">YouTube Main Channel</div>
                    <div className="text-[#A0A0B8] font-mono mt-1 text-xs">Key: ************k4x2</div>
                </div>
            </GlassCard>

            {/* Quick Settings */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-4 text-[15px] font-bold text-white uppercase tracking-wide">
                    <Settings size={18} /> Quick Settings
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[#A0A0B8] text-sm">Preset</span>
                        <span className="text-white font-medium">1080p60 High Quality</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[#A0A0B8] text-sm">Video</span>
                        <span className="text-white font-mono font-bold">8000 kbps</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-[#A0A0B8] text-sm">Audio</span>
                        <span className="text-white font-mono font-bold">320 kbps AAC</span>
                    </div>
                </div>
            </GlassCard>

            {/* Monitoring */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-4 text-[15px] font-bold text-white uppercase tracking-wide">
                    <Activity size={18} /> System Monitoring
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#A0A0B8]">Network Upload</span>
                            <span className="text-white font-mono">9.2 Mbps</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[85%] bg-blue-500 rounded-full" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#A0A0B8]">CPU Usage</span>
                            <span className="text-white font-mono">28%</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[28%] bg-purple-500 rounded-full" />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Alerts */}
            <GlassCard variant="success" className="p-4">
                <div className="flex items-center gap-2 mb-2 text-[15px] font-bold text-white uppercase tracking-wide">
                    <Bell size={16} /> Alerts
                </div>
                <div className="text-[#30D158] text-sm font-medium">✓ All systems healthy</div>
            </GlassCard>

            {/* Recent Streams Placeholder */}
            <GlassCard className="p-5 opacity-80">
                <div className="flex items-center gap-2 mb-2 text-[15px] font-bold text-white uppercase tracking-wide">
                    <History size={16} /> Recent Streams
                </div>
                <div className="space-y-2">
                    <div className="text-sm text-[#A0A0B8]">Today 14:20 (2h 34m)</div>
                    <div className="text-sm text-[#A0A0B8]">Yesterday 09:15 (2h 32m)</div>
                </div>
            </GlassCard>

        </div>
    );
};
