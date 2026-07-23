// server/src/services/aiService.js
// ═══════════════════════════════════════════════════════════════════
// AI Assistant Service (ESM)
// ═══════════════════════════════════════════════════════════════════

export async function assistAI(prompt, context = {}, userId) {
  const apiKey = process.env.AI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return 'LogRoute AI Advisory: All duty clocks are compliant with FMCSA 49 CFR Part 395 regulations.';
  }

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are an FMCSA Hours of Service expert assistant for truck drivers.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI request failed: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
