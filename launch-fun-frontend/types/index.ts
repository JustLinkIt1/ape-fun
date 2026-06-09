// Core types for ApeStation

export interface Token {
  address: string
  mint: string  // Solana token mint address
  name: string
  symbol: string
  description?: string
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  holders: number
  imageUrl: string
  bondingCurveProgress?: number
  salesTax: number
  // Social metadata
  twitter?: string    // handle without @
  telegram?: string   // t.me slug
  website?: string
  // Launch metadata
  creator: string
  requestorWallet?: string   // agent or referrer that initiated the launch
  requestorTag?: string      // human-readable label, e.g. "aixbt_agent"
  launchSource?: 'web' | 'api' | 'agent'
  // ApeStation mechanics
  commitmentTier?: CommitmentTier
  socialMultiplier?: number  // 1.0 = no boost
  graduated?: boolean
}

// ---------------------------------------------------------------------------
// Agent Republic / Ape Score
// ---------------------------------------------------------------------------

export type ProfileTier = 'shrimp' | 'ape' | 'gorilla' | 'kong' | 'diamond_kong'

export interface ApeBadge {
  id: string
  label: string           // e.g. "OG Buyer", "Diamond Dev", "Season 1 Top 10"
  earnedAt: string
  tokenMint?: string      // badge tied to a specific token, if any
}

export interface ApeProfile {
  wallet: string
  apeName?: string
  apeScore: number
  tier: ProfileTier
  badges: ApeBadge[]
  tokensLaunched: string[]   // mints
  tokensGraduated: number
  followers: string[]        // wallets following this profile
  following: string[]
  isAgent: boolean
  agentTag?: string
  twitterHandle?: string
  twitterVerified: boolean
  seasonRank?: number
  totalFeesEarned: number    // lamports
  createdAt: string
}

export type ScoreEventType =
  | 'token_launched'
  | 'token_graduated'
  | 'early_buyer_graduated'   // top-100 holder on a token that graduated
  | 'milestone_vote_correct'
  | 'agent_referral'
  | 'diamond_hold_week'       // held a graduated token 30+ days, weekly tick

export interface ScoreEvent {
  wallet: string
  type: ScoreEventType
  points: number
  tokenMint?: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Commit-or-Burn
// ---------------------------------------------------------------------------

export type CommitmentTier = 'degen' | 'builder' | 'diamond'

export interface Milestone {
  index: number              // 0..2
  description: string
  dueDate: string            // ISO date
  commitmentHash: string     // sha256 of description, stored on-chain
  status: 'pending' | 'voting' | 'passed' | 'failed'
  votesYes: number
  votesNo: number
}

export interface Commitment {
  tokenMint: string
  tier: CommitmentTier
  lockedAmount: number       // dev tokens locked
  lockEndsAt: string
  vaultAddress?: string      // PDA holding locked tokens
  milestones: Milestone[]    // Diamond only — exactly 3
}

// ---------------------------------------------------------------------------
// Social Bonding Curves
// ---------------------------------------------------------------------------

export interface SocialMetrics {
  tokenMint: string
  twitterFollowers: number
  twitterFollowersGained24h: number
  twitterEngagementRate: number  // 0..1
  telegramMembers: number
  fetchedAt: string
}

// ---------------------------------------------------------------------------
// Intelligence Feed
// ---------------------------------------------------------------------------

export interface TokenIntelligence {
  tokenMint: string
  narrativeScore: number     // 0-100
  socialScore: number        // 0-100
  devCredibility: number     // 0-100
  rugRisk: number            // 0-100 (higher = riskier)
  summary: string            // 2-sentence AI take
  compositeScore: number     // weighted blend used for feed ranking
  analyzedAt: string
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

export interface Season {
  number: number
  startsAt: string
  endsAt: string
  treasuryLamports: number
  topAgents: { wallet: string; agentTag?: string; score: number }[]
}

// ---------------------------------------------------------------------------
// Agent Launch API
// ---------------------------------------------------------------------------

export interface AgentLaunchRequest {
  name: string
  symbol: string
  description: string
  imageUrl: string
  twitter?: string
  telegram?: string
  website?: string
  initialBuyLamports?: number
  totalSupply?: number
  creatorWallet: string
  requestorTag?: string
  commitmentTier?: CommitmentTier
  webhookUrl?: string
}

export interface AgentLaunchResponse {
  mint: string
  txSignature: string
  bondingCurveAddress: string
  feeVaultAddress: string
  creatorShare: number
  requestorShare: number
  explorerUrl: string
}

// ---------------------------------------------------------------------------
// Existing app types
// ---------------------------------------------------------------------------

export interface User {
  wallet: string
  username?: string
  avatar?: string
}

export interface Comment {
  id: string
  tokenAddress: string
  userId: string
  user: User
  content: string
  timestamp: Date
  likes: number
  replies?: Comment[]
  parentId?: string
}

export interface Transaction {
  signature: string
  tokenAddress: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

export interface ChartData {
  time: number
  value: number
}

export interface TokenDetails extends Token {
  createdAt: Date
  totalSupply: number
  chartData: ChartData[]
  recentTransactions: Transaction[]
}

export interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  totalPages: number
  totalItems: number
}
