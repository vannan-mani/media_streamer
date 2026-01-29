import { Palette, BarChart2, Volume2, Settings, Shield, Camera, Maximize } from 'lucide-react';

export const VideoPreview = () => {
    return (
        <div className="w-full max-w-[1280px] aspect-video relative group rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">

            {/* Main Video Content (Placeholder) */}
            <div className="w-full h-full flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <div className="text-white/20 font-mono text-3xl mb-2">[NO SIGNAL INPUT]</div>
                    <div className="text-white/10 font-mono text-sm">SDI INPUT 1 • 1080p60</div>
                </div>
            </div>

            {/* Hover Overlay Container */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-between p-6">

                {/* Top Toolbar */}
                <div className="w-full flex justify-center pointer-events-auto transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex gap-3 p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl">
                        <ToolButton icon={<Palette size={20} />} label="Color" />
                        <ToolButton icon={<BarChart2 size={20} />} label="Scope" />
                        <ToolButton icon={<Volume2 size={20} />} label="Audio" />
                        <ToolButton icon={<Settings size={20} />} label="Setup" />
                        <div className="w-px h-full bg-white/10 mx-1" />
                        <ToolButton icon={<Shield size={20} />} label="Safe" />
                        <ToolButton icon={<Camera size={20} />} label="Snap" />
                        <ToolButton icon={<Maximize size={20} />} label="Full" />
                    </div>
                </div>

                {/* Bottom Info Bar */}
                <div className="pointer-events-auto transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex justify-between items-end">
                        <div className="flex gap-4">
                            <StatusChip label="1920x1080p59.94" />
                            <StatusChip label="Rec.709" />
                            <StatusChip label="10-bit" />
                        </div>
                        <div className="font-mono text-white/80 font-bold bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                            TC: 01:23:45:12
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolButton = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <button className="w-14 h-14 flex flex-col items-center justify-center gap-1 rounded-lg bg-white/5 border border-white/5 hover:bg-blue-500 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(0,122,255,0.4)] transition-all group/btn">
        <div className="text-white/80 group-hover/btn:text-white transition-colors">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 group-hover/btn:text-white transition-colors">{label}</span>
    </button>
);

const StatusChip = ({ label }: { label: string }) => (
    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-xs font-mono font-medium text-white/80">
        {label}
    </div>
);
