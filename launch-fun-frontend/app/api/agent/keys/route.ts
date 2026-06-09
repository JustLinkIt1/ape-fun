// POST /api/agent/keys — generate an agent API key tied to a wallet's ApeProfile.
// DELETE /api/agent/keys?id=... — revoke a key.
// TODO(phase 5.4): require a signed message from the wallet to prove ownership
// before issuing keys.

import { NextRequest, NextResponse } from 'next/server'
import { generateAgentKey, revokeAgentKey } from '@/lib/agentKeys'
import { getOrCreateProfile, saveProfile } from '@/lib/profileRegistry'

export async function POST(request: NextRequest) {
  try {
    const { wallet, agentTag } = await request.json()
    if (!wallet || !agentTag) {
      return NextResponse.json({ error: 'wallet and agentTag are required' }, { status: 400 })
    }

    const profile = getOrCreateProfile(wallet)
    profile.isAgent = true
    profile.agentTag = agentTag
    saveProfile(profile)

    const { id, rawKey } = generateAgentKey(wallet, agentTag)

    // rawKey is shown exactly once — only the hash is stored
    return NextResponse.json({ id, key: rawKey }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Key generation failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  }
  const revoked = revokeAgentKey(id)
  if (!revoked) {
    return NextResponse.json({ error: 'Key not found or already revoked' }, { status: 404 })
  }
  return NextResponse.json({ revoked: true })
}
