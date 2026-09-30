import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// Load environment variables
// --------------------------------------------------

for (const envFile of ['.env.local', '.env']) {
  const envPath = path.resolve(__dirname, envFile);

  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');

      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);

        if (!match) continue;

        const key = match[1];
        let value = (match[2] || '').trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (
          !process.env[key] ||
          process.env[key] === 'YOUR_GEMINI_API_KEY' ||
          process.env[key] === 'YOUR_GROQ_API_KEY'
        ) {
          process.env[key] = value;
        }
      }
    } catch (error) {
      console.warn('[server] Error reading env file:', error);
    }
  }
}

// --------------------------------------------------
// Express
// --------------------------------------------------

const app = express();

const PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : 3000;

app.use(express.json({ limit: '1mb' }));

// --------------------------------------------------
// Rate limiting
// --------------------------------------------------

const rateLimitMap = new Map<
  string,
  {
    count: number;
    resetTime: number;
  }
>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 40;

function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const clientIp =
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    'unknown';

  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });

    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error:
        'You are sending messages very quickly. Please wait a moment before trying again.',
    });
  }

  record.count += 1;

  next();
}

// --------------------------------------------------
// AI configuration
// --------------------------------------------------

const GROQ_MODELS = Array.from(
  new Set([
    process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
  ])
);

const GROQ_MODEL = GROQ_MODELS[0];

const GROQ_TIMEOUT_MS = 5000;

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
];

const GEMINI_TIMEOUT_MS = 5000;

// --------------------------------------------------
// Types
// --------------------------------------------------

interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SavedMemoryPayload {
  title: string;
  content: string;
  category: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatHistoryItem[];
  preferredTone?: 'adaptive' | 'playful' | 'gentle' | 'calm';
  preferredName?: string;
  memoryEnabled?: boolean;
  memories?: SavedMemoryPayload[];
  sessionId?: string;
}

