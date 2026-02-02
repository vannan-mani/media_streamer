// Production data interfaces for the Media Streamer Dashboard

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

// Global UI Constants
export const INITIAL_STREAM_STATS: StreamStats = {
    bitrate: 0,
    fps: 0,
    droppedFrames: 0,
    network: { upload: 0, rtt: 0, drops: 0, interfaceSpeed: 1000 },
    encoding: { keyframes: 'stable', gop: '2.0s', audioSync: 0, codecHealth: 'nominal' },
    youtubeIngest: 'good',
    timestamp: Date.now()
};

export const INITIAL_HEALTH_DATA: HealthData = {
    cpu: 0,
    gpu: 0,
    temperature: 0,
    memory: { used: 0, total: 16 },
    timestamp: Date.now()
};
