'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { AppState, AppAction, ControlParams } from '@/types'
import { DEFAULT_PRESET, getPresetById } from '@/lib/presets'

// ─── Default State ────────────────────────────────────────────────────────────
const defaultParams: ControlParams = {
  mode: 'generate',
  sourceVideoPath: '',
  prompt: DEFAULT_PRESET.prompt,
  negativePrompt: DEFAULT_PRESET.negativePrompt,
  activePresetId: DEFAULT_PRESET.id,
  motionSpeed: 0.45,
  transformStrength: 0.60,
  atmosphere: 0.50,
  brightness: 0.62,
  smoothness: 0.68,
  fxGlow: false,
  fxVignette: true,
  fxGrain: false,
  fxBlur: false,
  fxFlicker: false,
  fxTrails: false,
  ndiEnabled: false,
  virtualCameraEnabled: true,
  lyricsEnabled: true,
  watermarkEnabled: false, // disabled — all features unlocked for testing
  freeze: false,
  blackout: false,
  outputWidth: 1920,
  outputHeight: 1080,
}

const initialState: AppState = {
  params: defaultParams,
  isLive: true,
  fps: 0,
  latencyMs: 0,
  scopeConnected: false,
  tier: 'pro', // all features unlocked for testing (PAYMENTS_ENABLED=false)

  lyricsLines: [
    'Soft golden light streaming down',
    'Heavenly radiance fills the room',
    'Your glory surrounds us now',
    'We worship in your presence here',
    'Nothing else could satisfy',
    'You are the reason that we sing',
  ],
  activeLyricIndex: 0,
  lyricsPosition: 'bottom' as const,

  exportInProgress: false,
  exportProgress: 0,
  exportDownloadUrl: null,
  exportDuration: 15 as (15 | 30 | 60 | null),
  exportResolution: '1080p',

  audioFileName: null,
  audioFileUrl: null,
  audioEnabled: false,
  audioVolume: 0.8,

  sourceVideoLoaded: false,
  sourceVideoName: '',
  sourceVideoDuration: 0,

  // ── NEW fields for sending video to Scope ────────────────────────────────
  sourceVideoFile: null as File | null,
  sourceVideoUrl: null as string | null,
  sourceVideoElement: null as HTMLVideoElement | null,
  sourceCanvasElement: null as HTMLCanvasElement | null,
  sourceVideoStream: null as MediaStream | null,

  activeCategoryTab: 'Worship',
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    case 'SET_PARAM':
      return { ...state, params: { ...state.params, [action.key]: action.value } }

    case 'SET_PARAMS':
      return { ...state, params: { ...state.params, ...action.params } }

    case 'SET_MODE':
      return { ...state, params: { ...state.params, mode: action.mode } }

    case 'SET_PRESET': {
      const p = action.preset
      return {
        ...state,
        params: {
          ...state.params,
          activePresetId: p.id,
          prompt: p.prompt,
          negativePrompt: p.negativePrompt,
        },
        activeCategoryTab: p.category,
      }
    }

    case 'SET_TIER':
      return { ...state, tier: action.tier }

    case 'SET_LIVE':
      return { ...state, isLive: action.isLive }

    case 'SET_FPS':
      return { ...state, fps: action.fps }

    case 'SET_LATENCY':
      return { ...state, latencyMs: action.latencyMs }

    case 'SET_SCOPE_CONNECTED':
      return { ...state, scopeConnected: action.connected }

    case 'SET_LYRICS': {
      const lines = action.lines.filter(l => l.trim().length > 0)
      return { ...state, lyricsLines: lines, activeLyricIndex: 0 }
    }

    case 'SET_ACTIVE_LYRIC':
      return {
        ...state,
        activeLyricIndex: Math.max(0, Math.min(action.index, state.lyricsLines.length - 1)),
      }

    case 'NEXT_LYRIC':
      return {
        ...state,
        activeLyricIndex: Math.min(state.activeLyricIndex + 1, state.lyricsLines.length - 1),
      }

    case 'PREV_LYRIC':
      return {
        ...state,
        activeLyricIndex: Math.max(state.activeLyricIndex - 1, 0),
      }

    case 'TOGGLE_FREEZE':
      return { ...state, params: { ...state.params, freeze: !state.params.freeze } }

    case 'TOGGLE_BLACKOUT':
      return { ...state, params: { ...state.params, blackout: !state.params.blackout } }

    case 'RANDOMIZE': {
      const rand = (min: number, max: number) => Math.random() * (max - min) + min
      return {
        ...state,
        params: {
          ...state.params,
          motionSpeed: parseFloat(rand(0.2, 0.9).toFixed(2)),
          transformStrength: parseFloat(rand(0.3, 0.85).toFixed(2)),
          atmosphere: parseFloat(rand(0.3, 0.8).toFixed(2)),
          brightness: parseFloat(rand(0.4, 0.8).toFixed(2)),
          smoothness: parseFloat(rand(0.5, 0.9).toFixed(2)),
        },
      }
    }

    case 'RESET_TO_PRESET': {
      const preset = getPresetById(state.params.activePresetId)
      if (!preset) return state
      return {
        ...state,
        params: {
          ...defaultParams,
          activePresetId: preset.id,
          prompt: preset.prompt,
          negativePrompt: preset.negativePrompt,
        },
      }
    }

    case 'SET_EXPORT_DURATION':
      return { ...state, exportDuration: action.duration }

    case 'SET_AUDIO':
      return { ...state, audioFileName: action.fileName, audioFileUrl: action.url, audioEnabled: true }

    case 'CLEAR_AUDIO':
      return { ...state, audioFileName: null, audioFileUrl: null, audioEnabled: false }

    case 'SET_AUDIO_ENABLED':
      return { ...state, audioEnabled: action.enabled }

    case 'SET_AUDIO_VOLUME':
      return { ...state, audioVolume: action.volume }

    case 'SET_EXPORT_RESOLUTION':
      return { ...state, exportResolution: action.resolution }

    case 'SET_EXPORT_PROGRESS':
      return { ...state, exportProgress: action.progress }

    case 'SET_EXPORT_URL':
      return { ...state, exportDownloadUrl: action.url }

    case 'SET_EXPORT_IN_PROGRESS':
      return { ...state, exportInProgress: action.inProgress }

    // ── UPDATED: richer payload for video source ─────────────────────────────
    case 'SET_SOURCE_VIDEO':
      return {
        ...state,
        sourceVideoLoaded: true,
        sourceVideoName: action.name,
        sourceVideoDuration: action.duration ?? 0,
        sourceVideoFile: action.file ?? null,
        sourceVideoUrl: action.url ?? null,
        sourceVideoElement: action.videoEl ?? null,
        sourceCanvasElement: action.canvasEl ?? null,
        sourceVideoStream: action.stream ?? null,
      }

    case 'CLEAR_SOURCE_VIDEO':
      return {
        ...state,
        sourceVideoLoaded: false,
        sourceVideoName: '',
        sourceVideoDuration: 0,
        sourceVideoFile: null,
        sourceVideoUrl: null,
        sourceVideoElement: null,
        sourceCanvasElement: null,
        sourceVideoStream: null,
        params: { ...state.params, sourceVideoPath: '' },
      }

    case 'SET_CATEGORY_TAB':
      return { ...state, activeCategoryTab: action.category }

    case 'SET_LYRICS_POSITION':
      return { ...state, lyricsPosition: action.position }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Convenience helpers
  setParam: (key: keyof ControlParams, value: any) => void
  isProFeature: (feature: string) => boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const setParam = useCallback((key: keyof ControlParams, value: any) => {
    dispatch({ type: 'SET_PARAM', key, value })
  }, [])

  // All features unlocked when PAYMENTS_ENABLED=false
  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'
  const isProFeature = useCallback((_feature: string) => {
    if (!paymentsEnabled) return true // everything unlocked
    return state.tier === 'pro' || state.tier === 'team'
  }, [state.tier, paymentsEnabled])

  return (
    <AppContext.Provider value={{ state, dispatch, setParam, isProFeature }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}