import { prisma } from '@/lib/prisma';

/** USD per 1M tokens by model id. */
type ModelPricing = {
  input: number;
  cached_input: number | null;
  cache_writes: number | null;
  output: number;
};

const OPENAI_MODEL_PRICING: Record<string, ModelPricing> = {
  // Standard short-context rates as of 2026-07-30 (Terra −20%, Luna −80%; Sol unchanged).
  'gpt-5.6-sol': { input: 5.0, cached_input: 0.5, cache_writes: 6.25, output: 30.0 },
  'gpt-5.6-terra': { input: 2.0, cached_input: 0.2, cache_writes: 2.5, output: 12.0 },
  'gpt-5.6-luna': { input: 0.2, cached_input: 0.02, cache_writes: 0.25, output: 1.2 },
  'gpt-5.5': { input: 5.0, cached_input: 0.5, cache_writes: null, output: 30.0 },
  'gpt-5.5-pro': { input: 30.0, cached_input: null, cache_writes: null, output: 180.0 },
  'gpt-5.4': { input: 2.5, cached_input: 0.25, cache_writes: null, output: 15.0 },
  'gpt-5.4-mini': { input: 0.75, cached_input: 0.075, cache_writes: null, output: 4.5 },
  'gpt-5.4-nano': { input: 0.2, cached_input: 0.02, cache_writes: null, output: 1.25 },
  'gpt-5.4-pro': { input: 30.0, cached_input: null, cache_writes: null, output: 180.0 },
  'gpt-5.2': { input: 1.75, cached_input: 0.175, cache_writes: null, output: 14.0 },
  'gpt-5.2-pro': { input: 21.0, cached_input: null, cache_writes: null, output: 168.0 },
  'gpt-5.1': { input: 1.25, cached_input: 0.125, cache_writes: null, output: 10.0 },
  'gpt-5': { input: 1.25, cached_input: 0.125, cache_writes: null, output: 10.0 },
  'gpt-5-mini': { input: 0.25, cached_input: 0.025, cache_writes: null, output: 2.0 },
  'gpt-5-nano': { input: 0.05, cached_input: 0.005, cache_writes: null, output: 0.4 },
  'gpt-5-pro': { input: 15.0, cached_input: null, cache_writes: null, output: 120.0 },
  'gpt-4.1': { input: 2.0, cached_input: 0.5, cache_writes: null, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, cached_input: 0.1, cache_writes: null, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, cached_input: 0.025, cache_writes: null, output: 0.4 },
  'gpt-4o': { input: 2.5, cached_input: 1.25, cache_writes: null, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, cached_input: 0.075, cache_writes: null, output: 0.6 },
};

