// import axios from 'axios';
import OpenAI from 'openai';

import jpManualReplace from '@/lib/manualTranslate';
import { getCCMenu, insertCCMenu, getSdxMenu, insertSdxMenu } from '@/lib/dbActions';
import { getCurrentWeekOf, getNextWeekOf } from '@/lib/dateFunctions';

import { MenuResponse, Location, FilteredSodexoMeal, DayMenu, SdxSchemaObject } from '@/types/menuTypes';

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
                          type: 'string',
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
                    },
                  },
                },
                required: [
                  'items',
                ],
              },
            },
          },
          required: [
            'name',
            'groups',
          ],
        },
      },
    },
    required: [
      'meals',
    ],
  },
};

async function fetchOpenAI(
  prompt: string,
  option: Location,
  weeklyMenu: MenuResponse | FilteredSodexoMeal[],
  language: string,
  date: string,
): Promise<MenuResponse | SdxSchemaObject> {
  // --- Check if the translated menu already exists in the DB ---
  if (option === Location.CAMPUS_CENTER) {
    const existingWeekOne = await getCCMenu(date, language);
    if (existingWeekOne) {
      const weekOneMenu: DayMenu[] = JSON.parse(JSON.stringify(existingWeekOne.menu));
      const nextWeekDate = getNextWeekOf();
      const existingWeekTwo = await getCCMenu(nextWeekDate, language);
      const weekTwoMenu: DayMenu[] = existingWeekTwo ? JSON.parse(JSON.stringify(existingWeekTwo.menu)) : [];
      console.log(`Returning existing ${language} CC menu from DB for ${date}`);
      return { weekOne: weekOneMenu, weekTwo: weekTwoMenu } as MenuResponse;
    }
  } else {
    // SDX locations (Gateway / Hale Aloha)
    const existingMenu = await getSdxMenu(date, language, option);
    if (existingMenu) {
      const meals: FilteredSodexoMeal[] = existingMenu.menu as unknown as FilteredSodexoMeal[];
      console.log(`Returning existing ${language} ${option} menu from DB for ${date}`);
      return { schemaObject: meals } as SdxSchemaObject;
    }
  }

  // --- No cached menu found, call OpenAI ---
  const maxTokens = 8000;
  const jsonSchema = (option === Location.CAMPUS_CENTER) ? ccJsonSchema : sdxJsonSchema;

  const response = await client.responses.create({
    model: 'gpt-5-mini',
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
  console.log(`[OpenAI] id: ${rId}, status: ${rStatus}, model: ${rModel}`);
  console.log(`Total tokens used: ${response.usage?.total_tokens}`);

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

      // Insert the translated CC menu into the DB
      const menuResp = parsed as MenuResponse;
      await insertCCMenu(menuResp.weekOne, option, language, date);
      if (menuResp.weekTwo && menuResp.weekTwo.length > 0) {
        await insertCCMenu(menuResp.weekTwo, option, language, getNextWeekOf());
      }
      console.log(`Inserted ${language} CC menu into DB for ${date}`);
      return menuResp;
    }

    // SDX locations – insert the translated menu into the DB
    const sdxResult = parsed as SdxSchemaObject;
    await insertSdxMenu(sdxResult.schemaObject, option, language, date);
    console.log(`Inserted ${language} ${option} menu into DB for ${date}`);
    return sdxResult;
  }
  throw new Error('Failed to parse the response from OpenAI');
}

async function parseCCMenuFromPDF(pdfUrl: string): Promise<MenuResponse> {
  console.log(`Starting PDF parsing for URL: ${pdfUrl}`);

  // --- Check if the English CC menu for this week already exists in the DB ---
  const currentWeek = getCurrentWeekOf();
  const existingMenu = await getCCMenu(currentWeek, 'English');
  if (existingMenu) {
    const weekOneMenu: DayMenu[] = JSON.parse(JSON.stringify(existingMenu.menu));
    const nextWeek = getNextWeekOf();
    const existingWeekTwo = await getCCMenu(nextWeek, 'English');
    const weekTwoMenu: DayMenu[] = existingWeekTwo ? JSON.parse(JSON.stringify(existingWeekTwo.menu)) : [];
    console.log(`Returning existing English CC menu from DB for week ${currentWeek}`);
    return { weekOne: weekOneMenu, weekTwo: weekTwoMenu };
  }

  // --- No cached menu found, call OpenAI to parse the PDF ---
  const promptText = `You are a menu parser. 
Analyze this Campus Center menu PDF and extract the menu items into the specified JSON format.

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

  // Use OpenAI file input API — pass the PDF URL directly, no download needed
  const response = await client.responses.create({
    model: 'gpt-5-mini',
    input: [
      { role: 'system', content: promptText },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Please parse this Campus Center menu PDF and return the structured data.',
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
    max_output_tokens: 2000,
  });

  console.log(`Total tokens used for PDF parsing: ${response.usage?.total_tokens}`);

  const content = response.output_text;
  if (content) {
    const parsed: MenuResponse = JSON.parse(content);

    // Insert the parsed English menu into the DB
    await insertCCMenu(parsed.weekOne, Location.CAMPUS_CENTER, 'English', currentWeek);
    if (parsed.weekTwo && parsed.weekTwo.length > 0) {
      await insertCCMenu(parsed.weekTwo, Location.CAMPUS_CENTER, 'English', getNextWeekOf());
    }
    console.log(`Inserted English CC menu into DB for week ${currentWeek}`);

    return parsed;
  }

  throw new Error('Failed to parse CC menu from PDF using OpenAI');
}

export { parseCCMenuFromPDF };
export default fetchOpenAI;
