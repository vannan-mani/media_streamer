# Dashboard Testing Checklist

## Open Dashboard
**URL:** http://localhost:5173

---

## ✅ Visual Checks

### Layout (No Overflow)
- [ ] All content fits within viewport (no scrollbars on main dashboard)
- [ ] Status Strip at top (48px height by default)
- [ ] Main Monitor (black video area) on left (70% width)
- [ ] Control Stack on right (30% width, should scroll if needed)
- [ ] Context Drawer at bottom (should be open by default)

### Visual Sharpness
- [ ] Glass cards have **visible borders** (should be sharper than before)
- [ ] Glassmorphism effect is visible (frosted glass look)
- [ ] **Blue borders** appear on active/expanded cards
- [ ] Text is crisp and readable
- [ ] Shadows are visible on cards

### Status Strip (Top Bar)
- [ ] Shows "LIVE" indicator with pulse animation
- [ ] Time displays: `02:34:18` (monospace font)
- [ ] **REC badge** visible with recording time
- [ ] "YouTube" endpoint name
- [ ] "1080p60" badge (blue background)
- [ ] "HEALTH" icon on right

### Main Monitor (Center-Left)
- [ ] Black video area with "MAIN VIDEO PREVIEW — CAM 1" text
- [ ] **Audio meters** visible in bottom-left corner
  - [ ] L/R channels with horizontal bars
  - [ ] dB values shown (`-18`, `--16`)
- [ ] Hover over video to see technical overlay (top-right):
  - Should show: `1920×1080p59.94 | Rec.709 | 10-bit | TC 01:23:45`

### Control Stack (Right Side)
- [ ] **Input Card** visible (collapsed by default)
  - [ ] Shows: `CAM 1 — SDI 1080p59.94 • Rec.709 • 10-bit`
  - [ ] "ACTIVE" badge visible
- [ ] **Streaming Card** visible (collapsed by default)
  - [ ] Shows: `YouTube • Preset: 1080p60 High • 6000 kbps • H.264`
  - [ ] "LIVE" badge visible

### Context Drawer (Bottom)
- [ ] **Should be OPEN by default** (per your request)
- [ ] Header shows: "CONTEXT • YouTube" with mini sparkline
- [ ] Three columns visible:
  - [ ] **Network**: Upload, RTT, Drops (each with sparkline)
  - [ ] **Audience Summary**: Peak, Current, Average + regional bars
  - [ ] **Chat Insights**: Topics, Sentiment, Technical mentions

---

## 🎯 Interaction Tests

### 1. Status Strip
- [ ] **Hover**: Health sparklines appear (CPU, GPU, TEMP, MEM)
- [ ] **Click**: Locks expansion + shows numeric values below sparklines
- [ ] **Click again** or **Press ESC**: Collapses back to default

### 2. Input Card
- [ ] **Click card**: Expands to show all 4 inputs
- [ ] **Active input** (CAM 1) has:
  - [ ] Blue border (2px)
  - [ ] Thumbnail preview (placeholder: "Live Preview")
  - [ ] Full metadata visible
- [ ] Other inputs listed without thumbnails
- [ ] **Press ESC**: Card collapses

### 3. Streaming Card
- [ ] **Click card**: Expands to show all presets
- [ ] **Active preset** (1080p60 High) has blue border
- [ ] Other presets listed (1080p30, 720p60)
- [ ] Stream ID and Latency visible at bottom
- [ ] **Press ESC**: Card collapses

### 4. Context Drawer
- [ ] **Click header bar**: Toggles collapse/expand
- [ ] When open:
  - [ ] **Sparklines animate** (showing real-time updates every 2 seconds)
  - [ ] Network metrics update (Upload, RTT, Drops)
  - [ ] Audience count changes slightly
- [ ] **Press ESC**: Should NOT close (only closes cards)

### 5. ESC Key Behavior
- [ ] Press ESC when Status Strip expanded → Collapses
- [ ] Press ESC when Input card expanded → Collapses
- [ ] Press ESC when Streaming card expanded → Collapses
- [ ] Context Drawer stays open (as intended)

### 6. One Expansion at a Time
- [ ] Expand Status Strip → Click Input card → Status Strip auto-collapses ✅
- [ ] Expand Input card → Click Streaming card → Input card auto-collapses ✅
- [ ] Only ONE zone can be expanded at a time (except Context Drawer)

---

## 🌟 Live Data Tests

### Sparklines (Should Animate)
- [ ] Status Strip sparklines update every ~2 seconds when expanded
- [ ] Context Drawer sparklines update continuously
- [ ] Sparklines show **smooth curves** (not straight lines)
- [ ] **Threshold lines** visible on some sparklines (dashed horizontal line)

### Network Degradation Demo
- [ ] **Wait ~10-15 seconds**: Network alert should appear at top of video
- [ ] Alert shows: "Network degraded" with orange background
- [ ] Details: "Bitrate fluctuating • RTT increased to 120ms"
- [ ] Alert has **slide-in animation**

---

## 🎨 Glassmorphism Quality

### Visual Effects
- [ ] Cards have **frosted glass** appearance
- [ ] Background blur is visible through cards
- [ ] Borders are **sharp and visible** (not too faint)
- [ ] Shadows give cards **depth** (3D effect)
- [ ] Hover on cards → Slightly lighter background
- [ ] **Blue accent borders** on active elements are vibrant (`#007AFF`)

---

## 📱 Typography Check

### Font Rendering
- [ ] Headers use **SF Pro Display** (or system fallback)
- [ ] Body text uses **SF Pro Text**
- [ ] Metrics use **SF Mono** (monospace for numbers)
- [ ] Time values are aligned properly (tabular nums)
- [ ] Text is **crisp** (not blurry)

---

## ⚠️ Issues to Report

If you notice any problems, note them here:

**Layout Issues:**
- 

**Visual Issues:**
- 

**Interaction Issues:**
- 

**Performance Issues:**
- 

---

## ✅ Sign-Off

Once all checks pass:
- [ ] All layout zones visible without overflow
- [ ] Glass cards are sharp and clearly defined
- [ ] All interactions work (hover, click, ESC)
- [ ] Sparklines are animating
- [ ] Context drawer opens by default
- [ ] One expansion at a time rule works
- [ ] Ready to deploy to remote server

---

**After completing this checklist, you can deploy with:**
```powershell
npm run deploy
```
