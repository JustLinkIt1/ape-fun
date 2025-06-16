export async function generateTagline(): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      return 'Launch your memes. Rule the blockchain.'
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a creative tagline generator for a Solana memecoin launchpad called Ape Fun.' },
          { role: 'user', content: 'Generate a short catchy tagline.' }
        ],
        max_tokens: 16,
        temperature: 0.8
      })
    })
    const data = await res.json()
    const tagline = data.choices?.[0]?.message?.content?.trim()
    return tagline || 'Launch your memes. Rule the blockchain.'
  } catch (err) {
    console.error('Tagline generation failed', err)
    return 'Launch your memes. Rule the blockchain.'
  }
}
