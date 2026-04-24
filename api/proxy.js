import FormData from 'form-data'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { service, ...body } = req.body

  // ── OPENAI IMAGE GENERATION ──────────────────────────────
  if (service === 'openai-image') {
    try {
      const { prompt, imageBase64 } = body
      const imageBuffer = Buffer.from(imageBase64, 'base64')

      const form = new FormData()
      form.append('model', 'gpt-image-1')
      form.append('prompt', prompt)
      form.append('n', '1')
      form.append('size', '1024x1024')
      form.append('image', imageBuffer, {
        filename: 'garden.png',
        contentType: 'image/png',
        knownLength: imageBuffer.length,
      })

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
        body: form.getBuffer(),
      })

      const data = await response.json()
      return res.status(response.status).json(data)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // ── ANTHROPIC ────────────────────────────────────────────
  if (service === 'anthropic') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(400).json({ error: 'Unknown service' })
}
