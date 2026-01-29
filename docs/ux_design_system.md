# Professional SDI Streaming Dashboard - Desktop UX Design System
## Optimized for HD/4K Broadcast Monitoring (1920×1080 / 3840×2160)

---

## 🎨 VISUAL DESIGN LANGUAGE

### Design Philosophy
**"Broadcast Control Center"**

A professional broadcast interface designed exclusively for desktop displays (HD/4K). Fixed-width layouts optimized for 16:9 aspect ratios. Every pixel positioned for maximum information density and operational efficiency on large screens.

---

## 📐 DESIGN SYSTEM FOUNDATION

### Target Resolutions

#### Primary: Full HD (1920×1080)
```
Screen: 1920×1080px
Usable: 1920×1020px (excluding 60px status bar)
Layout: Fixed width, centered content
Sidebar: 420px fixed
Main: 1440px fluid
Drawer: 400px expandable
```

#### Secondary: 4K/UHD (3840×2160)
```
Screen: 3840×2160px
Usable: 3840×2100px (excluding 60px status bar)
Layout: Fixed width, centered content with 2x scaling
All measurements: 2x for 4K (retina-quality assets)
```

### Color Palette

```css
/* Background Layers */
--bg-primary: #0A0A0F;           /* Deep space black - base canvas */
--bg-secondary: #15151F;         /* Card backgrounds */
--bg-tertiary: #1C1C28;          /* Elevated surfaces */

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-shadow: rgba(0, 0, 0, 0.5);
--glass-highlight: rgba(255, 255, 255, 0.1);

/* Text Hierarchy */
--text-primary: #FFFFFF;         /* Pure white - primary content */
--text-secondary: #A0A0B8;       /* Muted purple-gray - labels */
--text-tertiary: #6B6B85;        /* Subtle gray - metadata */

/* Status Colors */
--status-live: #FF3B30;          /* Vibrant red - streaming */
--status-ready: #30D158;         /* Apple green - healthy */
--status-warning: #FF9F0A;       /* Amber - attention needed */
--status-error: #FF453A;         /* Error red - critical */
--status-info: #0A84FF;          /* iOS blue - informational */
--status-standby: #FFD60A;       /* Yellow - standby mode */

/* Accent Colors */
--accent-primary: #007AFF;       /* iOS blue - primary actions */
--accent-secondary: #5E5CE6;     /* Purple - secondary actions */
--accent-glow: #0A84FF;          /* Glow effects */
```

### Typography

```css
/* Font Stack */
--font-display: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
--font-text: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'SF Mono', 'Courier New', monospace;

/* Type Scale (optimized for HD/4K) */
--text-xs: 11px;     /* Metadata, timestamps */
--text-sm: 13px;     /* Labels, captions */
--text-base: 15px;   /* Body text */
--text-lg: 17px;     /* Emphasized text */
--text-xl: 20px;     /* Section headers */
--text-2xl: 28px;    /* Page headers */
--text-3xl: 34px;    /* Hero text */
--text-4xl: 48px;    /* Display numbers (metrics) */
--text-5xl: 64px;    /* Large status displays */

/* Font Weights */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Spacing System (8px Grid)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Border Radius

```css
--radius-sm: 6px;    /* Small elements, chips */
--radius-md: 12px;   /* Cards, buttons */
--radius-lg: 16px;   /* Large cards */
--radius-xl: 24px;   /* Hero cards, modals */
--radius-full: 9999px; /* Pills, circles */
```

### Shadows & Depth

```css
/* Standard Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 24px 48px rgba(0, 0, 0, 0.6);

/* Glow Effects */
--shadow-glow-sm: 0 0 20px rgba(10, 132, 255, 0.3);
--shadow-glow-md: 0 0 40px rgba(10, 132, 255, 0.4);
--shadow-glow-lg: 0 0 60px rgba(10, 132, 255, 0.5);

