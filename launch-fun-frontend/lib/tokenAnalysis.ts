// Intelligence Feed — Claude Opus 4.8 scores every token for the curated feed.
// Server-side only (requires ANTHROPIC_API_KEY).

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { ApeProfile, SocialMetrics, Token, TokenIntelligence } from '@/types'

const ANALYSIS_FILE = path.join(process.cwd(), 'token-analysis.json')

const ANALYSIS_SCHEMA = {
  type: 'object' as const,
  properties: {
    narrativeScore: { type: 'integer' as const, description: 'How compelling is the story? 0-100' },
    socialScore: { type: 'integer' as const, description: 'Is the community real and growing? 0-100' },
    devCredibility: { type: 'integer' as const, description: 'Creator track record quality, 0-100' },
    rugRisk: { type: 'integer' as const, description: 'Likelihood of a rug, 0-100 (higher = riskier)' },
    summary: { type: 'string' as const, description: 'Two-sentence take for degens' },
  },
  required: ['narrativeScore', 'socialScore', 'devCredibility', 'rugRisk', 'summary'],
  additionalProperties: false as const,
}

// Feed-ranking blend: reward narrative+social+credibility, penalize rug risk
export function compositeScore(a: Omit<TokenIntelligence, 'compositeScore' | 'tokenMint' | 'analyzedAt'>): number {
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
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: ANALYSIS_SCHEMA },
    },
    system:
      'You are the ApeStation token analyst. Score new memecoin launches for a curated feed. ' +
      'Be skeptical: most launches are low-effort. High scores are rare and must be earned by ' +
      'real social traction, a creator with a track record, or a genuinely strong narrative. ' +
      'A null creator profile or zero social metrics should push rugRisk up and other scores down.',
    messages: [
      {
        role: 'user',
        content: `Analyze this token launch:\n${JSON.stringify(context, null, 2)}`,
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('No analysis returned')
  const scores = JSON.parse(text.text)

  const intelligence: TokenIntelligence = {
    tokenMint: token.mint,
    ...scores,
    compositeScore: compositeScore(scores),
    analyzedAt: new Date().toISOString(),
  }

  saveAnalysis(intelligence)
  return intelligence
}

// Launch tweet generation — short, punchy, written from token metadata
export async function generateLaunchTweet(token: Token): Promise<string> {
  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    system:
      'Write a single launch tweet for a new memecoin on ApeStation. Under 200 characters. ' +
      'Punchy degen energy, no hashtag spam (max 2), include the ticker with $. ' +
      'Reply with the tweet text only.',
    messages: [
      {
        role: 'user',
        content: `Token: ${token.name} ($${token.symbol})\nDescription: ${token.description ?? 'n/a'}`,
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')
  return text && text.type === 'text' ? text.text.trim() : ''
}

// --- file-backed analysis cache -------------------------------------------

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
  fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(all, null, 2), 'utf8')
}
