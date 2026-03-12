import type { Preset } from '@/types'

export const PRESETS: Preset[] = [
  // ── WORSHIP ──────────────────────────────────────────────────────────────
  {
    id: 'heavenly', name: 'Heavenly', category: 'Worship', tier: 'free',
    prompt: 'soft golden light rays streaming through clouds, ethereal white atmosphere, gentle movement, sacred divine radiance, photorealistic cinematic',
    negativePrompt: 'dark, scary, violent, text, watermark, people, faces',
    colors: ['#f0d060', '#e8a840', '#faeea0'], hue: 45,
  },
  {
    id: 'peaceful', name: 'Peaceful', category: 'Worship', tier: 'free',
    prompt: 'calm still water reflection, soft blue and white light, gentle ripples, serene meditative, morning light on water, photorealistic',
    negativePrompt: 'storm, dark, chaotic, text, people',
    colors: ['#60b0e8', '#4090d0', '#a0d8f8'], hue: 205,
  },
  {
    id: 'holy-fire', name: 'Holy Fire', category: 'Worship', tier: 'free',
    prompt: 'holy fire flames rising upward, warm amber and deep red, passionate spiritual energy, glowing embers floating, cinematic dark background',
    negativePrompt: 'destructive, evil, text, people',
    colors: ['#ff5810', '#d04000', '#ff9040'], hue: 15,
  },
  {
    id: 'glory', name: 'Glory', category: 'Worship', tier: 'pro',
    prompt: 'radiant beams of light bursting through clouds, shimmering gold particles floating, majestic heavenly atmosphere, epic cinematic, divine light',
    negativePrompt: 'dark, text, watermark, people',
    colors: ['#f0d060', '#c8a020', '#fff0a0'], hue: 42,
  },
  {
    id: 'ocean', name: 'Ocean', category: 'Worship', tier: 'pro',
    prompt: 'vast deep blue ocean waves slow motion, soft seafoam, horizon golden light, peaceful and vast, cinematic drone perspective',
    negativePrompt: 'storm, violent, dark, text, people',
    colors: ['#0080c0', '#005898', '#40b0e8'], hue: 210,
  },
  {
    id: 'dawn', name: 'Dawn', category: 'Worship', tier: 'pro',
    prompt: 'sunrise over horizon, pink orange and gold sky, soft clouds catching first light, new day, hopeful warm light, photorealistic',
    negativePrompt: 'dark, night, text, people',
    colors: ['#f0a060', '#e07030', '#f8c890'], hue: 22,
  },

  // ── CELEBRATION ──────────────────────────────────────────────────────────
  {
    id: 'golden-gala', name: 'Golden Gala', category: 'Celebration', tier: 'free',
    prompt: 'elegant gold bokeh particles drifting slowly, luxury black background, subtle shimmer and glimmer, sophisticated event atmosphere',
    negativePrompt: 'cheap, cartoon, text, people',
    colors: ['#c89020', '#a07000', '#f0d060'], hue: 38,
  },
  {
    id: 'confetti', name: 'Confetti', category: 'Celebration', tier: 'free',
    prompt: 'colorful confetti falling slowly, celebration party, bright festive rainbow colors, joyful energy, slow motion macro confetti',
    negativePrompt: 'dark, sad, text, people',
    colors: ['#e02040', '#4070e0', '#20b040'], hue: 120,
  },
  {
    id: 'neon-party', name: 'Neon Party', category: 'Celebration', tier: 'pro',
    prompt: 'vibrant light bokeh, deep pink and purple bokeh orbs, party nightlife atmosphere, electric energy, soft glowing',
    negativePrompt: 'boring, dull, text, people',
    colors: ['#e000e0', '#800080', '#ff60ff'], hue: 290,
  },
  {
    id: 'elegant-black', name: 'Elegant Black', category: 'Celebration', tier: 'pro',
    prompt: 'ultra minimal black background with slowly drifting fine silver dust particles, premium luxury event, subtle motion, high end',
    negativePrompt: 'colorful, bright, text, people',
    colors: ['#484848', '#282828', '#606068'], hue: 240,
  },
  {
    id: 'smoke-lights', name: 'Smoke & Lights', category: 'Celebration', tier: 'pro',
    prompt: 'atmospheric stage smoke with colored spotlights cutting through haze, dramatic blue and white light beams, concert production atmosphere',
    negativePrompt: 'text, people, watermark',
    colors: ['#204080', '#102040', '#4080c0'], hue: 215,
  },
  {
    id: 'fireworks', name: 'Fireworks', category: 'Celebration', tier: 'pro',
    prompt: 'fireworks bursting in night sky, colorful explosions, slow motion sparks trailing and fading, celebration, dark sky background',
    negativePrompt: 'text, daytime, people',
    colors: ['#200030', '#100020', '#6020a0'], hue: 270,
  },

  // ── CORPORATE ────────────────────────────────────────────────────────────
  {
    id: 'clean-minimal', name: 'Clean Minimal', category: 'Corporate', tier: 'free',
    prompt: 'clean white and light grey soft gradients slowly shifting, minimal professional atmosphere, subtle light movement, corporate elegance',
    negativePrompt: 'colorful, chaotic, text, people',
    colors: ['#e0e4f0', '#c0c8d8', '#f0f2f8'], hue: 225,
  },
  {
    id: 'abstract-blue', name: 'Abstract Blue', category: 'Corporate', tier: 'free',
    prompt: 'smooth abstract deep blue gradient fluid shapes morphing slowly, professional corporate background, clean modern design, flowing',
    negativePrompt: 'text, logo, watermark, people',
    colors: ['#003888', '#002060', '#0050b0'], hue: 220,
  },
  {
    id: 'tech-grid', name: 'Tech Grid', category: 'Corporate', tier: 'pro',
    prompt: 'glowing technology circuit board lines on dark background, subtle blue pulse, innovation and data visualization aesthetic, professional',
    negativePrompt: 'text, watermark, people',
    colors: ['#003848', '#002030', '#005870'], hue: 200,
  },
  {
    id: 'data-flow', name: 'Data Flow', category: 'Corporate', tier: 'pro',
    prompt: 'flowing abstract data streams, soft network nodes connecting with light trails, dark professional background, innovation theme',
    negativePrompt: 'text, numbers, code, people',
    colors: ['#002040', '#001028', '#0040a0'], hue: 210,
  },
  {
    id: 'brand-neutral', name: 'Brand Neutral', category: 'Corporate', tier: 'pro',
    prompt: 'soft neutral grey gradient background, warm tones slowly shifting, versatile corporate background, subtle depth and dimension',
    negativePrompt: 'text, logo, colorful, people',
    colors: ['#484848', '#383838', '#585860'], hue: 0,
  },
  {
    id: 'executive-dark', name: 'Executive Dark', category: 'Corporate', tier: 'pro',
    prompt: 'deep dark charcoal background with subtle silver gradient movement, premium executive atmosphere, ultra professional, refined motion',
    negativePrompt: 'text, colorful, cheap, people',
    colors: ['#1a1a2a', '#141420', '#28283a'], hue: 230,
  },

  // ── NATURE ───────────────────────────────────────────────────────────────
  {
    id: 'aurora', name: 'Aurora', category: 'Nature', tier: 'free',
    prompt: 'northern lights aurora borealis, green and purple curtains dancing across dark night sky, magical slow movement, ethereal',
    negativePrompt: 'daytime, text, people',
    colors: ['#006050', '#004040', '#00a080'], hue: 160,
  },
  {
    id: 'forest', name: 'Forest', category: 'Nature', tier: 'free',
    prompt: 'sunlight filtering through forest canopy leaves, green and gold dappled light, peaceful nature scene, gentle breeze, cinematic',
    negativePrompt: 'dark, scary, text, people',
    colors: ['#385800', '#203800', '#508020'], hue: 100,
  },
  {
    id: 'deep-ocean', name: 'Deep Ocean', category: 'Nature', tier: 'pro',
    prompt: 'deep underwater ocean, soft blue bioluminescent particles drifting, calm underwater world, light rays filtering from above, ethereal',
    negativePrompt: 'text, scary creatures, people',
    colors: ['#001850', '#001038', '#0030a0'], hue: 220,
  },
  {
    id: 'snowfall', name: 'Snowfall', category: 'Nature', tier: 'pro',
    prompt: 'gentle snowflakes falling softly in slow motion, white and pale blue, peaceful winter scene, soft bokeh background, serene',
    negativePrompt: 'blizzard, storm, text, people',
    colors: ['#e8f0f8', '#d8e8f8', '#c0d8f0'], hue: 210,
  },
  {
    id: 'desert', name: 'Desert Dunes', category: 'Nature', tier: 'pro',
    prompt: 'golden sand dunes at sunset, warm amber and orange tones, soft wind rippling sand surface, vast peaceful landscape, cinematic',
    negativePrompt: 'text, people, buildings',
    colors: ['#c07020', '#904800', '#e09040'], hue: 30,
  },
  {
    id: 'storm', name: 'Storm', category: 'Nature', tier: 'pro',
    prompt: 'dramatic storm clouds rolling and building, deep grey and blue, electric energy in sky, cinematic and powerful, moody atmosphere',
    negativePrompt: 'text, bright sunshine, people',
    colors: ['#202838', '#182030', '#303848'], hue: 215,
  },

  // ── SEASONAL ─────────────────────────────────────────────────────────────
  {
    id: 'christmas', name: 'Christmas', category: 'Seasonal', tier: 'free',
    prompt: 'warm Christmas atmosphere, soft red and gold bokeh lights out of focus, gentle snowflakes, festive holiday warmth, cozy',
    negativePrompt: 'text, logo, halloween, people',
    colors: ['#c04020', '#900010', '#e06040'], hue: 5,
  },
  {
    id: 'easter', name: 'Easter', category: 'Seasonal', tier: 'free',
    prompt: 'soft spring pastel colors, gentle morning light rays, fresh flowers blooming, resurrection morning, hopeful and bright, gentle motion',
    negativePrompt: 'dark, text, halloween, people',
    colors: ['#c8e8b0', '#b0d880', '#e8f8d0'], hue: 100,
  },
  {
    id: 'new-year', name: 'New Year', category: 'Seasonal', tier: 'pro',
    prompt: 'midnight countdown celebration, gold and silver fireworks, champagne bubbles floating upward, festive sparkling lights, new year',
    negativePrompt: 'text, numbers, christmas, people',
    colors: ['#302040', '#201030', '#504060'], hue: 270,
  },
  {
    id: 'halloween', name: 'Halloween', category: 'Seasonal', tier: 'pro',
    prompt: 'elegant dark Halloween atmosphere, deep orange and black, swirling misty fog, eerie dark magic particle effects floating',
    negativePrompt: 'bright, cheerful, christmas, text, people',
    colors: ['#602000', '#401000', '#804020'], hue: 20,
  },
  {
    id: 'summer', name: 'Summer', category: 'Seasonal', tier: 'pro',
    prompt: 'bright sunny summer day, warm golden light haze, soft lens flare, vacation energy, bright sky bokeh, warmth and joy',
    negativePrompt: 'dark, cold, text, people',
    colors: ['#f8b040', '#e08020', '#ffd070'], hue: 40,
  },
  {
    id: 'harvest', name: 'Harvest', category: 'Seasonal', tier: 'pro',
    prompt: 'autumn harvest colors, deep amber orange and brown tones, falling leaves in slow motion, warm thanksgiving atmosphere, cozy rich',
    negativePrompt: 'summer, bright, cold, text, people',
    colors: ['#c06010', '#904000', '#e08030'], hue: 25,
  },

  // ── CONCERT ──────────────────────────────────────────────────────────────
  {
    id: 'stage-haze', name: 'Stage Haze', category: 'Concert', tier: 'free',
    prompt: 'atmospheric stage haze smoke, warm spotlight beam cutting through fog, concert venue atmosphere, dramatic theatrical side lighting',
    negativePrompt: 'text, daylight, people',
    colors: ['#482020', '#301010', '#603030'], hue: 5,
  },
  {
    id: 'spotlight', name: 'Spotlight', category: 'Concert', tier: 'free',
    prompt: 'single bright spotlight beam from above on dark stage, dramatic theatrical atmosphere, performer ready, focused energy, dark void',
    negativePrompt: 'text, colorful distracting, people',
    colors: ['#302820', '#201c10', '#483c28'], hue: 40,
  },
  {
    id: 'bass-drop', name: 'Bass Drop', category: 'Concert', tier: 'pro',
    prompt: 'deep bass energy visualization, dark background with pulsing deep purple and blue pressure waves, electronic music impact, subwoofer',
    negativePrompt: 'text, bright colors, people',
    colors: ['#200040', '#180028', '#400080'], hue: 270,
  },
  {
    id: 'festival', name: 'Festival', category: 'Concert', tier: 'pro',
    prompt: 'outdoor music festival stage at night, colorful light show, laser beams sweeping sky, epic live music atmosphere, crowd energy',
    negativePrompt: 'text, daytime, boring, people faces',
    colors: ['#200848', '#100030', '#401060'], hue: 280,
  },
  {
    id: 'laser-show', name: 'Laser Show', category: 'Concert', tier: 'pro',
    prompt: 'laser light show beams cutting through smoke, geometric laser patterns, abstract light art, concert production, precise beams',
    negativePrompt: 'text, natural, people',
    colors: ['#002030', '#001020', '#004060'], hue: 195,
  },
  {
    id: 'crowd-energy', name: 'Crowd Energy', category: 'Concert', tier: 'pro',
    prompt: 'abstract flowing light waves representing collective human energy, warm orange and amber flows, music and movement, euphoric atmosphere',
    negativePrompt: 'text, dark depressing, people faces',
    colors: ['#782820', '#501010', '#a04030'], hue: 10,
  },
]

export const PRESET_CATEGORIES = ['Worship', 'Celebration', 'Corporate', 'Nature', 'Seasonal', 'Concert'] as const

export const FREE_PRESET_IDS = PRESETS.filter(p => p.tier === 'free').map(p => p.id)

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id)
}

export function getPresetsByCategory(category: string): Preset[] {
  return PRESETS.filter(p => p.category === category)
}

export const DEFAULT_PRESET = PRESETS[0] // Heavenly
