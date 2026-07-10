// import axios from 'axios';
import OpenAI from 'openai';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import jpManualReplace from '@/lib/manualTranslate';
import { getCCMenu, insertCCMenu, getSdxMenu, insertSdxMenu } from '@/lib/dbActions';
import { getCurrentWeekOf, getNextWeekOf } from '@/lib/dateFunctions';
import { recordAiTokenUsage, type AiOperation } from '@/lib/aiTokenUsage';

import { MenuResponse, Location, FilteredSodexoMeal, DayMenu, SdxSchemaObject } from '@/types/menuTypes';

const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini';

type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

type OpenAiModelConfig = {
  model: string;
  reasoningEffort: ReasoningEffort;
};

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

/** Pick model + reasoning effort by task and language. */
function selectOpenAiConfig(operation: AiOperation, language?: string): OpenAiModelConfig {
  const lang = normalizeLanguage(language);

  switch (operation) {
    case 'cc_pdf_parse':
      return { model: 'gpt-5-mini', reasoningEffort: 'medium' };

    case 'cc_translate':
    case 'sdx_translate':
    case 'sdx_translate_batch':
      switch (lang) {
        case 'Japanese':
          return { model: 'gpt-5.4-mini', reasoningEffort: 'low' };
        case 'Korean':
          return { model: 'gpt-5.4-mini', reasoningEffort: 'low' };
        case 'Chinese':
          return { model: 'gpt-5.4-mini', reasoningEffort: 'none' };
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

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ccJsonSchema = {
  name: 'day_menu_array',
  schema: {
    type: 'object',
    properties: {
      weekOne: {
        type: 'array',
        description: 'Array of daily menu objects (week 1).',
        items: {
          $ref: '#/$defs/day_menu',
        },
      },
      weekTwo: {
        type: 'array',
        description: 'Array of daily menu objects (week 2).',
        items: {
          $ref: '#/$defs/day_menu',
        },
      },
    },
    required: [
      'weekOne',
      'weekTwo',
    ],
    additionalProperties: false,
    $defs: {
      day_menu: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the day.',
          },
          plateLunch: {
            type: 'array',
            description: 'The list of plate lunch options from the given menu',
            items: {
              type: 'string',
            },
          },
          grabAndGo: {
            type: 'array',
            description: 'The list of grab and go options from the given menu',
            items: {
              type: 'string',
            },
          },
          specialMessage: {
            type: 'string',
            description: 'Any special message for the day if any.',
          },
        },
        required: [
          'name',
          'plateLunch',
          'grabAndGo',
          'specialMessage',
        ],
        additionalProperties: false,
      },
    },
  },
  strict: true,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sdxJsonSchemaOld = {
  name: 'menu',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'meal category',
      },
      groups: {
        type: 'array',
        description: 'groups with meal items',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              nullable: true,
              description: 'group name',
            },
            items: {
              type: 'array',
              description: 'menu items in group',
              items: {
                type: 'object',
                properties: {
                  course: {
                    type: 'string',
                    nullable: true,
                    description: 'Type or category of the meal',
                  },
                  meal: {
                    type: 'string',
                    description: 'The meal type (e.g., BREAKFAST, BRUNCH, LUNCH, DINNER).',
                  },
                  formalName: {
                    type: 'string',
                    description: 'item name',
                  },
                  description: {
                    type: 'string',
                    description: 'description of the item',
                  },
                  isVegan: {
                    type: 'boolean',
                    description: 'Indicates if the item is vegan.',
                  },
                  isVegetarian: {
                    type: 'boolean',
                    description: 'Indicates if the item is vegetarian.',
                  },
                },
                required: [
                  'course',
                  'meal',
                  'formalName',
                  'description',
                  'isVegan',
                  'isVegetarian',
                ],
                additionalProperties: false,
              },
            },
          },
          required: [
            'name',
            'items',
          ],
          additionalProperties: false,
        },
      },
    },
    required: [
      'name',
      'groups',
    ],
    additionalProperties: false,
  },
  strict: true,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sdxJsonSchemaOld2 = {
  name: 'sdx_menu',
  schema: {
    type: 'object',
    properties: {
      groups: {
        type: 'array',
        description: 'Array of groups',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of group',
            },
            items: {
              type: 'array',
              description: 'Items in meal group.',
              items: {
                type: 'object',
                properties: {
                  course: {
                    type: 'string',
                    description: 'course name (DO NOT TRANSLATE)',
                  },
                  meal: {
                    type: 'string',
                    description: 'Meal Type (DO NOT TRANSLATE)',
                  },
                  formalName: {
                    type: 'string',
                    description: 'Formal Name of Dish',
                  },
                  description: {
                    type: 'string',
                    description: 'Dish Description',
                  },
                  isVegan: {
                    type: 'boolean',
                    description: '',
                  },
                  isVegetarian: {
                    type: 'boolean',
                    description: '',
                  },
                },
                required: [
                  'course',
                  'meal',
                  'formalName',
                  'description',
                  'isVegan',
                  'isVegetarian',
                ],
                additionalProperties: false,
              },
            },
          },
          required: [
            'name',
            'items',
          ],
          additionalProperties: false,
        },
      },
    },
    required: [
      'groups',
    ],
    additionalProperties: false,
  },
  strict: true,
};

