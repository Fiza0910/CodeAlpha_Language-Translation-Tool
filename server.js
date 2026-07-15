const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const deeplKey = process.env.DEEPL_API_KEY;
const deeplBaseUrl = process.env.DEEPL_API_BASE_URL || 'https://api-free.deepl.com';

if (!deeplKey) {
  console.warn('Missing DeepL API key. Copy .env.example to .env and add your DeepL credentials.');
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/api/translate', async (req, res) => {
  const { text, from, to } = req.body;

  if (!text || !to) {
    return res.status(400).json({ error: 'Text and target language are required.' });
  }

  try {
    const url = `${deeplBaseUrl}/v2/translate`;
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('target_lang', to);
    if (from) params.append('source_lang', from);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `DeepL-Auth-Key ${deeplKey || ''}`
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || data.error || 'Translation service error.' });
    }

    const translation = data.translations?.[0]?.text || '';
    res.json({ translatedText: translation });
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: 'Unable to translate text.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
