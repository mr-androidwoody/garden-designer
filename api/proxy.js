export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { service, ...body } = req.body

  const targets = {
    anthropic: {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    },
    openai: {
      url: 'https://api.openai.com/v1/images/edits',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
    },
  }

  const target = targets[service]
  if (!target) return res.status(400).json({ error: 'Unknown service' })

  const response = await fetch(target.url, {
    method: 'POST',
    headers: target.headers,
    body: JSON.stringify(body),
  })

  const data = await response.json()
  res.status(response.status).json(data)
}