// import axios from 'axios';
// eslint-disable-next-line import/no-extraneous-dependencies
import OpenAI from 'openai';

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

interface MenuResponse {
  day_menus: DayMenu[];
}

export enum Option {
  CC = 'CAMPUS_CENTER',
  GW = 'GATEWAY',
  HA = 'HALE_ALOHA',
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// eslint-disable-next-line max-len
async function fetchOpenAI(option: Option, weeklyMenu: DayMenu[], language: string, country: string): Promise<MenuResponse> {
  const prompt = `You will translate all menu items into ${language}. 
  They do not have to be exact, but they should be close enough to be understood by ${language} people.
  In parenthesis provide a brief description of dish contents in ${language}
  for foods that are local to Hawaii.
  or foods that people from ${country} may not be familiar with,
  or foods that are not self-explanatory (Have a lot of ingredients in the name).
  Must describe pasta dishes, special salads, non-famous American dishes, and foreign asian dishes.
  Do not add or create new items that are not on the menu.
  If there is a special message, provide a translation in ${language}.`;

  const chatCompletion = await client.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `This week's menu: ${JSON.stringify(weeklyMenu)}` },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'day_menu_array',
        schema: {
          type: 'object',
          properties: {
            day_menus: {
              type: 'array',
              description: 'An array of daily menu objects.',
              items: {
                $ref: '#/$defs/day_menu',
              },
            },
          },
          required: [
            'day_menus',
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
                  description: 'Any special message or announcement for the day if any.',
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
      },
    },
    temperature: 1,
    max_tokens: 1500,
  });
  console.log(`Total tokens used: ${chatCompletion.usage?.total_tokens}`);
  if (chatCompletion.choices[0].message.parsed) {
    return chatCompletion.choices[0].message.parsed;
  }
  if (chatCompletion.choices[0].message.content) {
    return JSON.parse(chatCompletion.choices[0].message.content);
  }
  throw new Error('Failed to parse the response from OpenAI');
}

export default fetchOpenAI;
