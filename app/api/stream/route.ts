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
  try {
    const res = await fetch(whipUrl, {
      method: 'OPTIONS',
      redirect: 'follow',
    })
    // After redirect, we get the final URL
    return res.url || whipUrl
  } catch {
    // If OPTIONS fails, try HEAD
    try {
      const res = await fetch(whipUrl, { method: 'HEAD', redirect: 'follow' })
      return res.url || whipUrl
    } catch {
      return whipUrl
    }
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
          guidance_scale: guidanceScale ?? 1.2,
          num_inference_steps: numInferenceSteps ?? 2,
          width: 512,
          height: 512,
          use_denoising_batch: true,
          do_add_noise: true,
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