import { NextRequest, NextResponse } from 'next/server'

const DAYDREAM_API = 'https://api.daydream.live/v1'

function getKey() {
  const key = process.env.DAYDREAM_API_KEY
  if (!key) throw new Error('DAYDREAM_API_KEY not set in .env.local')
  return key
}

// Resolve the WHIP redirect server-side so the browser gets the final URL
// Browser SDK can't follow cross-origin redirects on WHIP URLs
async function resolveWhipUrl(whipUrl: string): Promise<string> {
  // Force https on input — raw URL is http:// which causes Mixed Content on Vercel
  const httpsUrl = whipUrl.replace(/^http:\/\//, 'https://')
  try {
    // manual redirect so we can capture the Location header
    const res = await fetch(httpsUrl, { method: 'HEAD', redirect: 'manual' })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (loc) {
        const resolved = loc.replace(/^http:\/\//, 'https://')
        console.log('[Stream API] WHIP resolved:', resolved)
        return resolved
      }
    }
    return httpsUrl
  } catch (err) {
    console.error('[Stream API] WHIP resolve failed:', err)
    return httpsUrl
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, modelId, guidanceScale, numInferenceSteps } = await req.json()

    const res = await fetch(`${DAYDREAM_API}/streams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getKey()}`,
      },
      body: JSON.stringify({
        pipeline: 'streamdiffusion',
        params: {
          model_id: modelId || 'stabilityai/sd-turbo',
          prompt: prompt || 'beautiful abstract light rays, ethereal golden atmosphere',
          negative_prompt: 'people, faces, text, logos, watermark, ugly, blurry',
          guidance_scale: 1,
          // T2V mode: skip_diffusion=false means generate purely from prompt
          // skip_diffusion=true would be V2V (transforms input video)
          skip_diffusion: false,
          // t_index_list controls denoising strength — [0] = full T2V generation
          t_index_list: [0],
          num_inference_steps: 1,
          width: 512,
          height: 512,
          use_denoising_batch: true,
          do_add_noise: true,
          seed: Math.floor(Math.random() * 999999),
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Daydream create error:', data)
      return NextResponse.json({ error: data.message || 'Failed to create stream' }, { status: res.status })
    }

    const rawWhipUrl = data.whip_url
    console.log('[Stream API] Raw WHIP:', rawWhipUrl)

    // Resolve redirect server-side — browser can't follow cross-origin WHIP redirects
    const resolvedWhipUrl = await resolveWhipUrl(rawWhipUrl)
    console.log('[Stream API] Resolved WHIP:', resolvedWhipUrl)

    return NextResponse.json({
      streamId: data.id,
      whipUrl: resolvedWhipUrl,      // resolved, no redirect
      rawWhipUrl,                     // original, for debugging
      playbackId: data.output_playback_id,
    })
  } catch (err: any) {
    console.error('Stream create error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { streamId, prompt, guidanceScale, numInferenceSteps, modelId } = await req.json()
    if (!streamId) return NextResponse.json({ error: 'streamId required' }, { status: 400 })

    const params: Record<string, any> = {}
    if (prompt !== undefined) params.prompt = prompt
    if (guidanceScale !== undefined) params.guidance_scale = guidanceScale
    if (numInferenceSteps !== undefined) params.num_inference_steps = numInferenceSteps
    if (modelId !== undefined) params.model_id = modelId

    const res = await fetch(`${DAYDREAM_API}/streams/${streamId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getKey()}`,
      },
      body: JSON.stringify({ pipeline: 'streamdiffusion', params }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed to update' }, { status: res.status })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const streamId = searchParams.get('id')
    if (!streamId) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const res = await fetch(`${DAYDREAM_API}/streams/${streamId}/status`, {
      headers: { 'Authorization': `Bearer ${getKey()}` },
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: 'Status fetch failed' }, { status: res.status })

    const outputFps = data.data?.inference_status?.output_fps ?? 0
    const whepUrl = data.data?.gateway_status?.whep_url ?? null
    return NextResponse.json({ outputFps, whepUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}