const sdxJsonSchema = {
  name: 'sdx_menu',
  schema: {
    type: 'object',
    properties: {
      schemaObject: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            groups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        meal: {
                          type: 'string',
                        },
                        course: {
                          type: [
                            'string',
                            'null',
                          ],
                        },
                        isVegan: {
                          type: 'boolean',
                        },
                        formalName: {
                          type: 'string',
                        },
                        description: {
                          type: 'string',
                        },
                        isVegetarian: {
                          type: 'boolean',
                        },
                      },
                      required: [
                        'meal',
                        'course',
                        'isVegan',
                        'formalName',
                        'description',
                        'isVegetarian',
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  'name',
                  'items',
                ],
                additionalProperties: false,
              },
            },
          },
          required: [
            'name',
            'groups',
          ],
          additionalProperties: false,
        },
      },
    },
    required: [
      'schemaObject',
    ],
    additionalProperties: false,
  },
  strict: true,
};

const sdxStringsJsonSchema = {
  name: 'sdx_string_translations',
  schema: {
    type: 'object',
    properties: {
      translations: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    required: [
      'translations',
    ],
    additionalProperties: false,
  },
  strict: true,
};

async function fetchOpenAI(
  prompt: string,
  option: Location,
  weeklyMenu: MenuResponse | FilteredSodexoMeal[],
  language: string,
  date: string,
): Promise<MenuResponse | SdxSchemaObject> {
  if (option === Location.CAMPUS_CENTER) {
    const nextWeekDate = getNextWeekOf();
    const [existingWeekOne, existingWeekTwo] = await Promise.all([
      getCCMenu(date, language),
      getCCMenu(nextWeekDate, language),
    ]);
    if (existingWeekOne) {
      const weekOneMenu = existingWeekOne.menu as unknown as DayMenu[];
      const weekTwoMenu = existingWeekTwo ? (existingWeekTwo.menu as unknown as DayMenu[]) : [];
      console.log(`Returning existing ${language} CC menu from DB for ${date}`);
      return { weekOne: weekOneMenu, weekTwo: weekTwoMenu } as MenuResponse;
    }
  } else {
    const existingMenu = await getSdxMenu(date, language, option);
    if (existingMenu) {
      const meals = existingMenu.menu as unknown as FilteredSodexoMeal[];
      console.log(`Returning existing ${language} ${option} menu from DB for ${date}`);
      return { schemaObject: meals } as SdxSchemaObject;
    }
  }

  const maxTokens = 10000;
  const jsonSchema = (option === Location.CAMPUS_CENTER) ? ccJsonSchema : sdxJsonSchema;
  const operation = option === Location.CAMPUS_CENTER ? 'cc_translate' : 'sdx_translate';
  const { model, reasoningEffort } = selectOpenAiConfig(operation, language);

  const response = await client.responses.create({
    model,
    reasoning: { effort: reasoningEffort },
    input: [
      { role: 'system', content: prompt },
      { role: 'user', content: `This week's menu: ${JSON.stringify(weeklyMenu)}` },
    ],
    text: {
      format: {
        type: 'json_schema',
        ...jsonSchema,
      },
    },
    max_output_tokens: maxTokens,
  });
  const rId = response.id;
  const rStatus = response.status;
  const rModel = response.model;
  console.log(
    `[OpenAI] id: ${rId}, status: ${rStatus}, model: ${rModel}, reasoning=${reasoningEffort}`,
  );
  console.log(`Total tokens used: ${response.usage?.total_tokens}`);

  await recordAiTokenUsage({
    operation,
    model: rModel || model,
    language,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    reasoningTokens: response.usage?.output_tokens_details?.reasoning_tokens ?? 0,
    cachedInputTokens: response.usage?.input_tokens_details?.cached_tokens ?? 0,
    totalTokens: response.usage?.total_tokens,
    responseId: rId,
  });

  if (response.status === 'incomplete') {
    console.error(`OpenAI response was incomplete (likely truncated). Increase max_output_tokens or reduce menu size.`);
    throw new Error('OpenAI response was incomplete – the translated menu was too long for the token limit.');
  }

  const content = response.output_text;
  if (content) {
    let parsed = JSON.parse(content);

    if (option === Location.CAMPUS_CENTER) {
      switch (language) {
        case 'Japanese':
          parsed = jpManualReplace(parsed);
          break;
        default:
          break;
      }

      const menuResp = parsed as MenuResponse;
      await insertCCMenu(menuResp.weekOne, option, language, date);
      if (menuResp.weekTwo && menuResp.weekTwo.length > 0) {
        await insertCCMenu(menuResp.weekTwo, option, language, getNextWeekOf());
      }
      console.log(`Inserted ${language} CC menu into DB for ${date}`);
      return menuResp;
    }

    const sdxResult = parsed as SdxSchemaObject;
    await insertSdxMenu(sdxResult.schemaObject, option, language, date);
    console.log(`Inserted ${language} ${option} menu into DB for ${date}`);
    return sdxResult;
  }
  throw new Error('Failed to parse the response from OpenAI');
}

const SDX_STRING_BATCH_SIZE = 40;
const SDX_STRING_MAX_ATTEMPTS = 2;

type SdxBatchUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  translations: string[];
};

