import { prisma } from '@/lib/prisma';

/** USD per 1M tokens by model id. */
type ModelPricing = {
  input: number;
  cached_input: number | null;
  cache_writes: number | null;
  output: number;
};

const OPENAI_MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-5.6-sol': { input: 5.0, cached_input: 0.5, cache_writes: 6.25, output: 30.0 },
  'gpt-5.6-terra': { input: 2.5, cached_input: 0.25, cache_writes: 3.125, output: 15.0 },
  'gpt-5.6-luna': { input: 1.0, cached_input: 0.1, cache_writes: 1.25, output: 6.0 },
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

export type AiOperation =
  | 'cc_pdf_parse'
  | 'cc_translate'
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
  if (OPENAI_MODEL_PRICING[model]) {
    return OPENAI_MODEL_PRICING[model];
  }

  const keys = Object.keys(OPENAI_MODEL_PRICING).sort((a, b) => b.length - a.length);
  const match = keys.find((key) => model === key || model.startsWith(`${key}-`));
  return match ? OPENAI_MODEL_PRICING[match] : null;
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
