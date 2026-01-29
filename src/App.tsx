import { DashboardLayout } from './components/layout/DashboardLayout';
import { GlassCard } from './components/common/GlassCard';

function App() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-[1280px] aspect-video relative group">

        {/* Video Preview Container */}
        <div className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">

          {/* Mock Video Content */}
          <div className="w-full h-full flex items-center justify-center bg-[#050505]">
            <span className="text-white/20 font-mono text-lg">[NO SIGNAL INPUT]</span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-between p-8">
            <div className="w-full flex justify-center pointer-events-auto">
              <GlassCard className="flex gap-4 px-4 py-2 bg-black/50 backdrop-blur-md border-white/10">
                <button className="text-xs font-bold text-white hover:text-blue-400 uppercase tracking-wider">Color</button>
                <div className="w-px h-4 bg-white/20"></div>
                <button className="text-xs font-bold text-white hover:text-blue-400 uppercase tracking-wider">Scope</button>
                <div className="w-px h-4 bg-white/20"></div>
                <button className="text-xs font-bold text-white hover:text-blue-400 uppercase tracking-wider">Audio</button>
              </GlassCard>
            </div>
            <div className="pointer-events-auto flex justify-between items-end">
              <div className="text-xs font-mono text-gray-400 bg-black/50 px-2 py-1 rounded">1920x1080p59.94 | Rec.709 | 10-bit</div>
            </div>
          </div>
        </div>

        {/* Audio Meters Placeholder */}
        <div className="mt-4">
          <GlassCard className="p-4 bg-black/30 border-white/5">
            <div className="flex gap-4 items-center mb-2">
              <div className="w-6 text-sm font-bold font-mono text-gray-400">L</div>
              <div className="flex-1 h-3 bg-white/10 rounded-sm overflow-hidden relative">
                <div className="absolute inset-0 flex justify-between px-1">
                  {[...Array(10)].map((_, i) => <div key={i} className="w-px h-full bg-black/20 z-10"></div>)}
                </div>
                <div className="w-[65%] h-full bg-gradient-to-r from-[#30D158] via-[#30D158] to-[#FF9F0A]" />
              </div>
              <div className="w-16 text-right text-xs font-mono text-white font-bold">-18.2 dB</div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-6 text-sm font-bold font-mono text-gray-400">R</div>
              <div className="flex-1 h-3 bg-white/10 rounded-sm overflow-hidden relative">
                <div className="absolute inset-0 flex justify-between px-1">
                  {[...Array(10)].map((_, i) => <div key={i} className="w-px h-full bg-black/20 z-10"></div>)}
                </div>
                <div className="w-[62%] h-full bg-gradient-to-r from-[#30D158] via-[#30D158] to-[#FF9F0A]" />
              </div>
              <div className="w-16 text-right text-xs font-mono text-white font-bold">-16.5 dB</div>
            </div>
          </GlassCard>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default App
