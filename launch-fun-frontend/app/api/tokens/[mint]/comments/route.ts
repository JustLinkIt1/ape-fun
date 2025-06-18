import { NextRequest, NextResponse } from 'next/server'

// simple in-memory comments storage
const globalAny: any = globalThis as any
if (!globalAny.__COMMENTS__) {
  globalAny.__COMMENTS__ = {}
}
const commentsStore: Record<string, any[]> = globalAny.__COMMENTS__

export async function GET(request: NextRequest, context: any) {
  const { params } = context as { params: { mint: string } }
  const comments = commentsStore[params.mint] || []
  return NextResponse.json({ success: true, comments })
}

export async function POST(request: NextRequest, context: any) {
  const { params } = context as { params: { mint: string } }
  try {
    const body = await request.json()
    const { author, text } = body
    if (!author || !text) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (!commentsStore[params.mint]) commentsStore[params.mint] = []
    commentsStore[params.mint].push({ author, text, createdAt: new Date().toISOString() })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Comments error:', error)
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}