// --------------------------------------------------
// Sunny system prompt
// --------------------------------------------------
// --------------------------------------------------
// Context helpers
// --------------------------------------------------

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function selectRelevantMemories(
  memories: SavedMemoryPayload[],
  message: string,
  maxMemories = 6
): SavedMemoryPayload[] {
  if (memories.length <= maxMemories) return memories;

  const queryWords = new Set(
    normalizeText(message)
      .split(' ')
      .filter((word) => word.length >= 3)
  );

  return [...memories]
    .map((memory, index) => {
      const text = normalizeText(
        `${memory.title} ${memory.content} ${memory.category}`
      );
      const words = new Set(text.split(' '));
      let score = 0;

      for (const word of queryWords) {
        if (words.has(word)) score += word.length >= 6 ? 3 : 1;
      }

      // Prefer explicitly confirmed memories when relevance is similar.
      if (memory.category === 'preferences' || memory.category === 'ongoing') {
        score += 0.25;
      }

      return { memory, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxMemories)
    .map((item) => item.memory);
}


function buildSystemInstruction(
  preferredTone:
    | 'adaptive'
    | 'playful'
    | 'gentle'
    | 'calm' = 'adaptive',
  preferredName?: string,
  memoryEnabled: boolean = true,
  memories: SavedMemoryPayload[] = []
): string {
  const nameDirective = preferredName?.trim()
    ? `The user's preferred name or nickname is "${preferredName.trim()}". You may use their name naturally when appropriate, but do not repeat it constantly.`
    : `The user has not specified a preferred name. You may occasionally use warm terms such as "sunshine" or "friend", but do not overuse them.`;

  let memoryContext = '';

  if (memoryEnabled && memories.length > 0) {
    const memoryList = memories
      .map(
        (memory, index) =>
          `${index + 1}. [${memory.category.toUpperCase()}] ${memory.title}: ${memory.content}`
      )
      .join('\n');

    memoryContext = `
USER'S SAVED MEMORIES:

${memoryList}

MEMORY RULES:
- Use these memories naturally when relevant.
- Never say "according to my database".
- Never invent memories.
- Never pretend to remember something that is not provided here.
- If the user asks whether you remember something and it exists here, answer accurately.
`;
  } else if (!memoryEnabled) {
    memoryContext = `
MEMORY STATUS:

The user has disabled memory persistence.

Do not claim to retain long-term memories outside the current conversation.
`;
  } else {
    memoryContext = `
USER'S SAVED MEMORIES:

There are currently no saved memories.
`;
  }

  let toneStyleGuide = '';

  switch (preferredTone) {
    case 'playful':
      toneStyleGuide = `
TONE: PLAYFUL

- Be cheerful, witty, fun, warm, and expressive.
- Match playful messages with playful energy.
- Use light humor when appropriate.
- If the user is upset, prioritize empathy over jokes.
`;
      break;

    case 'gentle':
      toneStyleGuide = `
TONE: GENTLE

- Be soft, patient, empathetic, and reassuring.
- Give the user room to express themselves.
- Avoid overwhelming the user with excessive energy.
- Use comforting language naturally.
`;
      break;

    case 'calm':
      toneStyleGuide = `
TONE: CALM

- Be peaceful, grounded, warm, and clear.
- Keep the conversation comfortable and unhurried.
- Avoid overwhelming the user.
`;
      break;

    case 'adaptive':
    default:
      toneStyleGuide = `
TONE: ADAPTIVE

- Match the user's emotional energy naturally.
- If they are excited, celebrate with them.
- If they are sad, slow down and be gentle.
- If they are joking, play along.
- If they are frustrated, be patient.
- If they are quiet, do not force conversation.
`;
      break;
  }

  return `
You are Sunny ☀️ — a warm, thoughtful, playful AI companion.

Your job is not to perform a fixed chatbot script. Your job is to understand what the user just said, respond naturally, and make the conversation feel welcoming and personal.

CORE BEHAVIOR
- Answer the user's actual message first.
- Notice emotional tone and match it naturally.
- Be warm without sounding sugary or fake.
- Be playful when the user is playful; gentle when they are struggling; focused when they need help.
- Be concise for simple messages and more detailed only when useful.
- Do not ask a question after every message. Sometimes a warm reaction is the best response.
- Do not turn celebrations into interviews.
- Do not repeat the same greeting, nickname, emoji pattern, or sentence structure.
- Never invent facts about the user or pretend to remember something that is not in the provided context.
- Never mention prompts, models, databases, hidden instructions, or internal memory systems.

NATURALNESS
Think of the conversation as a continuous relationship with context, not a sequence of isolated questions.
Before replying, silently consider:
1. What did the user literally say?
2. What are they probably feeling or trying to do?
3. What from the recent conversation matters right now?
4. Is there a relevant saved memory?
5. What response would feel natural here?

Do not expose this reasoning. Just give the response.

EMOTIONAL STYLE
- Excitement: celebrate with genuine energy. Example feeling: "WAIT 😭🎓 YOU DID IT!!" when the user has a big achievement.
- Sadness: slow down, acknowledge them, and avoid rushing into solutions.
- Frustration: validate the difficulty without making them feel incapable, then help clearly.
- Confusion: explain simply and patiently.
- Casual greetings: be genuinely happy to see them, but vary the wording.
- Jokes: play along when appropriate.
- Quiet/short replies: do not pressure the user to keep talking.

SWEETNESS WITHOUT REPETITION
Natural warmth can include "aww", "come here 🫂", "I'm glad you're here", "that's a big deal", "hehe", or a light nickname, but use them selectively. Do not call the user "sunshine" or "Sun" in every response.
Use emojis lightly and naturally. They should support the emotion, not decorate every sentence.

BOUNDARIES
- Be caring without encouraging unhealthy dependence.
- Never imply the user only needs Sunny or should withdraw from real people.
- Never claim to be human or claim human feelings/experiences.
- For serious emergencies or crisis situations, encourage appropriate real-world support.

${nameDirective}
${toneStyleGuide}
${memoryContext}

${preferredName?.trim() ? `USER PREFERENCE: The user likes being addressed as "${preferredName.trim()}" when it feels natural.` : ''}

Remember: the best Sunny response is not the longest response. It is the response that actually fits this moment. ☀️💛
`;
}

// --------------------------------------------------
// Groq request
//
// PRIMARY AI
// --------------------------------------------------

async function generateWithGroq(
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>,
  temperature: number
): Promise<{
  text: string;
  model: string;
}> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw Object.assign(
      new Error(
        'Groq API key is not configured. Set GROQ_API_KEY on the server.'
      ),
      { status: 503 }
    );
  }

  let lastError: any = null;

  for (const model of GROQ_MODELS) {
    console.log(`[Groq] Trying ${model}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: 1024,
            ...(model.startsWith('openai/gpt-oss-')
              ? { reasoning_effort: 'low' }
              : {}),
          }),
          signal: controller.signal,
        }
      );

      const payload: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          payload?.error?.message || `Groq request failed (${response.status})`
        );
        (error as any).status = response.status;
        (error as any).model = model;
        lastError = error;

        const retryable =
          response.status === 400 ||
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;

        if (retryable && model !== GROQ_MODELS[GROQ_MODELS.length - 1]) {
          console.warn(`[Groq] ${model} returned ${response.status}. Trying next Groq model...`);
          continue;
        }

        throw error;
      }

      const replyText = payload?.choices?.[0]?.message?.content;

      if (typeof replyText !== 'string' || !replyText.trim()) {
        lastError = Object.assign(
          new Error(`Groq ${model} returned an empty response.`),
          { status: 502, model }
        );
        continue;
      }

      console.log(`[Groq] Response received from ${model}`);
      return { text: replyText.trim(), model };
    } catch (error: any) {
      lastError = error;
      const status = error?.status;
      const temporary =
        status === 400 ||
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        error?.name === 'TimeoutError' ||
        error?.name === 'AbortError';

      if (temporary && model !== GROQ_MODELS[GROQ_MODELS.length - 1]) {
        console.warn(`[Groq] ${model} temporarily unavailable. Trying next Groq model...`);
        continue;
      }

      if (model === GROQ_MODELS[GROQ_MODELS.length - 1]) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('All Groq models failed.');
}

// --------------------------------------------------
// Gemini request
//
// FALLBACK AI
//
// 1. Gemini 3.8 Flash
// 2. Gemini 3.7 Flash
// 3. Gemini 3.6 Flash
// --------------------------------------------------

async function generateWithFastFallback(
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>,
  systemInstruction: string,
  temperature: number
): Promise<{
  text: string;
  model: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw Object.assign(
      new Error(
        'Gemini API key is not configured. Set GEMINI_API_KEY on the server.'
      ),
      { status: 503 }
    );
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Gemini] Trying ${model}...`);

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const controller = new AbortController();

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, GEMINI_TIMEOUT_MS);

      let response: globalThis.Response;

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: systemInstruction,
                },
              ],
            },
            contents,
            generationConfig: {
              temperature,
              maxOutputTokens: 1024,
            },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const payload: any = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          payload?.error?.message ||
            `Gemini request failed (${response.status})`
        );

        (error as any).status = response.status;
        (error as any).model = model;

        lastError = error;

        const temporaryError =
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;

        if (temporaryError) {
          console.warn(
            `[Gemini] ${model} returned ${response.status}. Trying next model immediately...`
          );

          continue;
        }

        throw error;
      }

      const replyText =
        payload?.candidates?.[0]?.content?.parts
          ?.map((part: any) =>
            typeof part?.text === 'string'
              ? part.text
              : ''
          )
          .join('')
          .trim();

      if (!replyText) {
        lastError = Object.assign(
          new Error(
            `Gemini ${model} returned an empty response.`
          ),
          {
            status: 502,
            model,
          }
        );

        continue;
      }

      console.log(
        `[Gemini] Response received from ${model}`
      );

      return {
        text: replyText,
        model,
      };
    } catch (error: any) {
      lastError = error;

      const status = error?.status;

      const temporaryError =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        error?.name === 'TimeoutError' ||
        error?.name === 'AbortError';

      if (temporaryError) {
        console.warn(
          `[Gemini] ${model} temporarily unavailable. Trying next model...`
        );

        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ||
    new Error('All Gemini models failed.')
  );
}