async function translateSdxStringBatch(
  prompt: string,
  strings: string[],
  language: string,
  batchIndex: number,
  batchCount: number,
): Promise<SdxBatchUsage> {
  const maxTokens = Math.min(16000, 4000 + strings.length * 80);
  const { model, reasoningEffort } = selectOpenAiConfig('sdx_translate_batch', language);
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= SDX_STRING_MAX_ATTEMPTS; attempt += 1) {
    console.log(
      `[OpenAI SDX strings] Starting batch ${batchIndex + 1}/${batchCount} `
      + `(language=${language}, model=${model}, reasoning=${reasoningEffort}, `
      + `strings=${strings.length}, attempt=${attempt}/${SDX_STRING_MAX_ATTEMPTS}, `
      + `max_output_tokens=${maxTokens})`,
    );

    const response = await client.responses.create({
      model,
      reasoning: { effort: reasoningEffort },
      input: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: JSON.stringify({
            expectedCount: strings.length,
            strings,
          }),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          ...sdxStringsJsonSchema,
        },
      },
      max_output_tokens: maxTokens,
    });

    const batchInputTokens = response.usage?.input_tokens ?? 0;
    const batchOutputTokens = response.usage?.output_tokens ?? 0;
    const batchTotalTokens = response.usage?.total_tokens ?? batchInputTokens + batchOutputTokens;
    const cachedInputTokens = response.usage?.input_tokens_details?.cached_tokens ?? 0;
    const reasoningTokens = response.usage?.output_tokens_details?.reasoning_tokens ?? 0;

    inputTokens += batchInputTokens;
    outputTokens += batchOutputTokens;
    totalTokens += batchTotalTokens;

    await recordAiTokenUsage({
      operation: 'sdx_translate_batch',
      model: response.model || model,
      language,
      inputTokens: batchInputTokens,
      outputTokens: batchOutputTokens,
      reasoningTokens,
      cachedInputTokens,
      totalTokens: batchTotalTokens,
      responseId: response.id,
    });

    console.log(
      `[OpenAI SDX strings] Finished batch ${batchIndex + 1}/${batchCount} `
      + `(language=${language}, strings=${strings.length}, attempt=${attempt}, status=${response.status})`,
    );
    console.log(
      `[OpenAI SDX strings] Batch ${batchIndex + 1}/${batchCount} tokens: `
      + `input=${batchInputTokens}, output=${batchOutputTokens}, total=${batchTotalTokens}`
      + `, cached_input=${cachedInputTokens}`
      + `, reasoning=${reasoningTokens}`
      + ` | cumulative_input=${inputTokens}, cumulative_output=${outputTokens}, cumulative_total=${totalTokens}`,
    );

    if (response.status === 'incomplete') {
      console.error('OpenAI SDX string translation was incomplete.', {
        incompleteDetails: response.incomplete_details,
        usage: response.usage,
      });
      lastError = new Error(
        'OpenAI response was incomplete – the translated strings were too long for the token limit.',
      );
      continue;
    }

    const content = response.output_text;
    if (!content) {
      lastError = new Error('Failed to parse the SDX string translation response from OpenAI');
      continue;
    }

    let parsed: { translations: string[] };
    try {
      parsed = JSON.parse(content) as { translations: string[] };
    } catch {
      lastError = new Error('Failed to parse JSON from SDX string translation response');
      continue;
    }
    if (parsed.translations.length !== strings.length) {
      console.error(
        `[OpenAI SDX strings] Count mismatch on batch ${batchIndex + 1}/${batchCount}: `
        + `expected ${strings.length}, got ${parsed.translations.length}`,
      );
      lastError = new Error(
        `Translation count mismatch: expected ${strings.length}, got ${parsed.translations.length}`,
      );
      continue;
    }

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      translations: parsed.translations,
    };
  }

  throw lastError ?? new Error('Failed to translate SDX strings');
}

