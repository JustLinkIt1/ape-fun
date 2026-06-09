import { NextRequest, NextResponse } from 'next/server'
import { getServerTokens } from '@/lib/serverTokenRegistry'

export async function GET(request: NextRequest) {
  try {
    const tokens = getServerTokens()
    const list = Object.values(tokens).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return NextResponse.json({ success: true, tokens: list })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tokens' }, { status: 500 })
  }
}
