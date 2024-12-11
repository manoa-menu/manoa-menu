/* eslint-disable operator-linebreak */
import { PrismaClient } from '@prisma/client';
import { FilteredSodexoMeal } from '@/types/menuTypes';
// import assignLabels from './assignLabel';

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

function extractFormalNames(menuData: FilteredSodexoMeal[]): string[] {
  const formalNames: string[] = [];

  menuData.forEach((menu) => {
    menu.groups.forEach((group) => {
      group.items.forEach((item) => {
        formalNames.push(item.formalName);
      });
    });
  });

  return formalNames;
}

// Get the entire food table
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

// Get user's favorite items
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

// Add a new favorite item
export async function addFavoriteItem(userId: number, foodName: string): Promise<boolean> {
  try {
    // Fetch the user's current favorites
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { favorites: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if the item already exists in the favorites
    if (user.favorites.includes(foodName)) {
      return false;
    }

    // Add the new item to the favorites
    await prisma.user.update({
      where: { id: userId },
      data: {
        favorites: {
          push: foodName,
        },
      },
    });
    await prisma.foodTable.update({
      where: { name: foodName },
      data: {
        likes: {
          increment: 1,
        },
      },
    });
    return true;
  } catch (error) {
    console.error('Error adding favorite item:', error);
    throw new Error('Error adding favorite item');
  } finally {
    await prisma.$disconnect();
  }
}

// Remove a favorite item
export async function removeFavoriteItem(userId: number, foodName: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { favorites: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If item is not in the favorites, return false
    if (!user.favorites.includes(foodName)) {
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        favorites: {
          set: user.favorites.filter((favorite) => favorite !== foodName),
        },
      },
    });

    await prisma.foodTable.update({
      where: { name: foodName },
      data: {
        likes: {
          decrement: 1,
        },
      },
    });
    return true;
  } catch (error) {
    console.error('Error removing favorite item:', error);
    throw new Error('Error removing favorite item');
  } finally {
    await prisma.$disconnect();
  }
}

// Fetch image URLs from the SERP API
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