/* Live/Critical Glows */
--shadow-live: 0 0 40px rgba(255, 59, 48, 0.4);
--shadow-critical: 0 0 60px rgba(255, 69, 58, 0.6);
```

---

## 🏗️ DESKTOP LAYOUT ARCHITECTURE

### Fixed Desktop Grid (1920×1080)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STATUS BAR (fixed, 60px height, full width)                                │
│  ● LIVE  02:34:18 │ 👁 1,247 │ 🔴 Rec │ ⚡ Excellent │ 8.5Mbps │ 0% Drop    │
├───────────────────────────────────────┬─────────────────────────────────────┤
│                                       │                                     │
│  MAIN CONTENT AREA                    │  RIGHT SIDEBAR                      │
│  (1440px width)                       │  (420px fixed width)                │
│                                       │                                     │
│  ┌─────────────────────────────────┐  │  ┌───────────────────────────────┐ │
│  │                                 │  │  │  🎛️ STREAM CONTROL           │ │
│  │  VIDEO PREVIEW MONITOR          │  │  │  ┌─────────────────────────┐ │ │
│  │  (1280×720 @ 16:9)              │  │  │  │   🔴 GO LIVE            │ │ │
│  │                                 │  │  │  └─────────────────────────┘ │ │
│  │  [Full SDI Input Feed]          │  │  │  ⏸ Pause  │  ⏹ Stop         │ │
│  │                                 │  │  └───────────────────────────────┘ │
│  │  ┌─── Overlay Toolbar ───────┐  │  │                                     │
│  │  │ 🎨 📊 🔊 ⚙️  │  ⚡ 📸 ⛶ │  │  │  ┌───────────────────────────────┐ │
│  │  └──────────────────────────┘  │  │  │  ⚙️ QUICK SETTINGS           │ │
│  └─────────────────────────────────┘  │  │  YouTube Main                │ │
│                                       │  │  1080p60 High Quality        │ │
│  ┌─ Audio Meters ─────────────────┐  │  │  [Change Preset ▾]           │ │
│  │ L: ▓▓▓▓▓▓▓░░░░ -18dB           │  │  └───────────────────────────────┘ │
│  │ R: ▓▓▓▓▓▓▓▓░░░ -16dB           │  │                                     │
│  └─────────────────────────────────┘  │  ┌───────────────────────────────┐ │
│                                       │  │  📊 MONITORING                │ │
│  ┌─ Quick Stats ──────────────────┐  │  │  Network: ● Excellent         │ │
│  │ 1920×1080p59.94 │ Rec.709      │  │  │  Bitrate: 8.5 Mbps           │ │
│  │ 48kHz Stereo │ -18dB LUFS      │  │  │  CPU: 28% │ GPU: 45%         │ │
│  └─────────────────────────────────┘  │  │  Temp: 52°C │ Dropped: 0     │ │
│                                       │  └───────────────────────────────┘ │
│  ┌─────────────────────────────────┐  │                                     │
│  │  📈 LIVE METRICS (expandable)   │  │  ┌───────────────────────────────┐ │
│  │                                 │  │  │  🔔 ALERTS                    │ │
│  │  [Bitrate Graph - Real-time]    │  │  │  ✓ All systems normal         │ │
│  │  [Network Graph - RTT/Loss]     │  │  │  No warnings                  │ │
│  │  [CPU/GPU Usage]                │  │  └───────────────────────────────┘ │
│  │                                 │  │                                     │
│  │  [Expand for Full Metrics ▼]    │  │  ┌───────────────────────────────┐ │
│  └─────────────────────────────────┘  │  │  📺 RECENT STREAMS            │ │
│                                       │  │  Today 14:20 (2h 34m)         │ │
│                                       │  │  Yesterday 09:15 (2h 32m)     │ │
│                                       │  │  [View All History →]         │ │
│                                       │  └───────────────────────────────┘ │
│                                       │                                     │
│                                       │  [Scrollable sidebar content]       │
│                                       │                                     │
├───────────────────────────────────────┴─────────────────────────────────────┤
│  BOTTOM DRAWER (expandable 0-400px, collapsible)                            │
│  [Tabs] Event Log │ Session Stats │ Advanced Settings │ Stream History      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  [Tab Content - Full width when expanded]                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

Total Height: 1080px (60px bar + 620px main + 400px drawer max)
Total Width: 1920px (1440px main + 420px sidebar + 60px margins)
```