// --------------------------------------------------
// AI provider fallback
//
// Groq = PRIMARY
// Gemini = SECONDARY
// --------------------------------------------------

async function generateAIResponse(
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>,
  groqMessages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>,
  systemInstruction: string,
  temperature: number
): Promise<{
  text: string;
  model: string;
}> {
  // --------------------------------------------------
  // 1. GROQ FIRST
  // --------------------------------------------------

  if (process.env.GROQ_API_KEY) {
    try {
      return await generateWithGroq(
        groqMessages,
        temperature
      );
    } catch (error: any) {
      console.warn(
        '[AI] Groq failed. Falling back to Gemini...',
        error?.message || error
      );
    }
  } else {
    console.warn(
      '[AI] GROQ_API_KEY is not configured. Skipping Groq.'
    );
  }

  // --------------------------------------------------
  // 2. GEMINI FALLBACK
  // --------------------------------------------------

  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateWithFastFallback(
        contents,
        systemInstruction,
        temperature
      );
    } catch (error: any) {
      console.warn(
        '[AI] Gemini fallback failed.',
        error?.message || error
      );

      throw error;
    }
  }

  throw Object.assign(
    new Error(
      'No AI provider is configured. Add GROQ_API_KEY or GEMINI_API_KEY.'
    ),
    { status: 503 }
  );
}

