import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
}

// Allowed upstream domains
const ALLOWED = ['livepeer.com', 'livepeer.ai', 'daydream.live']

function getAllowedTarget(req: NextRequest): string | null {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('url')
  if (!target) return null
  if (!ALLOWED.some(d => target.includes(d))) return null
  // Force https
  return target.replace(/^http:\/\//, 'https://')
}

async function proxy(req: NextRequest): Promise<NextResponse> {
  const target = getAllowedTarget(req)
  if (!target) {
    return NextResponse.json({ error: 'Missing or disallowed url param' }, {
      status: 400, headers: CORS_HEADERS
    })
  }

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS'
      ? await req.text()
      : undefined

    const headers: Record<string, string> = {}
    const ct = req.headers.get('content-type')
    if (ct) headers['content-type'] = ct

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: 'follow',
    })

    const responseBody = upstream.status === 204 || upstream.status === 404
      ? null
      : await upstream.arrayBuffer()

    const responseHeaders = new Headers(CORS_HEADERS)

    // Forward key upstream headers the SDK needs
    const forward = ['location', 'link', 'etag', 'content-type', 'livepeer-playback-url']
    forward.forEach(h => {
      const v = upstream.headers.get(h)
      if (v) responseHeaders.set(h, v)
    })

    console.log(`[WHIP Proxy] ${req.method} ${target} → ${upstream.status}`)

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (err: any) {
    console.error('[WHIP Proxy] Error:', err.message)
    return NextResponse.json({ error: err.message }, {
      status: 500, headers: CORS_HEADERS
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
export async function GET(req: NextRequest) { return proxy(req) }
export async function POST(req: NextRequest) { return proxy(req) }
export async function DELETE(req: NextRequest) { return proxy(req) }
export async function PATCH(req: NextRequest) { return proxy(req) }