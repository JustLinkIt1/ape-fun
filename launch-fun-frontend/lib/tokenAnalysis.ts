// Intelligence Feed — uses Claude to score every token for the curated feed.
// Server-side only (requires ANTHROPIC_API_KEY).

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { ApeProfile, SocialMetrics, Token, TokenIntelligence } from '@/types'

const ANALYSIS_FILE = path.join(process.cwd(), 'token-analysis.json')

export function compositeScore(a: Pick<TokenIntelligence, 'narrativeScore' | 'socialScore' | 'devCredibility' | 'rugRisk'>): number {
  return Math.round(
    a.narrativeScore * 0.3 +
    a.socialScore * 0.3 +
    a.devCredibility * 0.2 +
    (100 - a.rugRisk) * 0.2
  )
}

export async function analyzeToken(
  token: Token,
  creatorProfile: ApeProfile | null,
  social: SocialMetrics | null
): Promise<TokenIntelligence> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Return a mock analysis when no API key is configured
    const mock = {
      narrativeScore: 50,
      socialScore: social ? 60 : 30,
      devCredibility: creatorProfile ? Math.min(100, creatorProfile.apeScore / 10) : 25,
      rugRisk: 55,
      summary: 'No API key configured — this is a placeholder analysis. Add ANTHROPIC_API_KEY to enable AI scoring.',
    }
    const intelligence: TokenIntelligence = {
      tokenMint: token.mint,
      ...mock,
      compositeScore: compositeScore(mock),
      analyzedAt: new Date().toISOString(),
    }
    saveAnalysis(intelligence)
    return intelligence
  }

  const client = new Anthropic()

  const context = {
    token: {
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      twitter: token.twitter,
      telegram: token.telegram,
      website: token.website,
      commitmentTier: token.commitmentTier ?? 'degen',
      launchSource: token.launchSource ?? 'web',
      marketCap: token.marketCap,
      holders: token.holders,
      bondingCurveProgress: token.bondingCurveProgress,
    },
    creator: creatorProfile
      ? {
          apeScore: creatorProfile.apeScore,
          tier: creatorProfile.tier,
          tokensLaunched: creatorProfile.tokensLaunched.length,
          tokensGraduated: creatorProfile.tokensGraduated,
          twitterVerified: creatorProfile.twitterVerified,
          isAgent: creatorProfile.isAgent,
        }
      : null,
    social,
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    system:
      'You are the ApeStation token analyst. Score new memecoin launches for a curated feed. ' +
      'Be skeptical — most launches are low-effort. High scores are rare and must be earned by ' +
      'real social traction, a creator with a track record, or a genuinely strong narrative. ' +
      'A null creator or zero social metrics should push rugRisk up and other scores down. ' +
      'Respond ONLY with a JSON object, no prose, no code fences.',
    messages: [
      {
        role: 'user',
        content:
          `Analyze this token and return exactly this JSON structure:\n` +
          `{"narrativeScore": 0-100, "socialScore": 0-100, "devCredibility": 0-100, "rugRisk": 0-100, "summary": "two sentences"}\n\n` +
          `Token data:\n${JSON.stringify(context, null, 2)}`,
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('No analysis returned')

  // Strip markdown fences if model adds them
  const cleaned = text.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const scores = JSON.parse(cleaned)

  const intelligence: TokenIntelligence = {
    tokenMint: token.mint,
    narrativeScore: Math.max(0, Math.min(100, scores.narrativeScore)),
    socialScore: Math.max(0, Math.min(100, scores.socialScore)),
    devCredibility: Math.max(0, Math.min(100, scores.devCredibility)),
    rugRisk: Math.max(0, Math.min(100, scores.rugRisk)),
    summary: scores.summary,
    compositeScore: compositeScore(scores),
    analyzedAt: new Date().toISOString(),
  }

  saveAnalysis(intelligence)
  return intelligence
}

export async function generateLaunchTweet(token: Token): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return `🚀 ${token.name} ($${token.symbol}) just launched on ApeStation!`

  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: 'Write a single launch tweet for a new memecoin on ApeStation. Under 200 chars. Punchy degen energy, max 2 hashtags, include the ticker with $. Reply with the tweet text only — no quotes.',
    messages: [
      { role: 'user', content: `Token: ${token.name} ($${token.symbol})\nDescription: ${token.description ?? 'n/a'}` },
    ],
  })

  const text = response.content.find(b => b.type === 'text')
  return text && text.type === 'text' ? text.text.trim() : ''
}

// --- file-backed analysis cache ---

export function getAnalysis(mint: string): TokenIntelligence | null {
  return getAllAnalysis()[mint] || null
}

export function getAllAnalysis(): Record<string, TokenIntelligence> {
  try {
    if (!fs.existsSync(ANALYSIS_FILE)) return {}
    return JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf8') || '{}')
  } catch {
    return {}
  }
}

function saveAnalysis(analysis: TokenIntelligence) {
  const all = getAllAnalysis()
  all[analysis.tokenMint] = analysis
  try {
    fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(all, null, 2), 'utf8')
  } catch {}
}
