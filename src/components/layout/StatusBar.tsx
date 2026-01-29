import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

export const StatusBar = () => {
    return (
        <div className="h-[60px] w-full fixed top-0 left-0 z-50 bg-[#0F0F14]/80 backdrop-blur-md border-b border-white/10 px-8 grid grid-cols-[1fr_auto_1fr] items-center shadow-md">
            {/* Left: Live Status */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_12px_rgba(255,59,48,0.6)] animate-pulse" />
                    <span className="text-[15px] font-bold text-[#FF3B30] uppercase tracking-wide">LIVE</span>
                </div>
                <div className="text-xl font-mono font-bold text-white tracking-widest">
                    02:34:18
                </div>
            </div>

            {/* Center: Viewers & Recording */}
            <div className="flex items-center gap-6 justify-center">
                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2 text-sm font-semibold hover:translate-y-[-2px] hover:shadow transition-all cursor-pointer">
                    <span className="text-white">👁</span>
                    <span className="font-mono text-white">1,247</span>
                </div>

                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2 text-sm font-semibold text-[#FF3B30] hover:translate-y-[-2px] hover:shadow transition-all cursor-pointer">
                    <span className="animate-pulse">🔴</span>
                    <span className="font-medium">REC</span>
                </div>

                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2 text-sm font-semibold text-[#30D158] hover:translate-y-[-2px] hover:shadow transition-all cursor-pointer">
                    <Activity size={16} />
                    <span>Excellent</span>
                </div>
            </div>

            {/* Right: System Metrics */}
            <div className="flex items-center gap-6 justify-end">
                <MetricPill label="Bitrate" value="8.5 Mbps" />
                <MetricPill label="Drop" value="0%" warning={false} />
                <MetricPill label="CPU" value="28%" />
                <MetricPill label="GPU" value="45%" />
            </div>
        </div>
    );
};

const MetricPill = ({ label, value, warning }: { label: string; value: string; warning?: boolean }) => (
    <div className={`px-3 py-1.5 bg-white/5 rounded-lg flex items-center gap-2 text-[13px] font-mono text-[#A0A0B8] ${warning ? 'border border-[#FF9F0A]/30 bg-[#FF9F0A]/10' : ''}`}>
        {(label === 'CPU' || label === 'GPU') ? <Cpu size={14} /> : (label === 'Bitrate' ? <Wifi size={14} /> : <HardDrive size={14} />)}
        <span>{label}:</span>
        <span className={`font-bold ${warning ? 'text-[#FF9F0A]' : 'text-white'}`}>{value}</span>
    </div>
);
