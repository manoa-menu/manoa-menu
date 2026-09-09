import {
  getOpenRouterChatCompletionsUrl,
  getOpenRouterHeaders,
  type ReasoningEffort,
} from '@/lib/aiProvider';

export type JsonSchemaFormat = {
  name: string;
  strict: boolean;
  schema: object;
};

export type OpenRouterPdfParseResult = {
  content: string;
  model: string;
  responseId?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens: number;
  cachedInputTokens: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function pdfFilenameFromUrl(pdfUrl: string): string {
  try {
    const base = new URL(pdfUrl).pathname.split('/').pop() ?? 'menu.pdf';
    return decodeURIComponent(base) || 'menu.pdf';
  } catch {
    return 'menu.pdf';
  }
}

export function pdfBytesToDataUrl(pdfBytes: Uint8Array): string {
  return `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;
}

export function buildOpenRouterPdfParseBody(args: {
  model: string;
  reasoningEffort: ReasoningEffort;
  prompt: string;
  userText: string;
  fileData: string;
  filename: string;
  jsonSchema: JsonSchemaFormat;
  maxTokens: number;
}): Record<string, unknown> {
  return {
    model: args.model,
    reasoning: { effort: args.reasoningEffort },
    max_tokens: args.maxTokens,
    messages: [
      { role: 'system', content: args.prompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: args.userText },
          {
            type: 'file',
            file: {
              filename: args.filename,
              file_data: args.fileData,
            },
          },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: args.jsonSchema.name,
        strict: args.jsonSchema.strict,
        schema: args.jsonSchema.schema,
      },
    },
  };
}

function readFiniteNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function nestedRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function chatMessageText(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }
  return content.map((part) => {
    if (isRecord(part) && typeof part.text === 'string') {
      return part.text;
    }
    return '';
  }).join('');
}

function parseOpenRouterChatResponse(payload: unknown): OpenRouterPdfParseResult {
  if (!isRecord(payload)) {
    throw new Error('OpenRouter PDF parse returned a non-object response.');
  }
  if (isRecord(payload.error)) {
    const message = typeof payload.error.message === 'string'
      ? payload.error.message
      : JSON.stringify(payload.error);
    throw new Error(`OpenRouter PDF parse failed: ${message}`);
  }

  const choices = payload.choices;
  const firstChoice = Array.isArray(choices) && isRecord(choices[0]) ? choices[0] : null;
  const message = firstChoice && isRecord(firstChoice.message) ? firstChoice.message : null;
  const content = chatMessageText(message?.content);
  if (!content) {
    throw new Error('OpenRouter PDF parse returned an empty message.');
  }

  const usage = nestedRecord(payload, 'usage');
  const promptDetails = usage ? nestedRecord(usage, 'prompt_tokens_details') : null;
  const completionDetails = usage ? nestedRecord(usage, 'completion_tokens_details') : null;
  const inputTokens = usage ? readFiniteNumber(usage, 'prompt_tokens') : 0;
  const outputTokens = usage ? readFiniteNumber(usage, 'completion_tokens') : 0;

  return {
    content,
    model: typeof payload.model === 'string' ? payload.model : '',
    responseId: typeof payload.id === 'string' ? payload.id : undefined,
    inputTokens,
    outputTokens,
    totalTokens: usage ? readFiniteNumber(usage, 'total_tokens') : inputTokens + outputTokens,
    reasoningTokens: completionDetails ? readFiniteNumber(completionDetails, 'reasoning_tokens') : 0,
    cachedInputTokens: promptDetails ? readFiniteNumber(promptDetails, 'cached_tokens') : 0,
  };
}

export async function parsePdfWithOpenRouter(args: {
  model: string;
  reasoningEffort: ReasoningEffort;
  prompt: string;
  pdfUrl: string;
  pdfBytes: Uint8Array;
  jsonSchema: JsonSchemaFormat;
  maxTokens: number;
}): Promise<OpenRouterPdfParseResult> {
  const body = buildOpenRouterPdfParseBody({
    model: args.model,
    reasoningEffort: args.reasoningEffort,
    prompt: args.prompt,
    userText: 'Parse this Campus Center menu PDF and return the structured menu JSON.',
    fileData: pdfBytesToDataUrl(args.pdfBytes),
    filename: pdfFilenameFromUrl(args.pdfUrl),
    jsonSchema: args.jsonSchema,
    maxTokens: args.maxTokens,
  });

  const response = await fetch(getOpenRouterChatCompletionsUrl(), {
    method: 'POST',
    headers: getOpenRouterHeaders(),
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error(
      `OpenRouter PDF parse returned non-JSON (${response.status}): ${rawText.slice(0, 300)}`,
    );
  }

  if (!response.ok) {
    const errorMessage = isRecord(payload) && isRecord(payload.error)
      && typeof payload.error.message === 'string'
      ? payload.error.message
      : rawText.slice(0, 300);
    throw new Error(`OpenRouter PDF parse HTTP ${response.status}: ${errorMessage}`);
  }

  return parseOpenRouterChatResponse(payload);
}
