// Server-side ApeProfile registry using the file system.
// Same pattern as serverTokenRegistry — swap for a database in production.

import fs from 'fs'
import path from 'path'
import { ApeProfile, ScoreEvent } from '@/types'
import { tierForScore } from './apeScore'

const PROFILES_FILE = path.join(process.cwd(), 'profiles.json')
const SCORE_EVENTS_FILE = path.join(process.cwd(), 'score-events.json')

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf8') || 'null') ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
}

export function getProfiles(): Record<string, ApeProfile> {
  return readJson(PROFILES_FILE, {})
}

export function getProfile(wallet: string): ApeProfile | null {
  return getProfiles()[wallet] || null
}

export function getOrCreateProfile(wallet: string): ApeProfile {
  const profiles = getProfiles()
  if (profiles[wallet]) return profiles[wallet]

  const profile: ApeProfile = {
    wallet,
    apeScore: 0,
    tier: 'shrimp',
    badges: [],
    tokensLaunched: [],
    tokensGraduated: 0,
    followers: [],
    following: [],
    isAgent: false,
    twitterVerified: false,
    totalFeesEarned: 0,
    createdAt: new Date().toISOString(),
  }
  profiles[wallet] = profile
  writeJson(PROFILES_FILE, profiles)
  return profile
}

export function saveProfile(profile: ApeProfile) {
  const profiles = getProfiles()
  profiles[profile.wallet] = profile
  writeJson(PROFILES_FILE, profiles)
}

// Award score and persist both the event and the updated profile
export function awardScore(event: ScoreEvent): ApeProfile {
  const events = readJson<ScoreEvent[]>(SCORE_EVENTS_FILE, [])
  events.push(event)
  writeJson(SCORE_EVENTS_FILE, events)

  const profile = getOrCreateProfile(event.wallet)
  profile.apeScore += event.points
  profile.tier = tierForScore(profile.apeScore)
  saveProfile(profile)
  return profile
}

export function getLeaderboard(limit = 50, agentsOnly = false): ApeProfile[] {
  return Object.values(getProfiles())
    .filter(p => !agentsOnly || p.isAgent)
    .sort((a, b) => b.apeScore - a.apeScore)
    .slice(0, limit)
}