/** OpenRouter listed rates (USD / 1M tokens) as of 2026-08-14 from GET /api/v1/models. */
const OPENROUTER_MODEL_PRICING: Record<string, ModelPricing> = {
  'anthropic/claude-haiku-4.5': { input: 1, cached_input: 0.1, cache_writes: 1.25, output: 5 },
  'anthropic/claude-opus-4': { input: 15, cached_input: 1.5, cache_writes: 18.75, output: 75 },
  'anthropic/claude-opus-4.1': { input: 15, cached_input: 1.5, cache_writes: 18.75, output: 75 },
  'anthropic/claude-opus-4.5': { input: 5, cached_input: 0.5, cache_writes: 6.25, output: 25 },
  'anthropic/claude-opus-4.6': { input: 5, cached_input: 0.5, cache_writes: 6.25, output: 25 },
  'anthropic/claude-opus-4.7': { input: 5, cached_input: 0.5, cache_writes: 6.25, output: 25 },
  'anthropic/claude-opus-4.8': { input: 5, cached_input: 0.5, cache_writes: 6.25, output: 25 },
  'anthropic/claude-sonnet-4': { input: 3, cached_input: 0.3, cache_writes: 3.75, output: 15 },
  'anthropic/claude-sonnet-4.5': { input: 3, cached_input: 0.3, cache_writes: 3.75, output: 15 },
  'anthropic/claude-sonnet-4.6': { input: 3, cached_input: 0.3, cache_writes: 3.75, output: 15 },
  'deepseek/deepseek-chat': { input: 0.2574, cached_input: null, cache_writes: null, output: 1.029 },
  'deepseek/deepseek-chat-v3.1': { input: 0.25, cached_input: 0.13, cache_writes: null, output: 0.95 },
  'deepseek/deepseek-r1': { input: 0.7, cached_input: null, cache_writes: null, output: 2.5 },
  'deepseek/deepseek-r1-distill-llama-70b': { input: 0.8, cached_input: null, cache_writes: null, output: 0.8 },
  'deepseek/deepseek-v3.1-terminus': { input: 0.27, cached_input: 0.13, cache_writes: null, output: 0.95 },
  'deepseek/deepseek-v3.2': { input: 0.269, cached_input: 0.1345, cache_writes: null, output: 0.4 },
  'google/gemini-2.5-flash': { input: 0.3, cached_input: 0.03, cache_writes: 0.0833, output: 2.5 },
  'google/gemini-2.5-flash-lite': { input: 0.1, cached_input: 0.01, cache_writes: 0.0833, output: 0.4 },
  'google/gemini-2.5-pro': { input: 1.25, cached_input: 0.125, cache_writes: 0.375, output: 10 },
  'google/gemini-2.5-pro-preview': { input: 1.25, cached_input: 0.125, cache_writes: 0.375, output: 10 },
  'google/gemini-3-flash-preview': { input: 0.5, cached_input: 0.05, cache_writes: 0.0833, output: 3 },
  'google/gemini-3.1-flash-lite': { input: 0.25, cached_input: 0.025, cache_writes: 0.0833, output: 1.5 },
  'google/gemini-3.1-flash-lite-preview': { input: 0.25, cached_input: 0.025, cache_writes: 0.0833, output: 1.5 },
  'google/gemini-3.1-pro-preview': { input: 2, cached_input: 0.2, cache_writes: 0.375, output: 12 },
  'google/gemini-3.5-flash': { input: 1.5, cached_input: 0.15, cache_writes: 0.0833, output: 9 },
  'google/gemini-3.5-flash-lite': { input: 0.3, cached_input: 0.03, cache_writes: 0.0833, output: 2.5 },
  'google/gemini-3.6-flash': { input: 0.75, cached_input: 0.075, cache_writes: 0.0417, output: 3.75 },
  'google/gemini-3.7-flash': { input: 0.375, cached_input: 0.0375, cache_writes: 0.0208, output: 1.875 },
  'meta-llama/llama-3.3-70b-instruct': { input: 0.1, cached_input: null, cache_writes: null, output: 0.32 },
  'meta-llama/llama-4-maverick': { input: 0.2, cached_input: null, cache_writes: null, output: 0.8 },
  'meta-llama/llama-4-scout': { input: 0.1, cached_input: null, cache_writes: null, output: 0.3 },
  'mistralai/mistral-large': { input: 2, cached_input: 0.2, cache_writes: null, output: 6 },
  'mistralai/mistral-large-2512': { input: 0.5, cached_input: 0.05, cache_writes: null, output: 1.5 },
  'mistralai/mistral-medium-3': { input: 0.4, cached_input: 0.04, cache_writes: null, output: 2 },
  'mistralai/mistral-medium-3-5': { input: 1.5, cached_input: null, cache_writes: null, output: 7.5 },
  'mistralai/mistral-medium-3.1': { input: 0.4, cached_input: 0.04, cache_writes: null, output: 2 },
  'mistralai/mistral-small-3.1-24b-instruct': { input: 0.351, cached_input: null, cache_writes: null, output: 0.555 },
  'mistralai/mistral-small-3.2-24b-instruct': { input: 0.0938, cached_input: null, cache_writes: null, output: 0.25 },
  'moonshotai/kimi-k2': { input: 0.57, cached_input: null, cache_writes: null, output: 2.3 },
  'moonshotai/kimi-k2-0905': { input: 0.6, cached_input: null, cache_writes: null, output: 2.5 },
  'moonshotai/kimi-k2-thinking': { input: 0.6, cached_input: 0.15, cache_writes: null, output: 2.5 },
  'moonshotai/kimi-k2.5': { input: 0.57, cached_input: 0.095, cache_writes: null, output: 2.85 },
  'moonshotai/kimi-k2.6': { input: 0.5605, cached_input: 0.0944, cache_writes: null, output: 2.36 },
  'moonshotai/kimi-k2.7-code': { input: 0.71, cached_input: 0.15, cache_writes: null, output: 3.5 },
  'openai/gpt-4.1': { input: 2, cached_input: 0.5, cache_writes: null, output: 8 },
  'openai/gpt-4.1-mini': { input: 0.4, cached_input: 0.1, cache_writes: null, output: 1.6 },
  'openai/gpt-4.1-nano': { input: 0.1, cached_input: 0.025, cache_writes: null, output: 0.4 },
  'openai/gpt-4o': { input: 2.5, cached_input: 1.25, cache_writes: null, output: 10 },
  'openai/gpt-4o-mini': { input: 0.15, cached_input: 0.075, cache_writes: null, output: 0.6 },
  'openai/gpt-5': { input: 1.25, cached_input: 0.125, cache_writes: null, output: 10 },
  'openai/gpt-5-mini': { input: 0.25, cached_input: 0.025, cache_writes: null, output: 2 },
  'openai/gpt-5-nano': { input: 0.05, cached_input: 0.005, cache_writes: null, output: 0.4 },
  'openai/gpt-5-pro': { input: 15, cached_input: null, cache_writes: null, output: 120 },
  'openai/gpt-5.1': { input: 1.25, cached_input: 0.125, cache_writes: null, output: 10 },
  'openai/gpt-5.2': { input: 1.75, cached_input: 0.175, cache_writes: null, output: 14 },
  'openai/gpt-5.2-chat': { input: 1.75, cached_input: 0.175, cache_writes: null, output: 14 },
  'openai/gpt-5.2-pro': { input: 21, cached_input: null, cache_writes: null, output: 168 },
  'openai/gpt-5.4': { input: 2.5, cached_input: 0.25, cache_writes: null, output: 15 },
  'openai/gpt-5.4-mini': { input: 0.75, cached_input: 0.075, cache_writes: null, output: 4.5 },
  'openai/gpt-5.4-nano': { input: 0.2, cached_input: 0.02, cache_writes: null, output: 1.25 },
  'openai/gpt-5.4-pro': { input: 30, cached_input: null, cache_writes: null, output: 180 },
  'openai/gpt-5.5': { input: 5, cached_input: 0.5, cache_writes: null, output: 30 },
  'openai/gpt-5.5-pro': { input: 30, cached_input: null, cache_writes: null, output: 180 },
  'openai/gpt-5.6-luna': { input: 0.1, cached_input: 0.01, cache_writes: 0.125, output: 0.6 },
  'openai/gpt-5.6-luna-pro': { input: 0.1, cached_input: 0.01, cache_writes: 0.125, output: 0.6 },
  'openai/gpt-5.6-sol': { input: 5, cached_input: 0.5, cache_writes: 6.25, output: 30 },
  'openai/gpt-5.6-sol-pro': { input: 5, cached_input: 0.5, cache_writes: 6.25, output: 30 },
  'openai/gpt-5.6-terra': { input: 1, cached_input: 0.1, cache_writes: 1.25, output: 6 },
  'openai/gpt-5.6-terra-pro': { input: 1, cached_input: 0.1, cache_writes: 1.25, output: 6 },
  'openai/o3': { input: 2, cached_input: 0.5, cache_writes: null, output: 8 },
  'openai/o3-mini': { input: 1.1, cached_input: 0.55, cache_writes: null, output: 4.4 },
  'openai/o3-mini-high': { input: 1.1, cached_input: 0.55, cache_writes: null, output: 4.4 },
  'openai/o3-pro': { input: 20, cached_input: null, cache_writes: null, output: 80 },
  'openai/o4-mini': { input: 1.1, cached_input: 0.275, cache_writes: null, output: 4.4 },
  'openai/o4-mini-high': { input: 1.1, cached_input: 0.275, cache_writes: null, output: 4.4 },
  'qwen/qwen3-coder': { input: 0.3, cached_input: 0.1, cache_writes: null, output: 1 },
  'qwen/qwen3-coder-30b-a3b-instruct': { input: 0.07, cached_input: null, cache_writes: null, output: 0.28 },
  'qwen/qwen3-coder-flash': { input: 0.195, cached_input: 0.039, cache_writes: 0.2438, output: 0.975 },
  'qwen/qwen3-coder-next': { input: 0.12, cached_input: 0.07, cache_writes: null, output: 0.8 },
  'qwen/qwen3-coder-plus': { input: 0.65, cached_input: 0.13, cache_writes: 0.8125, output: 3.25 },
  'qwen/qwen3-max': { input: 0.78, cached_input: 0.156, cache_writes: 0.975, output: 3.9 },
  'qwen/qwen3-max-thinking': { input: 0.78, cached_input: null, cache_writes: null, output: 3.9 },
  'qwen/qwen3.6-flash': { input: 0.1875, cached_input: null, cache_writes: 0.2344, output: 1.125 },
  'qwen/qwen3.6-max-preview': { input: 1.027, cached_input: null, cache_writes: 1.284, output: 6.162 },
  'qwen/qwen3.6-plus': { input: 0.325, cached_input: null, cache_writes: 0.4063, output: 1.95 },
  'qwen/qwen3.7-flash': { input: 0.03, cached_input: 0.006, cache_writes: 0.038, output: 0.13 },
  'qwen/qwen3.7-max': { input: 1.475, cached_input: 0.295, cache_writes: 1.844, output: 4.425 },
  'qwen/qwen3.7-plus': { input: 0.32, cached_input: 0.064, cache_writes: 0.4, output: 1.28 },
  'x-ai/grok-4.20': { input: 1.25, cached_input: 0.2, cache_writes: null, output: 2.5 },
  'x-ai/grok-4.20-multi-agent': { input: 1.25, cached_input: 0.2, cache_writes: null, output: 2.5 },
  'x-ai/grok-4.3': { input: 1.25, cached_input: 0.2, cache_writes: null, output: 2.5 },
  'x-ai/grok-4.5': { input: 2, cached_input: 0.3, cache_writes: null, output: 6 },
  'x-ai/grok-4.6': { input: 2, cached_input: 0.5, cache_writes: null, output: 6 },
};

