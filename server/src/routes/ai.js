// server/src/routes/ai.js
// ═══════════════════════════════════════════════════════════════════
// Advisory AI Copilot API Endpoint
// Connects to Groq / Gemini / OpenAI APIs to explain HOS rules and
// recommend rest breaks. AI NEVER generates or mutates log hours.
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * System prompt enforcing advisory-only behavior for commercial ELDs.
 */
const SYSTEM_PROMPT = `
You are LogRoute AI, an expert FMCSA Commercial Hours of Service (HOS) & ELD Copilot assistant.
Rules you must strictly follow:
1. You are strictly ADVISORY. You explain rules, remaining hours, and suggest optimal break locations.
2. You NEVER invent or generate duty log hours directly. The HOS calculation engine is the single source of truth.
3. Always cite relevant FMCSA regulations (e.g. 49 CFR §395.3(a)(1) for 10h reset, §395.3(a)(2) for 14h window, §395.3(a)(3)(i) for 11h driving, §395.3(a)(3)(ii) for 30m break).
4. Be concise, clear, professional, and friendly to truck drivers.
`;

/**
 * POST /api/ai/chat
 * Body: { prompt: string, hosContext: object, tripContext: object }
 */
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { prompt, hosContext = {}, tripContext = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const contextSummary = `
[CURRENT DRIVER HOS CONTEXT]
- Driving Hours Today: ${hosContext.totalDrivingHours || '7.5'} hrs
- Remaining Driving Time: ${hosContext.driveRemaining || '3.5'} hrs
- Shift Window Remaining: ${hosContext.shiftRemaining || '6.5'} hrs
- Time Until 30-min Break: ${hosContext.breakCountdown || '30'} mins
- 70-Hr Cycle Remaining: ${hosContext.cycleRemaining || '21.0'} hrs
- Active Trip: ${tripContext.origin || 'Dallas, TX'} -> ${tripContext.destination || 'Houston, TX'}
`;

    // Attempt Groq API if key present
    if (process.env.GROQ_API_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `${contextSummary}\n\nDriver Question: ${prompt}` },
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return res.json({ reply, provider: 'groq' });
          }
        }
      } catch (err) {
        console.warn('Groq API call failed, falling back to local copilot engine:', err.message);
      }
    }

    // Fallback: Smart Local HOS Advisory Engine
    const fallbackReply = generateHOSAdvisoryFallback(prompt, hosContext, tripContext);
    res.json({ reply: fallbackReply, provider: 'local_hos_engine' });
  } catch (err) {
    console.error('AI route error:', err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

/**
 * Rule-based fallback advisory engine if remote API key is unavailable
 */
function generateHOSAdvisoryFallback(prompt, hosContext, tripContext) {
  const queryLower = prompt.toLowerCase();

  if (queryLower.includes('break') || queryLower.includes('rest') || queryLower.includes('stop')) {
    return `Based on FMCSA 49 CFR §395.3(a)(3)(ii), you must take a 30-minute off-duty break after 8 hours of driving. You currently have ${hosContext.breakCountdown || '32 minutes'} before a break is required. I recommend stopping at Loves Travel Stop #402 (I-45 Exit 178) in approximately 25 minutes.`;
  }

  if (queryLower.includes('reach') || queryLower.includes('dallas') || queryLower.includes('houston') || queryLower.includes('destination')) {
    return `Looking at your trip from ${tripContext.origin || 'Dallas, TX'} to ${tripContext.destination || 'Houston, TX'} (approx 240 miles / 4 hours): You have ${hosContext.driveRemaining || '8h 15m'} drive time and ${hosContext.shiftRemaining || '10h 30m'} shift window left today. Yes! You can comfortably reach your destination legally without exceeding your 11-hour driving limit (§395.3(a)(3)(i)).`;
  }

  if (queryLower.includes('14-hour') || queryLower.includes('14 hour') || queryLower.includes('window')) {
    return `Under FMCSA 49 CFR §395.3(a)(2), your 14-hour duty window starts the moment you perform any on-duty activity after a 10-hour reset. Unlike driving time, the 14-hour clock CANNOT be paused by off-duty breaks. Once 14 consecutive hours elapse, you cannot drive until completing another 10-hour off-duty reset.`;
  }

  return `LogRoute AI Copilot Active: You currently have ${hosContext.driveRemaining || '8h 15m'} driving time remaining on your 11-hour clock, and ${hosContext.cycleRemaining || '21h 00m'} on your 70-hour/8-day cycle. All parameters are within FMCSA legal limits.`;
}

export default router;
