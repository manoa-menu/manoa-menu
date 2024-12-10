// import axios from 'axios';
import OpenAI from 'openai';

import jpManualReplace from '@/lib/manualTranslate';

import { MenuResponse, Location, FilteredSodexoMeal, SdxSchemaObject } from '@/types/menuTypes';

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
): Promise<MenuResponse | SdxSchemaObject> {
  const maxTokens = (option === Location.CAMPUS_CENTER) ? 2000 : 4096;
  const chatCompletion = await client.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `This week's menu: ${JSON.stringify(weeklyMenu)}` },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: (option === Location.CAMPUS_CENTER) ? ccJsonSchema : sdxJsonSchema,
    },
    temperature: 0.1,
    max_tokens: maxTokens,
  });
  console.log(`Total tokens used: ${chatCompletion.usage?.total_tokens}`);

  if (chatCompletion.choices[0].message.parsed) {
    const response = chatCompletion.choices[0].message.parsed;

    if (option === Location.CAMPUS_CENTER) {
      switch (language) {
        case 'Japanese':
          return jpManualReplace(response);
          // case 'Korean':
          //   return krManualReplace(response);
          // case 'Spanish':
          //   return esManualReplace(response);
        default:
          return JSON.parse(JSON.stringify(response));
      }
    }
    return JSON.parse(JSON.stringify(response));
  }
  if (chatCompletion.choices[0].message.content) {
    const response = chatCompletion.choices[0].message.content;

    return JSON.parse(response);
  }
  throw new Error('Failed to parse the response from OpenAI');
}

export default fetchOpenAI;
