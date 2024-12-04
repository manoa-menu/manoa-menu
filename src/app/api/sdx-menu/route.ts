import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { SodexoMeal, FilteredSodexoMeal } from '@/types/menuTypes';

const now = new Date();
const formattedDate = now.toISOString().split('T')[0];

const removeNutritionalFacts = (rootObject: SodexoMeal): FilteredSodexoMeal => ({
  name: rootObject.name,
  groups: rootObject.groups.map(group => ({
    ...group,
    items: group.items.map(item => {
      const {
        isMindful, isSwell, calories, caloriesFromFat, fat,
        saturatedFat, transFat, polyunsaturatedFat, cholesterol,
        sodium, carbohydrates, dietaryFiber, sugar, protein,
        potassium, iron, calcium, vitaminA, vitaminC,
        ...rest
      } = item;
      return rest;
    }),
  })),
});

// eslint-disable-next-line import/prefer-default-export
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const date = searchParams.get('date') || formattedDate;
  // const language = searchParams.get('language') || 'English';
  // const location = searchParams.get('location') || '';

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Expected yyyy-mm-dd' }, { status: 400 });
  }
  const url = process.env.GW_API_URL;
  const apiKey = process.env.MMR_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const queryUrl = `${url}?date=${date}`;

  const headers = {
    'API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const response = await axios.get(queryUrl, { headers });
    // eslint-disable-next-line prefer-destructuring
    const data: SodexoMeal = response.data[0];
    const filteredData: FilteredSodexoMeal = removeNutritionalFacts(data);
    return NextResponse.json(filteredData);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data || error.message },
        { status: error.response?.status || 500 },
      );
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
