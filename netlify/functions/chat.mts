import https from 'node:https';

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status });

const requestProvider = (payload: string, apiKey: string) =>
  new Promise<{ statusCode?: number; body: string }>((resolve, reject) => {
    const providerRequest = https.request('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
        'http-referer': process.env.APP_URL || 'https://luminous-capybara-6701b3.netlify.app',
        'x-title': 'AI Chatbot Challenge'
      }
    }, (providerResponse) => {
      let responseBody = '';
      providerResponse.setEncoding('utf8');
      providerResponse.on('data', (chunk) => { responseBody += chunk; });
      providerResponse.on('end', () => resolve({
        statusCode: providerResponse.statusCode,
        body: responseBody
      }));
    });

    providerRequest.on('error', reject);
    providerRequest.write(payload);
    providerRequest.end();
  });

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages must be a non-empty array.' }, 400);
  }

  const hasInvalidMessage = messages.some(
    (message) =>
      !message ||
      typeof message !== 'object' ||
      !['system', 'user', 'assistant'].includes((message as { role?: string }).role || '') ||
      typeof (message as { content?: unknown }).content !== 'string' ||
      !((message as { content: string }).content || '').trim()
  );

  if (hasInvalidMessage) {
    return json({
      error: 'Each message must include a valid role and non-empty content.'
    }, 400);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json({
      error: 'The chatbot is not configured yet. Add OPENROUTER_API_KEY to the site environment.'
    }, 500);
  }

  try {
    const payload = JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages
    });
    const providerResponse = await requestProvider(payload, apiKey);
    let data: { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> };

    try {
      data = JSON.parse(providerResponse.body);
    } catch {
      return json({ error: 'The AI provider returned an invalid response.' }, 502);
    }

    if (!providerResponse.statusCode || providerResponse.statusCode < 200 || providerResponse.statusCode >= 300) {
      return json({
        error: data?.error?.message || 'The AI provider returned an error.'
      }, 502);
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      return json({ error: 'The AI provider returned an empty response.' }, 502);
    }

    return json({ reply });
  } catch (error) {
    console.error('Chat provider request failed:', error);
    return json({ error: 'Unable to reach the AI provider. Please try again.' }, 502);
  }
};

export const config = {
  path: '/chat'
};
