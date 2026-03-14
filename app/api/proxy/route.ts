/**
 * /api/proxy — CORS proxy for Daydream WHIP/WHEP endpoints
 * 
 * The browser can't directly call Livepeer's WHIP/WHEP URLs due to CORS.
 * This proxy forwards requests server-side where CORS doesn't apply.
 * 
 * Usage: POST /api/proxy?url=https://livepeer.com/live/...
 */

import { NextRequest, NextResponse } from 'next/server'

async function proxyRequest(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('url')
  
  if (!target) {
    return NextResponse.json({ error: 'url param required' }, { status: 400 })
  }

  // Only allow Livepeer/Daydream domains
  const allowed = [
    'livepeer.com',
    'livepeer.ai', 
    'daydream.live',
    'livepeer.studio',
  ]
  const isAllowed = allowed.some(d => target.includes(d))
  if (!isAllowed) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  try {
    const headers: Record<string, string> = {}
    
    // Forward relevant headers
    const contentType = req.headers.get('content-type')
    if (contentType) headers['content-type'] = contentType
    
    const body = req.method !== 'GET' && req.method !== 'HEAD' 
      ? await req.text() 
      : undefined

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: 'follow',
    })

    const responseBody = await upstream.arrayBuffer()
    
    const responseHeaders = new Headers()
    // Forward upstream headers
    upstream.headers.forEach((val, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, val)
      }
    })
    // Add CORS headers so browser accepts this response
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', '*')
    responseHeaders.set('Access-Control-Expose-Headers', '*')

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (err: any) {
    console.error('[Proxy] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) { return proxyRequest(req) }
export async function POST(req: NextRequest) { return proxyRequest(req) }
export async function PATCH(req: NextRequest) { return proxyRequest(req) }
export async function DELETE(req: NextRequest) { return proxyRequest(req) }
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
}