// Server-side trade registry using file system
// In production, this would be a database

import fs from 'fs'
import path from 'path'

export interface Trade {
  mint: string
  type: 'buy' | 'sell'
  user: string // buyer or seller public key
  amount: number // amount in SOL (for buy) or tokens (for sell)
  tokens: number // tokens bought/sold
  price: number // price per token at time of trade
  timestamp: number // unix ms
}

const TRADES_FILE = path.join(process.cwd(), 'trades.json')

function ensureTradesFile() {
  if (!fs.existsSync(TRADES_FILE)) {
    fs.writeFileSync(TRADES_FILE, '[]', 'utf8')
  }
}

export function logTrade(trade: Trade) {
  ensureTradesFile()
  try {
    const data = fs.readFileSync(TRADES_FILE, 'utf8')
    const trades = JSON.parse(data || '[]')
    trades.push(trade)
    fs.writeFileSync(TRADES_FILE, JSON.stringify(trades, null, 2), 'utf8')
    console.log(`[Trade] Logged:`, trade)
  } catch (error) {
    console.error('Error logging trade:', error)
  }
}

export function getTradesForMint(mint: string): Trade[] {
  ensureTradesFile()
  try {
    const data = fs.readFileSync(TRADES_FILE, 'utf8')
    const trades: Trade[] = JSON.parse(data || '[]')
    return trades.filter(t => t.mint === mint)
  } catch (error) {
    console.error('Error reading trades:', error)
    return []
  }
}

export function getChartDataForMint(mint: string) {
  // Returns price and supply over time for charting
  const trades = getTradesForMint(mint)
  const chartData: { time: number, price: number, supply: number }[] = []
  let supply = 0
  trades.forEach(trade => {
    if (trade.type === 'buy') {
      supply += trade.tokens
    } else {
      supply -= trade.tokens
    }
    chartData.push({
      time: trade.timestamp,
      price: trade.price,
      supply: Math.max(supply, 0)
    })
  })
  return chartData
} 