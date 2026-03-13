/**
 * /api/stream — Server-side Daydream stream management
 * POST   → create stream, returns { streamId, whipUrl, playbackId }
 * PATCH  → update params on existing stream (prompt, guidance, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'

const DAYDREAM_API = 'https://api.daydream.live/v1'

function getKey() {
  const key = process.env.DAYDREAM_API_KEY
  if (!key) throw new Error('DAYDREAM_API_KEY not set in .env.local')
  return key
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
          model_id: modelId || 'stabilityai/sdxl-turbo',
          prompt: prompt || 'beautiful abstract light rays, ethereal golden atmosphere',
          negative_prompt: 'people, faces, text, logos, watermark, ugly, blurry',
          guidance_scale: guidanceScale ?? 1.2,
          num_inference_steps: numInferenceSteps ?? 2,
          width: 704,
          height: 704,
          acceleration: 'tensorrt',
          use_denoising_batch: true,
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Daydream create stream error:', data)
      return NextResponse.json({ error: data.message || 'Failed to create stream' }, { status: res.status })
    }

    return NextResponse.json({
      streamId: data.id,
      whipUrl: data.whip_url,
      playbackId: data.output_playback_id,
      outputStreamUrl: data.output_stream_url,
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
    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Failed to update stream' }, { status: res.status })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
