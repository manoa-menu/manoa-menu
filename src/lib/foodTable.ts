import { PrismaClient } from '@prisma/client';

const SerpApi = require('google-search-results-nodejs');

const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);
const prisma = new PrismaClient();

interface FoodItem {
  name: string;
  label: string[];
}

interface FoodTableEntry {
  name: string;
  url: string;
  label: string[];
  translation: string[];
}

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

async function fetchImageUrl(foodName: string) {
  return new Promise((resolve, reject) => {
    try {
      search.json(
        {
          q: foodName,
          tbm: 'isch',
          num: 10,
        },
        (result: any) => {
          if (result.images_results && result.images_results.length > 0) {
            const filterHttps = result.images_results.filter((image: any) => image.original.startsWith('https://'));

            if (filterHttps.length > 0) {
              resolve(result.images_results[0].original || null);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        },
      );
    } catch (error) {
      reject(error);
    }
  });
}

export default async function populateFoodTableFromMenu(parsedMenu: DayMenu[]): Promise<void> {
  try {
    const phrasesToRemove = ['Value Bowl:'];
    const phrasesToExclude = ['Mixed Plate:', 'Mini or Bowl:', 'Any Two (2) Choices', 'Any One (1) Entree'];

    const foodData = parsedMenu.flatMap((day) => {
      const combinedFoodItems = [
        ...(day.grabAndGo || []).map((item) => ({ name: item, label: ['grabAndGo'] })),
        ...(day.plateLunch || []).map((item) => ({ name: item, label: ['plateLunch'] })),
      ];

      return combinedFoodItems
        .map(({ name, label }) => {
          let cleanedName = name;

          // Remove unwanted phrases and adjust labels
          phrasesToRemove.forEach((phrase) => {
            if (name.includes(phrase)) {
              cleanedName = name.replace(phrase, '').trim();
              label.push(phrase.replace(':', '').trim());
            }
          });

          return { name: cleanedName, label };
        })
        .filter(({ name }) => !phrasesToExclude.some((phrase) => name.includes(phrase)));
    });

    // Deduplicate and prepare unique entries
    const uniqueFoodData = Array.from(
      new Map(foodData.map((item) => [JSON.stringify({ name: item.name, label: item.label }), item])).values(),
    ).map(({ name, label }) => ({
      name,
      url: '',
      label,
      translation: [],
      likes: 0,
    }));

    // Check existing records in the database
    const existingFoodItems = await prisma.foodTable.findMany({
      where: {
        name: {
          in: uniqueFoodData.map((item) => item.name),
        },
      },
      select: { name: true, url: true },
    });

    // Determine which items are new or need an image URL update
    const existingNamesWithUrls = new Map(existingFoodItems.map((item) => [item.name, item.url]));

    const itemsToUpdate = uniqueFoodData.filter((item) => {
      const existingUrl = existingNamesWithUrls.get(item.name);
      return !existingUrl; // Update only items with an empty URL
    });

    if (itemsToUpdate.length > 0) {
      // Fetch image URLs concurrently
      const updatedFoodData = await Promise.all(
        itemsToUpdate.map(async (item) => {
          const imageUrl = await fetchImageUrl(item.name);
          return { ...item, url: typeof imageUrl === 'string' ? imageUrl : '' };
        }),
      );

      // Insert or update food items in the database
      await Promise.all(
        updatedFoodData.map(async (item) => {
          await prisma.foodTable.upsert({
            where: { name: item.name },
            update: { url: item.url },
            create: {
              name: item.name,
              url: item.url,
              label: item.label,
              translation: item.translation,
            },
          });
        }),
      );
      console.log(`Inserted or updated ${updatedFoodData.length} items in FoodTable with image URLs.`);
    } else {
      console.log('No new items to insert into FoodTable.');
    }
  } catch (error) {
    console.error('Error populating FoodTable:', error);
    throw new Error('Error populating FoodTable');
  } finally {
    await prisma.$disconnect();
  }
}

export async function favoriteItems(userId: number): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { favorites: true },
    });
    return user?.favorites ?? []; // Return the favorite array or an empty array if not found
  } catch (error) {
    console.error('Error fetching favorite items:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export async function getFoodTable() {
  try {
    return await prisma.foodTable.findMany({});
  } catch (error) {
    console.error('Error fetching FoodTable:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// ONLY FOR TESTING PURPOSES
export async function populateFoodTableFromMenuId(menuId: number) {
  try {
    // Fetch the specific menu row by ID
    const menu = await prisma.campusCenterMenus.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      console.error(`No menu found with id: ${menuId}`);
      return;
    }

    // Safely parse the menu data
    let menuItems;
    try {
      menuItems = typeof menu.menu === 'string' ? JSON.parse(menu.menu) : menu.menu;
    } catch (error) {
      console.error('Invalid menu data:', menu.menu);
      return;
    }

    const phrasesToRemove = ['Value Bowl:'];
    const phrasesToExclude = ['Mixed Plate:', 'Mini or Bowl:', 'Any Two (2) Choices', 'Any One (1) Entree'];

    const foodData: FoodItem[] = menuItems.flatMap((day: { grabAndGo: string[]; plateLunch: string[] }) => {
      const combinedFoodItems: FoodItem[] = [
        ...(day.grabAndGo || []).map((item: string) => ({ name: item, label: ['grabAndGo'] })),
        ...(day.plateLunch || []).map((item: string) => ({ name: item, label: ['plateLunch'] })),
      ];

      return combinedFoodItems
        .map(({ name, label }) => {
          let cleanedName = name;

          // Check and add labels based on the phrase
          phrasesToRemove.forEach((phrase) => {
            if (name.includes(phrase)) {
              cleanedName = name.replace(phrase, '').trim();
              label.push(phrase.replace(':', '').trim());
            }
          });

          return { name: cleanedName, label };
        })
        .filter(({ name }) => !phrasesToExclude.some((phrase) => name.includes(phrase)));
    });

    // Deduplicate by `name` and `label`
    const uniqueFoodData: FoodTableEntry[] = Array.from(
      new Map(foodData.map((item) => [JSON.stringify({ name: item.name, label: item.label }), item])).values(),
    ).map(({ name, label }) => ({
      name,
      url: '',
      label,
      translation: [],
    }));

    // Filter out items already in the database
    const existingFoodItems = await prisma.foodTable.findMany({
      where: {
        name: {
          in: uniqueFoodData.map((item) => item.name),
        },
      },
      select: { name: true, url: true },
    });

    // Determine which items are new or need an image URL update
    const existingNamesWithUrls = new Map(existingFoodItems.map((item) => [item.name, item.url]));

    const itemsToUpdate = uniqueFoodData.filter((item) => {
      const existingUrl = existingNamesWithUrls.get(item.name);
      return !existingUrl; // Update only items with an empty URL
    });

    if (itemsToUpdate.length > 0) {
      // Fetch image URLs concurrently
      const updatedFoodData = await Promise.all(
        itemsToUpdate.map(async (item) => {
          const imageUrl = await fetchImageUrl(item.name);
          return { ...item, url: typeof imageUrl === 'string' ? imageUrl : '' };
        }),
      );

      // Insert or update food items in the database
      await Promise.all(
        updatedFoodData.map(async (item) => {
          await prisma.foodTable.upsert({
            where: { name: item.name },
            update: { url: item.url },
            create: {
              name: item.name,
              url: item.url,
              label: item.label,
              translation: item.translation,
            },
          });
        }),
      );
      console.log(`Inserted or updated ${updatedFoodData.length} items in FoodTable with image URLs.`);
    } else {
      console.log(`No new items to insert for menu ID ${menuId}.`);
    }
  } catch (error) {
    console.error('Error populating FoodTable:', error);
    throw new Error('Error populating FoodTable');
  } finally {
    await prisma.$disconnect();
  }
}