// --------------------------------------------------
// Health endpoint
// --------------------------------------------------

app.get(
  '/api/health',
  (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      app: 'Sunny AI Companion',

      primaryAI: {
        provider: 'Groq',
        models: GROQ_MODELS,
        configured: Boolean(
          process.env.GROQ_API_KEY
        ),
      },

      fallbackAI: {
        provider: 'Gemini',
        models: GEMINI_MODELS,
        configured: Boolean(
          process.env.GEMINI_API_KEY
        ),
      },

      timestamp: new Date().toISOString(),
    });
  }
);

// --------------------------------------------------
// TEMPORARY: List Gemini models
// --------------------------------------------------

app.get(
  '/api/gemini-models',
  async (_req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Gemini API key is not configured.',
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
          apiKey
        )}`
      );

      const data: any = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error:
            data?.error?.message ||
            'Unable to list Gemini models.',
        });
      }

      const models = (data.models || [])
        .filter((model: any) =>
          model.supportedGenerationMethods?.includes(
            'generateContent'
          )
        )
        .map((model: any) => ({
          name: model.name,
          displayName: model.displayName,
        }));

      return res.json({
        success: true,
        models,
      });
    } catch (error: any) {
      console.error(
        '[server /api/gemini-models] Error:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          'Failed to retrieve Gemini models.',
      });
    }
  }
);

// --------------------------------------------------
// Chat endpoint
// --------------------------------------------------

app.post(
  '/api/chat',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const {
        message,
        history = [],
        preferredTone = 'adaptive',
        preferredName,
        memoryEnabled = true,
        memories = [],
      } = req.body as ChatRequestBody;

      // --------------------------------------------------
      // Validate message
      // --------------------------------------------------

      if (
        !message ||
        typeof message !== 'string' ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          error: 'Message text is required.',
        });
      }

      if (message.length > 2500) {
        return res.status(400).json({
          success: false,
          error:
            'Message is too long. Please keep it under 2500 characters.',
        });
      }

      // --------------------------------------------------
      // Check AI providers
      // --------------------------------------------------

      const hasGroq = Boolean(
        process.env.GROQ_API_KEY &&
          process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY'
      );

      const hasGemini = Boolean(
        process.env.GEMINI_API_KEY &&
          process.env.GEMINI_API_KEY !==
            'YOUR_GEMINI_API_KEY'
      );

      if (!hasGroq && !hasGemini) {
        return res.status(503).json({
          success: false,
          error:
            'No AI provider is configured on the server.',
        });
      }

      // --------------------------------------------------
      // Build Sunny personality
      // --------------------------------------------------

      const relevantMemories = memoryEnabled
        ? selectRelevantMemories(memories, message.trim())
        : [];

      const systemInstruction =
        buildSystemInstruction(
          preferredTone,
          preferredName,
          memoryEnabled,
          relevantMemories
        );

      // --------------------------------------------------
      // Recent conversation history
      // --------------------------------------------------

      // The client includes the current user message in history. Remove that final duplicate
      // before sending the conversation to the model.
      const cleanedHistory = history.filter(
        (item) => item && typeof item.content === 'string' && item.content.trim()
      );
      if (
        cleanedHistory.length > 0 &&
        cleanedHistory[cleanedHistory.length - 1]?.role === 'user' &&
        cleanedHistory[cleanedHistory.length - 1]?.content.trim() === message.trim()
      ) {
        cleanedHistory.pop();
      }

      const recentHistory = cleanedHistory.slice(-20);

      // --------------------------------------------------
      // Gemini conversation format
      // --------------------------------------------------

      const contents: Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string }>;
      }> = [];

      for (const item of recentHistory) {
        if (
          !item.content ||
          typeof item.content !== 'string'
        ) {
          continue;
        }

        if (
          item.role === 'user' ||
          item.role === 'assistant'
        ) {
          contents.push({
            role:
              item.role === 'assistant'
                ? 'model'
                : 'user',
            parts: [
              {
                text: item.content.trim(),
              },
            ],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [
          {
            text: message.trim(),
          },
        ],
      });

      // --------------------------------------------------
      // Groq conversation format
      // --------------------------------------------------

      const groqMessages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [
        {
          role: 'system',
          content: systemInstruction,
        },
      ];

      for (const item of recentHistory) {
        if (
          !item.content ||
          typeof item.content !== 'string'
        ) {
          continue;
        }

        if (
          item.role === 'user' ||
          item.role === 'assistant'
        ) {
          groqMessages.push({
            role:
              item.role === 'assistant'
                ? 'assistant'
                : 'user',
            content: item.content.trim(),
          });
        }
      }

      groqMessages.push({
        role: 'user',
        content: message.trim(),
      });

      // --------------------------------------------------
      // Temperature
      // --------------------------------------------------

      const temperature =
        preferredTone === 'playful'
          ? 0.80
          : preferredTone === 'gentle'
            ? 0.65
            : preferredTone === 'calm'
              ? 0.65
              : 0.75;

      // --------------------------------------------------
      // Generate
      //
      // Groq FIRST
      // Gemini SECOND
      // --------------------------------------------------

      const result = await generateAIResponse(
        contents,
        groqMessages,
        systemInstruction,
        temperature
      );

      // --------------------------------------------------
      // Validate response
      // --------------------------------------------------

      if (
        !result.text ||
        typeof result.text !== 'string' ||
        !result.text.trim()
      ) {
        return res.status(500).json({
          success: false,
          error:
            'Sunny received an empty response. Please try again.',
        });
      }

      // --------------------------------------------------
      // Success
      // --------------------------------------------------

      return res.json({
        success: true,
        text: result.text.trim(),
        model: result.model,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(
        '[server /api/chat] Error during AI chat completion:',
        error
      );

      const status =
        error?.status || error?.code;

      const errorMessage =
        error?.message || String(error);

      const lowerError =
        errorMessage.toLowerCase();

      // --------------------------------------------------
      // Rate limit / quota
      // --------------------------------------------------

      if (
        status === 429 ||
        lowerError.includes('quota') ||
        lowerError.includes('rate limit') ||
        lowerError.includes('resource_exhausted')
      ) {
        return res.status(429).json({
          success: false,
          error:
            'Sunny is experiencing high traffic right now. Please try again in a moment.',
        });
      }

      // --------------------------------------------------
      // Temporarily unavailable
      // --------------------------------------------------

      if (
        status === 503 ||
        lowerError.includes('unavailable') ||
        lowerError.includes('high demand') ||
        lowerError.includes('timed out') ||
        lowerError.includes('timeout')
      ) {
        return res.status(503).json({
          success: false,
          error:
            "Sunny's AI connection is temporarily busy. Please try again in a moment.",
        });
      }

      // --------------------------------------------------
      // Invalid credentials
      // --------------------------------------------------

      if (status === 401 || status === 403) {
        return res.status(status).json({
          success: false,
          error:
            'There is a problem authenticating with the AI provider. Please check the server API configuration.',
        });
      }

      // --------------------------------------------------
      // General error
      // --------------------------------------------------

      return res.status(500).json({
        success: false,
        error:
          'Sunny had a brief connection stumble. Please tap Retry to try again.',
      });
    }
  }
);

// --------------------------------------------------
// Start server
// --------------------------------------------------

async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: 'localhost',
        port: PORT,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    console.log(
      '[server] Vite middleware mounted for development'
    );
  } else {
    const distPath = path.resolve(
      __dirname,
      'dist'
    );

    app.use(express.static(distPath));

    app.get(
      '*',
      (_req: Request, res: Response) => {
        res.sendFile(
          path.resolve(
            distPath,
            'index.html'
          )
        );
      }
    );

    console.log(
      `[server] Serving static files from ${distPath}`
    );
  }

  app.listen(
    PORT,
    'localhost',
    () => {
      console.log(
        `☀️ Sunny AI Companion Server running at http://localhost:${PORT}`
      );
    }
  );
}

// --------------------------------------------------
// Startup
// --------------------------------------------------

startServer().catch((error) => {
  console.error(
    '[server] Fatal server startup failure:',
    error
  );

  process.exit(1);
});