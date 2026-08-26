const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/chat', async (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'messages must be a non-empty array.'
    });
  }

  const hasInvalidMessage = messages.some(
    (message) =>
      !message ||
      !['system', 'user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      message.content.trim().length === 0
  );

  if (hasInvalidMessage) {
    return res.status(400).json({
      error: 'Each message must include a valid role and non-empty content.'
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'The chatbot is not configured yet. Add OPENROUTER_API_KEY to the backend environment.'
    });
  }

  try {
    const providerResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Chatbot Challenge'
      },
      body: JSON.stringify({
        model: MODEL,
        messages
      })
    });

    const data = await providerResponse.json();

    if (!providerResponse.ok) {
      const providerError = data?.error?.message || 'The AI provider returned an error.';
      return res.status(502).json({ error: providerError });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || reply.trim().length === 0) {
      return res.status(502).json({ error: 'The AI provider returned an empty response.' });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('Chat provider request failed:', error.message);
    return res.status(502).json({
      error: 'Unable to reach the AI provider. Please try again.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
