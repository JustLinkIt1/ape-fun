// GET /api/profile/[wallet] — ApeProfile with score, tier, badges, launches.
// POST /api/profile/[wallet]/follow is handled via the follow flag in the body.

import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateProfile, getProfile, saveProfile } from '@/lib/profileRegistry'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await context.params
  const profile = getProfile(wallet)
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }
  return NextResponse.json({ profile })
}

// Follow/unfollow: body { follower: string, action: 'follow' | 'unfollow' }
// TODO(phase 1.6): verify a signed message from the follower wallet
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet: target } = await context.params
    const { follower, action } = await request.json()
    if (!follower || !['follow', 'unfollow'].includes(action)) {
      return NextResponse.json({ error: 'follower and action required' }, { status: 400 })
    }

    const targetProfile = getOrCreateProfile(target)
    const followerProfile = getOrCreateProfile(follower)

    if (action === 'follow') {
      if (!targetProfile.followers.includes(follower)) targetProfile.followers.push(follower)
      if (!followerProfile.following.includes(target)) followerProfile.following.push(target)
    } else {
      targetProfile.followers = targetProfile.followers.filter(w => w !== follower)
      followerProfile.following = followerProfile.following.filter(w => w !== target)
    }

    saveProfile(targetProfile)
    saveProfile(followerProfile)
    return NextResponse.json({ followers: targetProfile.followers.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Follow action failed' }, { status: 500 })
  }
}