async function translateSdxStrings(
  prompt: string,
  strings: string[],
  language: string,
): Promise<string[]> {
  if (strings.length === 0) {
    return [];
  }

  const batches: string[][] = [];
  for (let i = 0; i < strings.length; i += SDX_STRING_BATCH_SIZE) {
    batches.push(strings.slice(i, i + SDX_STRING_BATCH_SIZE));
  }

  console.log(
    `[OpenAI SDX strings] Starting translation: language=${language}, `
    + `totalStrings=${strings.length}, batches=${batches.length}, batchSize=${SDX_STRING_BATCH_SIZE}`,
  );

  const translatedBatches = await Promise.all(
    batches.map((batch, index) => translateSdxStringBatch(
      prompt,
      batch,
      language,
      index,
      batches.length,
    )),
  );

  const inputTokens = translatedBatches.reduce((sum, batch) => sum + batch.inputTokens, 0);
  const outputTokens = translatedBatches.reduce((sum, batch) => sum + batch.outputTokens, 0);
  const totalTokens = translatedBatches.reduce((sum, batch) => sum + batch.totalTokens, 0);

  console.log(
    `[OpenAI SDX strings] Week translation complete: language=${language}, `
    + `batches=${batches.length}, strings=${strings.length}, `
    + `input=${inputTokens}, output=${outputTokens}, total=${totalTokens}`,
  );

  return translatedBatches.flatMap((batch) => batch.translations);
}

