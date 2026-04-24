export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { service, ...body } = req.body

  // ── OPENAI IMAGE GENERATION ──────────────────────────────
  if (service === 'openai-image') {
    const { prompt, imageBase64, imageType } = body

    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)

    const textPart = (name, value) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`

    const parts = [
      textPart('model', 'gpt-image-1'),
      textPart('prompt', prompt),
      textPart('n', '1'),
      textPart('size', '1024x1024'),
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="garden.png"\r\nContent-Type: ${imageType}\r\n\r\n`,
    ]

    const header = Buffer.from(parts.join('\r\n') + '\r\n')
    const footer = Buffer.from(`\r\n--${boundary}--`)
    const formData = Buffer.concat([header, imageBuffer, footer])

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formData,
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  }

  // ── ANTHROPIC ────────────────────────────────────────────
  if (service === 'anthropic') {
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
  }

  return res.status(400).json({ error: 'Unknown service' })
}
