const TAGLINES = [
  'Launch your memes. Rule the blockchain.',
  'The degen launchpad that actually works.',
  'From zero to moon — one bonding curve at a time.',
  'Social curves. AI scoring. Diamond hands.',
  'Pump fun met Clanker and had a baby.',
  'Where gorillas go to get rich.',
]

export async function generateTagline(): Promise<string> {
  // Client-safe: no server-side secrets needed for tagline
  // Rotates through taglines based on day so it feels fresh
  const index = Math.floor(Date.now() / 86400000) % TAGLINES.length
  return TAGLINES[index]
}
