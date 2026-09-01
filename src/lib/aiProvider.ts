import OpenAI from 'openai';

import type { AiOperation } from '@/lib/aiTokenUsage';

export type AiProvider = 'openai' | 'openrouter';

export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

export type AiModelConfig = {
  provider: AiProvider;
  model: string;
  reasoningEffort: ReasoningEffort;
};

const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini';
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-3.7-flash';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** Read `AI_PROVIDER` (`openai` | `openrouter`). Defaults to OpenAI. */
export function getAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? 'openai').trim().toLowerCase();
  if (raw === 'openrouter') {
    return 'openrouter';
  }
  if (raw && raw !== 'openai') {
    console.warn(`[AI] Unknown AI_PROVIDER="${process.env.AI_PROVIDER}"; using openai`);
  }
  return 'openai';
}

export function getAiLogLabel(): string {
  return getAiProvider() === 'openrouter' ? 'OpenRouter' : 'OpenAI';
}

function normalizeLanguage(language?: string): string {
  if (!language) {
    return '';
  }
  const trimmed = language.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/** Pick OpenAI model + reasoning effort by task and language. */
function selectOpenAiConfig(operation: AiOperation, language?: string): Omit<AiModelConfig, 'provider'> {
  const lang = normalizeLanguage(language);

  switch (operation) {
    case 'cc_pdf_parse':
      return { model: 'gpt-5-mini', reasoningEffort: 'medium' };

    case 'cc_translate':
    case 'cc_translate_batch':
    case 'sdx_translate':
    case 'sdx_translate_batch':
      switch (lang) {
        case 'Japanese':
          return { model: 'gpt-5.6-terra', reasoningEffort: 'low' };
        case 'Korean':
          return { model: 'gpt-5.6-terra', reasoningEffort: 'low' };
        case 'Chinese':
          return { model: 'gpt-5.6-terra', reasoningEffort: 'none' };
        case 'English':
        case 'Spanish':
        case '':
          return { model: 'gpt-5.4-mini', reasoningEffort: 'none' };
        default:
          console.warn(
            `[OpenAI] No explicit model mapping for language="${language}"; `
            + `using ${DEFAULT_OPENAI_MODEL} / none`,
          );
          return { model: DEFAULT_OPENAI_MODEL, reasoningEffort: 'none' };
      }

    default: {
      const _exhaustive: never = operation;
      console.warn(
        `[OpenAI] Unhandled operation "${_exhaustive}"; `
        + `using ${DEFAULT_OPENAI_MODEL} / none`,
      );
      return { model: DEFAULT_OPENAI_MODEL, reasoningEffort: 'low' };
    }
  }
}

function getOpenRouterModel(): string {
  const override = process.env.OPENROUTER_MODEL?.trim();
  return override || DEFAULT_OPENROUTER_MODEL;
}

/** Pick provider, model, and reasoning effort for a menu AI call. */
export function selectAiConfig(operation: AiOperation, language?: string): AiModelConfig {
  const provider = getAiProvider();

  if (provider === 'openrouter') {
    return {
      provider,
      model: getOpenRouterModel(),
      // Gemini 3.7 Flash max thinking level is high (no xhigh).
      reasoningEffort: 'medium',
    };
  }

  return { provider, ...selectOpenAiConfig(operation, language) };
}

/** OpenAI SDK client pointed at OpenAI or OpenRouter, based on `AI_PROVIDER`. */
export function createAiClient(): OpenAI {
  const provider = getAiProvider();

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter');
    }

    return new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://manoamenu.app',
        'X-OpenRouter-Title': 'Manoa Menu',
      },
    });
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function getOpenRouterChatCompletionsUrl(): string {
  return `${OPENROUTER_BASE_URL}/chat/completions`;
}

export function getOpenRouterHeaders(): Record<string, string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter');
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://manoamenu.app',
    'X-OpenRouter-Title': 'Manoa Menu',
  };
}

let cachedClient: { provider: AiProvider; client: OpenAI } | null = null;

export function getAiClient(): OpenAI {
  const provider = getAiProvider();
  if (!cachedClient || cachedClient.provider !== provider) {
    cachedClient = { provider, client: createAiClient() };
  }
  return cachedClient.client;
}
