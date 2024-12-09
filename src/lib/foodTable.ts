/* eslint-disable operator-linebreak */
import { PrismaClient } from '@prisma/client';
import assignLabels from './assignLabel';

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

// Populate the FoodTable with items from the menu
export default async function populateFoodTableFromCCMenu(parsedMenu: DayMenu[]): Promise<void> {
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

    // Deduplicate by `name` and `label`
    const uniqueFoodData: FoodTableEntry[] = Array.from(
      new Map(foodData.map((item) => [JSON.stringify({ name: item.name, label: item.label }), item])).values(),
    ).map(({ name, label }) => {
      const assignedLabels = assignLabels(name);

      return {
        name,
        url: '',
        label: [...assignedLabels, ...label],
        translation: [],
      };
    });

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
          await prisma.foodTable.update({
            where: { name: item.name },
            data: {
              label: item.label,
              translation: item.translation,
            },
          });
        }),
      );
      console.log(
        `Updated ${itemsToUpdateLabelsOrTranslations.length} items in FoodTable with new labels or translations.`,
      );
    }

    // Determine which items are new or need an image URL update
    const existingNamesWithUrls = new Map(existingFoodItems.map((item) => [item.name, item.url]));

    const itemsToUpdateUrls = uniqueFoodData.filter((item) => {
      const existingUrl = existingNamesWithUrls.get(item.name);
      return !existingUrl; // Update only items with an empty URL
    });

    if (itemsToUpdateUrls.length > 0) {
      // Fetch image URLs concurrently
      const updatedFoodData = await Promise.all(
        itemsToUpdateUrls.map(async (item) => {
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
    }
  } catch (error) {
    console.error('Error populating FoodTable:', error);
    throw new Error('Error populating FoodTable');
  } finally {
    await prisma.$disconnect();
  }
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

    return true;
  } catch (error) {
    console.error('Error removing favorite item:', error);
    throw new Error('Error removing favorite item');
  } finally {
    await prisma.$disconnect();
  }
}

// ONLY FOR TESTING PURPOSES
export async function populateFoodTableFromCCMenuId(menuId: number) {
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
    ).map(({ name, label }) => {
      const assignedLabels = assignLabels(name);

      return {
        name,
        url: '',
        label: [...label, ...assignedLabels],
        translation: [],
      };
    });

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
          await prisma.foodTable.update({
            where: { name: item.name },
            data: {
              label: item.label,
              translation: item.translation,
            },
          });
        }),
      );
      console.log(
        `Updated ${itemsToUpdateLabelsOrTranslations.length} items in FoodTable with new labels or translations.`,
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
