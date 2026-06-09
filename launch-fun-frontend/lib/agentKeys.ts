// Agent API key management — keys are tied to an ApeProfile so an agent's
// reputation travels with its key. File-backed; swap for KV/DB in production.

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

interface AgentKey {
  id: string
  hashedKey: string        // sha256 — raw key is shown once at creation
  wallet: string           // ApeProfile this key belongs to
  agentTag: string
  createdAt: string
  revokedAt?: string
  launchCount: number
}

const KEYS_FILE = path.join(process.cwd(), 'agent-keys.json')

// Rate limit: launches per hour per key, scaled by Ape Score tier
export const RATE_LIMITS: Record<string, number> = {
  shrimp: 2,
  ape: 5,
  gorilla: 10,
  kong: 20,
  diamond_kong: 50,
}

function readKeys(): Record<string, AgentKey> {
  try {
    if (!fs.existsSync(KEYS_FILE)) return {}
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8') || '{}')
  } catch {
    return {}
  }
}

function writeKeys(keys: Record<string, AgentKey>) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf8')
}

function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

export function generateAgentKey(wallet: string, agentTag: string): { id: string; rawKey: string } {
  const id = `ak_${crypto.randomBytes(8).toString('hex')}`
  const rawKey = `apestation_${crypto.randomBytes(24).toString('hex')}`

  const keys = readKeys()
  keys[id] = {
    id,
    hashedKey: hashKey(rawKey),
    wallet,
    agentTag,
    createdAt: new Date().toISOString(),
    launchCount: 0,
  }
  writeKeys(keys)
  return { id, rawKey }
}

export function validateAgentKey(rawKey: string): AgentKey | null {
  const hashed = hashKey(rawKey)
  const match = Object.values(readKeys()).find(
    k => k.hashedKey === hashed && !k.revokedAt
  )
  return match || null
}

export function revokeAgentKey(id: string): boolean {
  const keys = readKeys()
  if (!keys[id] || keys[id].revokedAt) return false
  keys[id].revokedAt = new Date().toISOString()
  writeKeys(keys)
  return true
}

export function recordLaunch(id: string) {
  const keys = readKeys()
  if (keys[id]) {
    keys[id].launchCount += 1
    writeKeys(keys)
  }
}
