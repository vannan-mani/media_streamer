import { DashboardLayout } from './components/layout/DashboardLayout';
import { VideoPreview } from './components/widgets/VideoPreview';
import { AudioMeters } from './components/widgets/AudioMeters';

function App() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full max-w-[1280px]">
        <VideoPreview />
        <AudioMeters />
      </div>
    </DashboardLayout>
  )
}

export default App