const MODEL_PRICING: Record<string, ModelPricing> = {
  ...OPENAI_MODEL_PRICING,
  ...OPENROUTER_MODEL_PRICING,
};

export type AiOperation =
  | 'cc_pdf_parse'
  | 'cc_translate'
  | 'cc_translate_batch'
  | 'sdx_translate'
  | 'sdx_translate_batch';

export type AiUsageInput = {
  operation: AiOperation;
  model: string;
  language?: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  totalTokens?: number;
  responseId?: string;
};

function costForTokens(tokens: number, usdPerMillion: number): number {
  return (tokens / 1_000_000) * usdPerMillion;
}

/** Resolve pricing for a model id, including dated snapshots like `gpt-5-mini-2025-08-07`. */
export function getModelPricing(model: string): ModelPricing | null {
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }

  const slash = model.lastIndexOf('/');
  if (slash >= 0) {
    const unprefixed = model.slice(slash + 1);
    if (OPENAI_MODEL_PRICING[unprefixed]) {
      return OPENAI_MODEL_PRICING[unprefixed];
    }
  }

  const keys = Object.keys(MODEL_PRICING).sort((a, b) => b.length - a.length);
  const match = keys.find((key) => (
    model === key
    || model.startsWith(`${key}-`)
    || model.startsWith(`${key}:`)
  ));
  return match ? MODEL_PRICING[match] : null;
}