export async function foodTableBaseFunction(uniqueFoodData: FoodTableEntry[], menuId: number) {
  try {
    // Filter out items already in the database
    const existingFoodItems = await prisma.foodTable.findMany({
      where: {
        name: {
          in: uniqueFoodData.map((item) => item.name),
        },
      },
      select: { name: true, url: true, label: true, translation: true },
    });

    // Determine which items need label or translation updates
    const itemsToUpdateLabelsOrTranslations = uniqueFoodData.filter((item) => {
      const existingItem = existingFoodItems.find((existing) => existing.name === item.name);
      return (
        existingItem &&
        (JSON.stringify(existingItem.label) !== JSON.stringify(item.label) ||
          JSON.stringify(existingItem.translation) !== JSON.stringify(item.translation))
      );
    });

    // Update items with new labels or translations
    if (itemsToUpdateLabelsOrTranslations.length > 0) {
      await Promise.all(
        itemsToUpdateLabelsOrTranslations.map(async (item) => {
          await prisma.foodTable.upsert({
            where: { name: item.name },
            update: {
              label: item.label,
              translation: item.translation,
            },
            create: {
              name: item.name,
              url: '', // Assuming URL is empty for new items in this context
              label: item.label,
              translation: item.translation,
            },
          });
        }),
      );
      console.log(
        `Updated or inserted 
        ${itemsToUpdateLabelsOrTranslations.length} items in FoodTable with new labels or translations.`,
      );
    }
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

export async function foodTableCCMenu(menuId: number) {
  try {
    // Fetch the specific menu row by ID
    const menu = await prisma.campusCenterMenus.findUnique({
      where: { id: menuId },
    });
    if (!menu) {
      console.error(`No menu found with id: ${menuId}`);
      return;
    }

    // Fetch the Japanese menu row by date
    // Could be module. Add Korean and Spanish.
    const japaneseMenu = await prisma.campusCenterMenus.findFirst({
      where: { week_of: menu.week_of, language: 'Japanese' },
    });

    if (!japaneseMenu) {
      console.error(`No Japanese menu found for date: ${menu.week_of}`);
      return;
    }

    // Safely parse the menu data
    let menuItems;
    let japaneseMenuItems;
    try {
      menuItems = typeof menu.menu === 'string' ? JSON.parse(menu.menu) : menu.menu;
      japaneseMenuItems = typeof japaneseMenu.menu === 'string' ? JSON.parse(japaneseMenu.menu) : japaneseMenu.menu;
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

    // Japanese
    const phrasesToRemoveJPN = ['お得サイズボウル:'];
    const phrasesToExcludeJPN = ['ミックスプレート', 'ミニまたはボウル', 'お好きな2品', 'お好きな1品'];

    const japaneseFoodData: FoodItem[] = japaneseMenuItems.flatMap(
      (day: { grabAndGo: string[]; plateLunch: string[] }) => {
        const combinedFoodItems: FoodItem[] = [
          ...(day.grabAndGo || []).map((item: string) => ({ name: item, label: ['すぐ食べられる'] })),
          ...(day.plateLunch || []).map((item: string) => ({ name: item, label: ['セット料理'] })),
        ];

        return combinedFoodItems
          .map(({ name, label }) => {
            let cleanedName = name;

            // Check and add labels based on the phrase
            phrasesToRemoveJPN.forEach((phrase) => {
              if (name.includes(phrase)) {
                cleanedName = name.replace(phrase, '').trim();
                label.push(phrase.replace(':', '').trim());
              }
            });

            return { name: cleanedName, label };
          })
          .filter(({ name }) => !phrasesToExcludeJPN.some((phrase) => name.includes(phrase)));
      },
    );
    // Create a map of English formal names to Japanese formal names
    const japaneseNameMap = new Map<string, string>();
    japaneseFoodData.forEach((item, index) => {
      if (foodData[index]) {
        japaneseNameMap.set(foodData[index].name, item.name);
      }
    });

    // Deduplicate by `name` and `label`
    const uniqueFoodData: FoodTableEntry[] = Array.from(
      new Map(foodData.map((item) => [JSON.stringify({ name: item.name, label: item.label }), item])).values(),
    ).map(({ name, label }) => {
      // const assignedLabels = assignLabels(name);
      const japaneseName = japaneseNameMap.get(name) || '';

      return {
        name,
        url: '',
        label: [...label],
        translation: [japaneseName],
      };
    });
    await foodTableBaseFunction(uniqueFoodData, menuId);
  } catch (error) {
    console.error('Campus Center error', error);
    throw new Error('Error populating from Campus Center');
  }
}

export async function foodTableGatewayMenu(menuId: number) {
  try {
    // Fetch the specific menu row by ID
    const menu = await prisma.gatewayMenus.findUnique({
      where: { id: menuId },
    });
    if (!menu) {
      console.error(`No menu found with id: ${menuId}`);
      return;
    }

    // Fetch the Japanese menu row by date
    // Could be modular. Add Spanish and Korean.
    const japaneseMenu = await prisma.gatewayMenus.findFirst({
      where: { date: menu.date, language: 'Japanese' },
    });
    if (!japaneseMenu) {
      console.error(`No Japanese menu found for date: ${menu.date}`);
      return;
    }

    // Safely parse the menu data
    let menuItems;
    let japaneseMenuItems;
    try {
      menuItems = typeof menu.menu === 'string' ? JSON.parse(menu.menu) : menu.menu;
      japaneseMenuItems = typeof japaneseMenu.menu === 'string' ? JSON.parse(japaneseMenu.menu) : japaneseMenu.menu;
    } catch (error) {
      console.error('Invalid menu data:', menu.menu);
      return;
    }

    const foodData: FoodItem[] = extractFormalNames(menuItems).map((name) => ({ name, label: [] }));
    const japaneseFoodData: FoodItem[] = extractFormalNames(japaneseMenuItems).map((name) => ({ name, label: [] }));

    // Create a map of English formal names to Japanese formal names
    const japaneseNameMap = new Map<string, string>();
    japaneseFoodData.forEach((item, index) => {
      if (foodData[index]) {
        japaneseNameMap.set(foodData[index].name, item.name);
      }
    });

    // Deduplicate by `name` and `label`
    const uniqueFoodData: FoodTableEntry[] = Array.from(
      new Map(foodData.map((item) => [JSON.stringify({ name: item.name }), item])).values(),
    ).map(({ name }) => {
      const japaneseName = japaneseNameMap.get(name) || '';

      return {
        name,
        url: '',
        label: ['Gateway'],
        translation: [japaneseName],
      };
    });

    await foodTableBaseFunction(uniqueFoodData, menuId);
  } catch (error) {
    console.error('Sodexo:', error);
    throw new Error('Error populating from Sodexo');
  }
}

export async function foodTableAlohaMenu(menuId: number) {
  try {
    // Fetch the specific menu row by ID
    const menu = await prisma.haleAlohaMenus.findUnique({
      where: { id: menuId },
    });
    if (!menu) {
      console.error(`No menu found with id: ${menuId}`);
      return;
    }

    // Fetch the Japanese menu row by date
    // Could be modular. Add Spanish and Korean.
    const japaneseMenu = await prisma.haleAlohaMenus.findFirst({
      where: { date: menu.date, language: 'Japanese' },
    });
    if (!japaneseMenu) {
      console.error(`No Japanese menu found for date: ${menu.date}`);
      return;
    }

    // Safely parse the menu data
    let menuItems;
    let japaneseMenuItems;
    try {
      menuItems = typeof menu.menu === 'string' ? JSON.parse(menu.menu) : menu.menu;
      japaneseMenuItems = typeof japaneseMenu.menu === 'string' ? JSON.parse(japaneseMenu.menu) : japaneseMenu.menu;
    } catch (error) {
      console.error('Invalid menu data:', menu.menu);
      return;
    }

    const foodData: FoodItem[] = extractFormalNames(menuItems).map((name) => ({ name, label: [] }));
    const japaneseFoodData: FoodItem[] = extractFormalNames(japaneseMenuItems).map((name) => ({ name, label: [] }));

    // Create a map of English formal names to Japanese formal names
    const japaneseNameMap = new Map<string, string>();
    japaneseFoodData.forEach((item, index) => {
      if (foodData[index]) {
        japaneseNameMap.set(foodData[index].name, item.name);
      }
    });

    // Deduplicate by `name` and `label`
    const uniqueFoodData: FoodTableEntry[] = Array.from(
      new Map(foodData.map((item) => [JSON.stringify({ name: item.name }), item])).values(),
    ).map(({ name }) => {
      const japaneseName = japaneseNameMap.get(name) || '';

      return {
        name,
        url: '',
        label: ['Hale Aloha'],
        translation: [japaneseName],
      };
    });

    await foodTableBaseFunction(uniqueFoodData, menuId);
  } catch (error) {
    console.error('Sodexo:', error);
    throw new Error('Error populating from Sodexo');
  }
}
