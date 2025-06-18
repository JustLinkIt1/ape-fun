// Token interface as specified in the implementation plan
export interface Token {
  address: string
  mint: string  // Added mint field for Solana token mint address
  name: string
  symbol: string
  liquidityAccount?: string
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  holders: number
  imageUrl: string
  bondingCurveProgress?: number
}

// Additional types for the application
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
  description?: string
  creator: string
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