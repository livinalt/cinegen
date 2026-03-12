# CineGen — AI Live Event Background Generator

Real-time AI background generation for churches, concerts, and live events.  
Built on Daydream Scope (StreamDiffusion / LongLive) + Next.js 14.

---

## Architecture

```
CineGen (Next.js, localhost:3000)
    │
    │  WebRTC — video stream (peer-to-peer, no proxy)
    │  REST via /scope-api proxy — pipeline load, ICE servers
    ▼
Daydream Scope (localhost:8000)
    │
    └── Remote Inference → Daydream H100 cloud GPUs (free beta)
         OR local NVIDIA GPU (≥24GB VRAM)
```

**No separate Python backend needed.** Scope is the backend.

---

## Fixing "Server process exited with code 2 — no Python executable"

This error means Scope's bundled Python environment is broken or missing.

**Fix (Windows):**

1. Fully uninstall Daydream Scope from Control Panel → Programs
2. Delete the leftover venv folder:
   ```
   rmdir /s /q "C:\Users\<YourName>\AppData\Roaming\Daydream Scope\.venv"
   ```
3. Also delete cached models if present:
   ```
   rmdir /s /q "C:\Users\<YourName>\.daydream-scope"
   ```
4. Download the latest installer from:
   https://github.com/daydreamlive/scope/releases/latest/download/DaydreamScope-Setup.exe
5. Run the installer as Administrator (right-click → Run as administrator)
6. Launch Scope. Wait for it to finish setting up (first run downloads ~5GB of models)

**If the error persists:**
- Make sure Windows Defender / antivirus isn't blocking the venv creation
- Try installing to a different path (e.g. `D:\DaydreamScope`) if your user path has spaces
- Join the Daydream Discord: https://discord.com/invite/5sZu8xmn6U (#scope channel)

---

## Running CineGen

### 1. Start Daydream Scope
Open the Scope desktop app. For remote inference (no GPU needed):
- Go to Settings → Account → Sign in with Daydream
- Enable Remote Inference toggle
- Press Play on the LongLive pipeline

Confirm Scope is running: http://localhost:8000/health

### 2. Start CineGen frontend
```bash
npm install
npm run dev
```

Open http://localhost:3000

### 3. Connect in CineGen
Click **"Connect to Scope"** in the preview area.  
Pipeline loading takes 2–5 minutes on first run / remote inference.

---

## Project Structure

```
cinegen/
├── app/
│   ├── page.tsx              # Main editor
│   ├── layout.tsx            # Root layout + fonts
│   ├── globals.css           # Design tokens (CSS vars)
│   ├── pricing/page.tsx      # Pricing page
│   ├── login/                # Auth stub (Phase 7)
│   └── dashboard/            # Export history stub (Phase 7)
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx        # Brand, Scope status, mode switcher
│   │   └── ThemeProvider.tsx
│   ├── panels/
│   │   ├── LeftPanel.tsx     # Presets, upload zone, output settings
│   │   ├── RightPanel.tsx    # AI prompt gen, sliders, FX, lyrics
│   │   └── BottomBar.tsx     # Prompt input, record & export
│   ├── preview/
│   │   ├── CenterPreview.tsx # Preview container + HUD overlays
│   │   ├── ScopePreview.tsx  # ← Live Scope WebRTC video (Phase 6)
│   │   └── MockPreviewCanvas.tsx  # Canvas fallback (no Scope)
│   ├── modals/
│   │   └── SettingsModal.tsx
│   └── ui/                   # Slider, Toggle, Modal, ThemeToggle
├── context/
│   └── AppContext.tsx        # Global state (useReducer)
├── hooks/
│   ├── useScopeWebRTC.ts     # ← Scope WebRTC connection (Phase 6)
│   ├── useKeyboard.ts        # Global shortcuts
│   ├── useSlider.ts
│   └── useFPS.ts
├── lib/
│   ├── presets.ts            # 36 presets × 6 categories
│   └── utils.ts
├── types/index.ts
├── next.config.js            # /scope-api proxy → localhost:8000
└── .env.local                # SCOPE_URL, PAYMENTS_ENABLED
```

---

## Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1–5   | ✅ Done | Full Next.js UI, design system, all components |
| 6     | ✅ Done | Daydream Scope WebRTC integration (T2V) |
| 7     | ⏳ Next | Supabase auth + Stripe billing |
| 8     | ⏳ Later | Responsive, a11y, Vercel deploy |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SCOPE_URL` | `http://localhost:8000` | Daydream Scope server URL |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | Set `true` to enforce tier gating |
