// ─── Preset ──────────────────────────────────────────────────────────────────
export type PresetCategory =
  | 'Worship'
  | 'Celebration'
  | 'Corporate'
  | 'Nature'
  | 'Seasonal'
  | 'Concert'

export type PresetTier = 'free' | 'pro'

export interface Preset {
  id: string
  name: string
  category: PresetCategory
  tier: PresetTier
  prompt: string
  negativePrompt: string
  colors: [string, string, string]   // [primary, secondary, highlight]
  hue: number                         // base hue for canvas simulation
}

// ─── Control Params ───────────────────────────────────────────────────────────
export interface ControlParams {
  // Mode
  mode: 'generate' | 'transform'
  sourceVideoPath: string

  // Prompt
  prompt: string
  negativePrompt: string
  activePresetId: string

  // Sliders (0–1)
  motionSpeed: number
  transformStrength: number
  atmosphere: number
  brightness: number
  smoothness: number

  // FX
  fxGlow: boolean
  fxVignette: boolean
  fxGrain: boolean
  fxBlur: boolean
  fxFlicker: boolean
  fxTrails: boolean

  // Output
  ndiEnabled: boolean
  virtualCameraEnabled: boolean
  lyricsEnabled: boolean

  // System
  watermarkEnabled: boolean
  freeze: boolean
  blackout: boolean
  outputWidth: number
  outputHeight: number
}

// ─── App State ────────────────────────────────────────────────────────────────
export interface AppState {
  params: ControlParams
  isLive: boolean
  fps: number
  latencyMs: number
  scopeConnected: boolean
  tier: 'free' | 'pro' | 'team'

  // Lyrics
  lyricsLines: string[]
  activeLyricIndex: number
  lyricsPosition: 'top' | 'center' | 'bottom'

  // Export
  exportInProgress: boolean
  exportProgress: number
  exportDownloadUrl: string | null
  exportDuration: 15 | 30 | 60 | null  // null = unlimited (Pro only)
  exportResolution: '1080p' | '4K'

  // Audio
  audioFileName: string | null
  audioFileUrl: string | null  // object URL
  audioEnabled: boolean
  audioVolume: number           // 0–1

  // Transform mode
  sourceVideoLoaded: boolean
  sourceVideoName: string
  sourceVideoDuration: number

  // UI
  activeCategoryTab: PresetCategory
}

// ─── Action Types ─────────────────────────────────────────────────────────────
export type AppAction =
  | { type: 'SET_PARAM'; key: keyof ControlParams; value: any }
  | { type: 'SET_PARAMS'; params: Partial<ControlParams> }
  | { type: 'SET_MODE'; mode: 'generate' | 'transform' }
  | { type: 'SET_PRESET'; preset: Preset }
  | { type: 'SET_TIER'; tier: 'free' | 'pro' | 'team' }
  | { type: 'SET_LIVE'; isLive: boolean }
  | { type: 'SET_FPS'; fps: number }
  | { type: 'SET_LATENCY'; latencyMs: number }
  | { type: 'SET_SCOPE_CONNECTED'; connected: boolean }
  | { type: 'SET_LYRICS'; lines: string[] }
  | { type: 'SET_ACTIVE_LYRIC'; index: number }
  | { type: 'NEXT_LYRIC' }
  | { type: 'PREV_LYRIC' }
  | { type: 'TOGGLE_FREEZE' }
  | { type: 'TOGGLE_BLACKOUT' }
  | { type: 'RANDOMIZE' }
  | { type: 'RESET_TO_PRESET' }
  | { type: 'SET_EXPORT_RESOLUTION'; resolution: '1080p' | '4K' }
  | { type: 'SET_EXPORT_PROGRESS'; progress: number }
  | { type: 'SET_EXPORT_URL'; url: string | null }
  | { type: 'SET_EXPORT_IN_PROGRESS'; inProgress: boolean }
  | { type: 'SET_SOURCE_VIDEO'; name: string; duration: number }
  | { type: 'CLEAR_SOURCE_VIDEO' }
  | { type: 'SET_CATEGORY_TAB'; category: PresetCategory }
  | { type: 'SET_LYRICS_POSITION'; position: 'top' | 'center' | 'bottom' }
  | { type: 'SET_EXPORT_DURATION'; duration: 15 | 30 | 60 | null }
  | { type: 'SET_AUDIO'; fileName: string; url: string }
  | { type: 'CLEAR_AUDIO' }
  | { type: 'SET_AUDIO_ENABLED'; enabled: boolean }
  | { type: 'SET_AUDIO_VOLUME'; volume: number }

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  tier: 'free' | 'pro' | 'team'
  avatarInitials: string
}