async function parseCCMenuFromPDF(pdfUrl: string): Promise<MenuResponse> {
  console.log(`Starting PDF parsing for URL: ${pdfUrl}`);

  const currentWeek = getCurrentWeekOf();
  const nextWeek = getNextWeekOf();
  const [existingMenu, existingWeekTwo] = await Promise.all([
    getCCMenu(currentWeek, 'English'),
    getCCMenu(nextWeek, 'English'),
  ]);
  if (existingMenu) {
    const weekOneMenu = existingMenu.menu as unknown as DayMenu[];
    const weekTwoMenu = existingWeekTwo ? (existingWeekTwo.menu as unknown as DayMenu[]) : [];
    console.log(`Returning existing English CC menu from DB for week ${currentWeek}`);
    return { weekOne: weekOneMenu, weekTwo: weekTwoMenu };
  }

  console.log(`Downloading PDF from: ${pdfUrl}`);
  const pdfResponse = await fetch(pdfUrl);
  if (!pdfResponse.ok) {
    throw new Error(`Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
  }
  let menuText = '';

  try {
    const { PDFParse } = await import('pdf-parse');
    const workerPath = path.join(
      process.cwd(),
      'node_modules',
      'pdf-parse',
      'dist',
      'pdf-parse',
      'esm',
      'pdf.worker.mjs',
    );
    PDFParse.setWorker(pathToFileURL(workerPath).toString());

    const pdfData = new Uint8Array(await pdfResponse.arrayBuffer());
    const parser = new PDFParse({ data: pdfData });
    const textResult = await parser.getText();
    await parser.destroy();

    menuText = textResult.text;
    console.log(`Extracted ${menuText.length} chars from PDF (${textResult.total} pages)`);
  } catch (pdfExtractError) {
    console.warn(`Local PDF extraction failed, falling back to file_url input: ${pdfExtractError}`);
  }

  const promptText = `You are a menu parser.
Analyze this Campus Center menu text (extracted from a PDF) and extract the menu items into the specified JSON format.

The menu should be organized by days (Monday through Friday) and include:
- plateLunch: Array of plate lunch options for each day
- grabAndGo: Array of grab and go options for each day
- specialMessage: Any special messages or notices for days when the cafeteria might be closed

Look for patterns like:
- Days of the week (Monday, Tuesday, Wednesday, Thursday, Friday)
- Plate lunch items (usually marked with bullets •)
- Grab and go items
- Value bowls and mini/value options
- Special messages about closures or holidays

The menu may span 1-2 weeks. Extract weekOne (first 5 days) and weekTwo (next 5 days if present, empty array if not).

Return the data in the exact JSON schema format specified.`;

  const { model, reasoningEffort } = selectOpenAiConfig('cc_pdf_parse', 'English');
  const maxTokens = 12000;

  const response = await client.responses.create({
    model,
    reasoning: { effort: reasoningEffort },
    input: [
      { role: 'system', content: promptText },
      {
        role: 'user',
        content: menuText.length > 0
          ? `Here is the menu text extracted from the PDF:\n\n${menuText}`
          : [
            {
              type: 'input_text',
              text: 'Local PDF text extraction failed. Parse this PDF directly and return the structured menu.',
            },
            {
              type: 'input_file',
              file_url: pdfUrl,
            },
          ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        ...ccJsonSchema,
      },
    },
    max_output_tokens: maxTokens,
  });

  const reasoningTokens = response.usage?.output_tokens_details?.reasoning_tokens ?? 0;
  console.log(
    `Total tokens used for PDF parsing: ${response.usage?.total_tokens} `
    + `(model=${response.model || model}, reasoning=${reasoningEffort}, `
    + `status=${response.status}, reasoning_tokens=${reasoningTokens})`,
  );

  await recordAiTokenUsage({
    operation: 'cc_pdf_parse',
    model: response.model || model,
    language: 'English',
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    reasoningTokens,
    cachedInputTokens: response.usage?.input_tokens_details?.cached_tokens ?? 0,
    totalTokens: response.usage?.total_tokens,
    responseId: response.id,
  });

  if (response.status === 'incomplete') {
    console.error('OpenAI PDF parse was incomplete.', {
      incompleteDetails: response.incomplete_details,
      usage: response.usage,
    });
    throw new Error(
      'OpenAI PDF parse was incomplete – increase max_output_tokens or lower reasoning effort.',
    );
  }

  const content = response.output_text;
  if (!content) {
    throw new Error('Failed to parse CC menu from PDF using OpenAI (empty response)');
  }

  let parsed: MenuResponse;
  try {
    parsed = JSON.parse(content) as MenuResponse;
  } catch (parseError) {
    console.error('Failed to parse CC PDF JSON. Preview:', content.slice(0, 500));
    throw new Error(
      `Failed to parse CC menu JSON from OpenAI: `
      + `${parseError instanceof Error ? parseError.message : String(parseError)}`,
    );
  }

  await insertCCMenu(parsed.weekOne, Location.CAMPUS_CENTER, 'English', currentWeek);
  if (parsed.weekTwo && parsed.weekTwo.length > 0) {
    await insertCCMenu(parsed.weekTwo, Location.CAMPUS_CENTER, 'English', getNextWeekOf());
  }
  console.log(`Inserted English CC menu into DB for week ${currentWeek}`);

  return parsed;
}

export { parseCCMenuFromPDF, translateSdxStrings };
export default fetchOpenAI;