/** Estimate USD cost from token counts and the model pricing table. */
export function estimateAiCosts(usage: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
}): { inputCost: number; outputCost: number } {
  const pricing = getModelPricing(usage.model);
  if (!pricing) {
    console.warn(`[AiTokenUsage] No pricing found for model "${usage.model}"; recording $0 cost`);
    return { inputCost: 0, outputCost: 0 };
  }

  const cached = Math.min(usage.cachedInputTokens ?? 0, usage.inputTokens);
  const uncachedInput = Math.max(0, usage.inputTokens - cached);
  const cachedRate = pricing.cached_input ?? pricing.input;

  const inputCost =
    costForTokens(uncachedInput, pricing.input)
    + costForTokens(cached, cachedRate);

  const outputCost = costForTokens(usage.outputTokens, pricing.output);

  return { inputCost, outputCost };
}

/** Persist one OpenAI call's token usage and estimated cost. */
export async function recordAiTokenUsage(usage: AiUsageInput): Promise<void> {
  try {
    const inputTokens = usage.inputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;
    const reasoningTokens = usage.reasoningTokens ?? 0;
    const cachedInputTokens = usage.cachedInputTokens ?? 0;
    const totalTokens = usage.totalTokens ?? inputTokens + outputTokens;
    const { inputCost, outputCost } = estimateAiCosts({
      model: usage.model,
      inputTokens,
      outputTokens,
      cachedInputTokens,
    });

    await prisma.aiTokenUsage.create({
      data: {
        operation: usage.operation,
        model: usage.model,
        language: usage.language,
        inputTokens,
        outputTokens,
        reasoningTokens,
        cachedInputTokens,
        totalTokens,
        inputCost,
        outputCost,
        responseId: usage.responseId,
      },
    });
  } catch (error) {
    console.error('[AiTokenUsage] Failed to record usage:', error);
  }
}

