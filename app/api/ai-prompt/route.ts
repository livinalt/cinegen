import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { presetName, presetCategory } = await req.json()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ prompts: getFallbacks(presetCategory) })
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate 4 short AI video generation prompts for a live event visual background in the "${presetName}" style (${presetCategory} category).

Rules:
- Each prompt 12-20 words
- No people, no faces, no text, no logos
- Describe motion, light, atmosphere, colour
- Types: Soft, Dramatic, Abstract, Cinematic

Return ONLY valid JSON, no markdown:
{"prompts":[{"label":"Soft","text":"..."},{"label":"Dramatic","text":"..."},{"label":"Abstract","text":"..."},{"label":"Cinematic","text":"..."}]}`
            }]
          }]
        })
      }
    )

    const data = await res.json()
    console.log('Gemini full data:', JSON.stringify(data))
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('Gemini text:', JSON.stringify(text))
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ prompts: parsed.prompts })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ prompts: getFallbacks(presetCategory) })
  }
}

function getFallbacks(category: string) {
  const defaults: Record<string, any[]> = {
    worship: [
      { label: 'Soft',      text: 'Soft golden light rays streaming through luminous clouds, gentle sacred radiance' },
      { label: 'Dramatic',  text: 'Dramatic celestial beams piercing storm clouds, deep shadows, powerful heavenly light' },
      { label: 'Abstract',  text: 'Abstract flowing light particles ascending, shimmering golden mist, ethereal energy' },
      { label: 'Cinematic', text: 'Wide cinematic dawn horizon, warm golden gradients, soft lens flare, majestic sky' },
    ],
    celebration: [
      { label: 'Soft',      text: 'Soft bokeh lights floating gently, warm gold and champagne tones, festive atmosphere' },
      { label: 'Dramatic',  text: 'Dramatic confetti explosion, vibrant colours bursting outward, high energy celebration' },
      { label: 'Abstract',  text: 'Abstract neon light trails spiralling, electric colour pulses, dynamic motion blur' },
      { label: 'Cinematic', text: 'Cinematic smoke and spotlights, deep stage blacks, warm golden beams cutting through' },
    ],
    nature: [
      { label: 'Soft',      text: 'Soft aurora borealis rippling slowly, deep teal and violet sky, peaceful motion' },
      { label: 'Dramatic',  text: 'Dramatic storm clouds rolling across mountains, electric lightning, dark moody atmosphere' },
      { label: 'Abstract',  text: 'Abstract flowing water reflections, deep ocean currents, shifting blue-green light' },
      { label: 'Cinematic', text: 'Cinematic forest canopy sunrise, golden rays through leaves, misty woodland depth' },
    ],
    concert: [
      { label: 'Soft',      text: 'Soft stage haze drifting, warm amber spotlights, gentle smoke diffusion, intimate feel' },
      { label: 'Dramatic',  text: 'Dramatic laser beams cutting through thick smoke, deep bass drop energy, high contrast' },
      { label: 'Abstract',  text: 'Abstract geometric light patterns pulsing, neon grid dissolving, electric visual energy' },
      { label: 'Cinematic', text: 'Cinematic crowd silhouettes under massive stage lights, epic scale, deep atmosphere' },
    ],
    corporate: [
      { label: 'Soft',      text: 'Soft blue gradient light waves, clean minimal atmosphere, professional calm motion' },
      { label: 'Dramatic',  text: 'Dramatic dark background with sharp light beams, bold contrast, powerful corporate energy' },
      { label: 'Abstract',  text: 'Abstract flowing data particles, tech grid dissolving, deep blue shifting light' },
      { label: 'Cinematic', text: 'Cinematic wide aerial city lights at night, deep blues, professional scale and depth' },
    ],
    seasonal: [
      { label: 'Soft',      text: 'Soft falling snowflakes, warm candlelight glow, gentle winter bokeh, peaceful season' },
      { label: 'Dramatic',  text: 'Dramatic fireworks bursting across dark sky, vivid colour explosions, celebratory energy' },
      { label: 'Abstract',  text: 'Abstract autumn leaves swirling in golden light, warm harvest colours, seasonal motion' },
      { label: 'Cinematic', text: 'Cinematic Christmas tree lights bokeh, warm amber and red tones, festive wide shot' },
    ],
  }
  return defaults[category?.toLowerCase()] ?? defaults.worship
}