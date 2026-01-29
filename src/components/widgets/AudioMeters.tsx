import { GlassCard } from '../common/GlassCard';

export const AudioMeters = () => {
    return (
        <GlassCard className="p-6 bg-black/40 border-white/5 w-full max-w-[1280px]">
            <div className="flex flex-col gap-4">
                <AudioChannel channel="L" level={-18} peak={-12} />
                <AudioChannel channel="R" level={-16} peak={-10} />
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                <div className="flex gap-6 text-xs text-[#6B6B85] font-medium uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        Clip Warning (-3dB)
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                        Limiter Active
                    </div>
                </div>
                <div className="text-xs font-mono text-white/60">
                    LUFS: <span className="text-white font-bold ml-1">-18.2</span>
                </div>
            </div>
        </GlassCard>
    );
};

const AudioChannel = ({ channel, level, peak }: { channel: string; level: number; peak: number }) => {
    // Mock width calculation (simplified)
    // -60dB = 0%, 0dB = 100%
    // Formula: (level + 60) / 60 * 100
    const widthPct = Math.max(0, Math.min(100, ((level + 60) / 60) * 100));
    const peakPct = Math.max(0, Math.min(100, ((peak + 60) / 60) * 100));

    return (
        <div className="flex items-center gap-4">
            <div className="w-6 text-sm font-bold font-mono text-white">{channel}</div>

            <div className="flex-1 relative h-6 bg-[#0A0A0F] rounded-md border border-white/10 overflow-hidden">
                {/* Scale Markings */}
                <div className="absolute inset-0 flex justify-between px-[2px] z-20 pointer-events-none">
                    <div className="h-full w-px bg-white/10" /> {/* -60 */}
                    <div className="h-full w-px bg-white/10" /> {/* -40 */}
                    <div className="h-full w-px bg-white/10" /> {/* -20 */}
                    <div className="h-full w-px bg-white/20" /> {/* -12 */}
                    <div className="h-full w-px bg-white/20" /> {/* -6 */}
                    <div className="h-full w-px bg-red-500/50" /> {/* 0 */}
                </div>

                {/* Meter Fill */}
                <div
                    className="h-full bg-gradient-to-r from-[#30D158] via-[#30D158] to-[#FF9F0A]"
                    style={{ width: `${widthPct}%` }}
                />

                {/* Peak Indicator */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10 transition-all duration-300 ease-out"
                    style={{ left: `${peakPct}%` }}
                />
            </div>

            <div className="w-24 flex justify-end gap-2 text-xs font-mono">
                <span className="text-white font-bold">{level.toFixed(1)}</span>
                <span className="text-[#6B6B85]">{peak.toFixed(1)}</span>
            </div>
        </div>
    );
};
