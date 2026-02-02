// Mock data generators for all dashboard components

export interface HealthData {
    cpu: number;
    gpu: number;
    temperature: number;
    memory: { used: number; total: number };
    timestamp: number;
}

export interface EncodingHealth {
    keyframes: 'stable' | 'unstable';
    gop: string;
    audioSync: number; // ms
    codecHealth: 'nominal' | 'warning' | 'critical';
}

export interface StreamStats {
    bitrate: number;
    fps: number;
    droppedFrames: number;
    network: {
        upload: number;
        rtt: number;
        drops: number;
        interfaceSpeed: number; // Mbps
    };
    encoding: EncodingHealth;
    youtubeIngest: 'excellent' | 'good' | 'poor' | 'unstable';
    timestamp: number;
}

export interface AIInsights {
    viewership: {
        peak: number;
        current: number;
        average: number;
        regions: Array<{ country: string; percentage: number }>;
    };
    chat: {
        topics: string[];
        sentiment: string;
        technicalMentions: string[];
    };
}

export interface Input {
    id: string;
    name: string;
    type: string;
    format: string;
    codec?: string;
    bitDepth?: string;
    active: boolean;
    thumbnailUrl?: string;
}

export interface StreamEndpoint {
    id: string;
    name: string;
    active: boolean;
    streamId: string;
    latency: string;
    presets: Array<{
        id: string;
        name: string;
        bitrate: number;
        codec: string;
        active: boolean;
    }>;
}

export interface SessionState {
    isLive: boolean;
    isRecording: boolean;
    elapsedTime: number;
    recordingTime: number;
    activeInput: string;
    activeEndpoint: string;
    activePreset: string;
}

// Mock data generators
export const generateHealthData = (): HealthData => ({
    cpu: 25 + Math.random() * 20,
    gpu: 40 + Math.random() * 15,
    temperature: 48 + Math.random() * 10,
    memory: { used: 4 + Math.random() * 2, total: 16 },
    timestamp: Date.now(),
});

export const generateStreamStats = (): StreamStats => ({
    bitrate: 5800 + Math.random() * 400,
    fps: 59.94,
    droppedFrames: Math.floor(Math.random() * 20),
    network: {
        upload: 11 + Math.random() * 3,
        rtt: 40 + Math.random() * 20,
        drops: Math.random() * 0.3,
        interfaceSpeed: 1000, // 1Gbps fixed link
    },
    encoding: {
        keyframes: Math.random() > 0.05 ? 'stable' : 'unstable',
        gop: '2.0s',
        audioSync: Math.floor(Math.random() * 30) - 15,
        codecHealth: 'nominal',
    },
    youtubeIngest: Math.random() > 0.1 ? 'excellent' : 'good',
    timestamp: Date.now(),
});

export const generateAIInsights = (): AIInsights => ({
    viewership: {
        peak: 1523,
        current: 1200 + Math.floor(Math.random() * 100),
        average: 634,
        regions: [
            { country: 'US', percentage: 42 },
            { country: 'EU', percentage: 31 },
            { country: 'IN', percentage: 12 },
        ],
    },
    chat: {
        topics: ['Setup questions', 'Audio quality praise', 'Timestamp requests'],
        sentiment: 'positive',
        technicalMentions: ['3 users reported lag at 10:45'],
    },
});

export const mockInputs: Input[] = [
    {
        id: 'cam1',
        name: 'CAM 1',
        type: 'SDI',
        format: '1080p59.94',
        codec: 'Rec.709',
        bitDepth: '10-bit',
        active: true,
        thumbnailUrl: '/api/inputs/cam1/thumbnail',
    },
    {
        id: 'cam2',
        name: 'CAM 2',
        type: 'SDI',
        format: '1080p59.94',
        codec: 'Rec.709',
        bitDepth: '10-bit',
        active: false,
    },
    {
        id: 'hdmi',
        name: 'HDMI IN',
        type: 'HDMI',
        format: '1080p60',
        active: false,
    },
    {
        id: 'media',
        name: 'MEDIA PLAYER',
        type: 'Media',
        format: '1080p60',
        active: false,
    },
];

export const mockEndpoints: StreamEndpoint[] = [
    {
        id: 'youtube',
        name: 'YouTube',
        active: true,
        streamId: '********x4k2',
        latency: 'Normal',
        presets: [
            { id: '1080p60-high', name: '1080p60 High', bitrate: 6000, codec: 'H.264', active: true },
            { id: '1080p30-standard', name: '1080p30 Standard', bitrate: 4500, codec: 'H.264', active: false },
            { id: '720p60-mobile', name: '720p60 Mobile', bitrate: 3000, codec: 'H.264', active: false },
        ],
    },
];

export const mockSessionState: SessionState = {
    isLive: true,
    isRecording: true,
    elapsedTime: 9258, // 2h 34m 18s
    recordingTime: 9258,
    activeInput: 'cam1',
    activeEndpoint: 'youtube',
    activePreset: '1080p60-high',
};

// Utility to format elapsed time
export const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
