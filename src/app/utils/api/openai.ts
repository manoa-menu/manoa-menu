// import axios from 'axios';
import OpenAI from 'openai';

import jpManualReplace from '@/lib/manualTranslate';

import { MenuResponse, Location, FilteredSodexoMeal } from '@/types/menuTypes';

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
                    description: 'course name',
                  },
                  meal: {
                    type: 'string',
                    description: 'Meal Type',
                  },
                  formalName: {
                    type: 'string',
                    description: 'Formal Fame of Dish',
                  },
                  description: {
                    type: 'string',
                    description: 'Dish Description',
                  },
                  price: {
                    type: 'number',
                    description: 'Dish Price',
                  },
                  allergens: {
                    type: 'array',
                    description: 'Dish Allergens List',
                    items: {
                      type: 'object',
                      properties: {
                        allergen: {
                          type: 'integer',
                          description: 'Allergen ID',
                        },
                        name: {
                          type: 'string',
                          description: 'Allergen Name',
                        },
                      },
                      required: [
                        'allergen',
                        'name',
                      ],
                      additionalProperties: false,
                    },
                  },
                  sizes: {
                    type: 'array',
                    description: 'Available sizes',
                    items: {
                      type: 'string',
                    },
                  },
                  addons: {
                    type: 'array',
                    description: 'Add-ons available',
                    items: {
                      type: 'string',
                    },
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
                  'price',
                  'allergens',
                  'sizes',
                  'addons',
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
  name: 'menu',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the meal category.',
      },
      groups: {
        type: 'array',
        description: 'A collection of groups that contain meal items.',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              nullable: true,
              description: 'The name of the group.',
            },
            items: {
              type: 'array',
              description: 'List of menu items in this group.',
              items: {
                type: 'object',
                properties: {
                  course: {
                    type: 'string',
                    nullable: true,
                    description: 'Type or category of the meal.',
                  },
                  meal: {
                    type: 'string',
                    description: 'The meal type (e.g., BREAKFAST, LUNCH).',
                  },
                  formalName: {
                    type: 'string',
                    description: 'The official name of the menu item.',
                  },
                  description: {
                    type: 'string',
                    description: 'A brief description of the menu item.',
                  },
                  price: {
                    type: 'number',
                    description: 'The price of the menu item.',
                  },
                  allergens: {
                    type: 'array',
                    description: 'List of allergens associated with this item.',
                    items: {
                      type: 'object',
                      properties: {
                        allergen: {
                          type: 'number',
                          description: 'The allergen identifier.',
                        },
                        name: {
                          type: 'string',
                          description: 'The name of the allergen.',
                        },
                      },
                      required: [
                        'allergen',
                        'name',
                      ],
                      additionalProperties: false,
                    },
                  },
                  sizes: {
                    type: 'array',
                    description: 'Available sizes for the menu item.',
                    items: {
                      type: 'string',
                    },
                  },
                  addons: {
                    type: 'array',
                    description: 'Available add-ons for the menu item.',
                    items: {
                      type: 'string',
                    },
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
                  'price',
                  'allergens',
                  'sizes',
                  'addons',
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

async function fetchOpenAI(
  prompt: string,
  option: Location,
  weeklyMenu: MenuResponse,
  language: string,
  sdxoMenu: FilteredSodexoMeal[] = [],
): Promise<MenuResponse> {
  const maxTokens = (option === Location.CAMPUS_CENTER) ? 2000 : 3000;
  const menuToTranslate = ((weeklyMenu.weekOne.length === 0) && (sdxoMenu.length === 0)) ? weeklyMenu : sdxoMenu;
  const chatCompletion = await client.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `This week's menu: ${JSON.stringify(menuToTranslate)}` },
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

    switch (language) {
      case 'Japanese':
        return jpManualReplace(response);
      // case 'Korean':
      //   return krManualReplace(response);
      // case 'Spanish':
      //   return esManualReplace(response);
      default:
        return JSON.parse(response);
    }
  }
  if (chatCompletion.choices[0].message.content) {
    const response = chatCompletion.choices[0].message.content;

    return JSON.parse(response);
  }
  throw new Error('Failed to parse the response from OpenAI');
}

export default fetchOpenAI;