export type AiUsageRow = {
  id: number;
  createdAt: Date;
  operation: string;
  model: string;
  language: string | null;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  menuOutputTokens: number;
  cachedInputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  responseId: string | null;
};

export type AiUsageGroup = {
  key: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  menuOutputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
};

export type AiUsagePeriod = 'day' | 'week' | 'month' | 'all';

export type AiUsageDashboard = {
  period: AiUsagePeriod;
  since: Date | null;
  summary: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    menuOutputTokens: number;
    totalTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  byOperation: AiUsageGroup[];
  byModel: AiUsageGroup[];
  recent: AiUsageRow[];
};

const HST_OFFSET_MS = 10 * 60 * 60 * 1000;

function decimalToNumber(value: { toString(): string } | number): number {
  return typeof value === 'number' ? value : Number(value.toString());
}

function toHstComponents(date: Date) {
  const shifted = new Date(date.getTime() - HST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

function hstMidnightUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 10, 0, 0, 0));
}

/** Start of the selected period in Hawaii time. */
export function getPeriodSince(period: AiUsagePeriod): Date | null {
  if (period === 'all') {
    return null;
  }

  const { year, month, day, weekday } = toHstComponents(new Date());

  if (period === 'day') {
    return hstMidnightUtc(year, month, day);
  }

  if (period === 'week') {
    const daysFromMonday = (weekday + 6) % 7;
    const monday = new Date(Date.UTC(year, month, day));
    monday.setUTCDate(monday.getUTCDate() - daysFromMonday);
    return hstMidnightUtc(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
  }

  return hstMidnightUtc(year, month, 1);
}

export function parseAiUsagePeriod(value: string | undefined): AiUsagePeriod {
  if (value === 'day' || value === 'week' || value === 'month' || value === 'all') {
    return value;
  }
  return 'week';
}

/** Load aggregated + recent AI usage for the cost dashboard. */
export async function getAiUsageDashboard(
  limit = 100,
  period: AiUsagePeriod = 'week',
): Promise<AiUsageDashboard> {
  const take = Math.max(1, Math.min(limit, 500));
  const since = getPeriodSince(period);
  const where = since ? { createdAt: { gte: since } } : undefined;

  const [totals, byOperationRaw, byModelRaw, recentRaw] = await Promise.all([
    prisma.aiTokenUsage.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        reasoningTokens: true,
        totalTokens: true,
        inputCost: true,
        outputCost: true,
      },
    }),
    prisma.aiTokenUsage.groupBy({
      by: ['operation'],
      where,
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        reasoningTokens: true,
        totalTokens: true,
        inputCost: true,
        outputCost: true,
      },
    }),
    prisma.aiTokenUsage.groupBy({
      by: ['model'],
      where,
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        reasoningTokens: true,
        totalTokens: true,
        inputCost: true,
        outputCost: true,
      },
    }),
    prisma.aiTokenUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    }),
  ]);

  const inputCost = decimalToNumber(totals._sum.inputCost ?? 0);
  const outputCost = decimalToNumber(totals._sum.outputCost ?? 0);
  const summaryInputTokens = totals._sum.inputTokens ?? 0;
  const summaryOutputTokens = totals._sum.outputTokens ?? 0;
  const summaryReasoningTokens = totals._sum.reasoningTokens ?? 0;

  const toGroup = (
    key: string,
    count: number,
    sum: {
      inputTokens: number | null;
      outputTokens: number | null;
      reasoningTokens: number | null;
      totalTokens: number | null;
      inputCost: { toString(): string } | number | null;
      outputCost: { toString(): string } | number | null;
    },
  ): AiUsageGroup => {
    const groupInputCost = decimalToNumber(sum.inputCost ?? 0);
    const groupOutputCost = decimalToNumber(sum.outputCost ?? 0);
    const outputTokens = sum.outputTokens ?? 0;
    const reasoningTokens = sum.reasoningTokens ?? 0;
    return {
      key,
      calls: count,
      inputTokens: sum.inputTokens ?? 0,
      outputTokens,
      reasoningTokens,
      menuOutputTokens: Math.max(0, outputTokens - reasoningTokens),
      totalTokens: sum.totalTokens ?? 0,
      inputCost: groupInputCost,
      outputCost: groupOutputCost,
      totalCost: groupInputCost + groupOutputCost,
    };
  };

  const sortByCost = (a: AiUsageGroup, b: AiUsageGroup) => b.totalCost - a.totalCost;

  return {
    period,
    since,
    summary: {
      calls: totals._count._all,
      inputTokens: summaryInputTokens,
      outputTokens: summaryOutputTokens,
      reasoningTokens: summaryReasoningTokens,
      menuOutputTokens: Math.max(0, summaryOutputTokens - summaryReasoningTokens),
      totalTokens: totals._sum.totalTokens ?? 0,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    },
    byOperation: byOperationRaw
      .map((row) => toGroup(row.operation, row._count._all, row._sum))
      .sort(sortByCost),
    byModel: byModelRaw
      .map((row) => toGroup(row.model, row._count._all, row._sum))
      .sort(sortByCost),
    recent: recentRaw.map((row) => {
      const rowInputCost = decimalToNumber(row.inputCost);
      const rowOutputCost = decimalToNumber(row.outputCost);
      return {
        id: row.id,
        createdAt: row.createdAt,
        operation: row.operation,
        model: row.model,
        language: row.language,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        reasoningTokens: row.reasoningTokens,
        menuOutputTokens: Math.max(0, row.outputTokens - row.reasoningTokens),
        cachedInputTokens: row.cachedInputTokens,
        totalTokens: row.totalTokens,
        inputCost: rowInputCost,
        outputCost: rowOutputCost,
        totalCost: rowInputCost + rowOutputCost,
        responseId: row.responseId,
      };
    }),
  };
}
