import { PrismaClient } from '@prisma/client';

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
    }));

    // Check existing records in the database
    const existingFoodItems = await prisma.foodTable.findMany({
      where: {
        name: {
          in: uniqueFoodData.map((item) => item.name),
        },
      },
      select: { name: true },
    });

    const existingNames = new Set(existingFoodItems.map((item) => item.name));
    const newFoodData = uniqueFoodData.filter((item) => !existingNames.has(item.name));

    if (newFoodData.length > 0) {
      await prisma.foodTable.createMany({ data: newFoodData });
      console.log(`Inserted ${newFoodData.length} new items into FoodTable.`);
    } else {
      console.log('No new items to insert into FoodTable.');
    }
  } catch (error) {
    console.error('Error populating FoodTable:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export async function populateFoodTableFromMenuId(menuId: number) {
  try {
    // Fetch the specific menu row by ID
    const menu = await prisma.menus.findUnique({
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
      throw error;
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
      select: { name: true },
    });

    const existingNames = new Set(existingFoodItems.map((item) => item.name));
    const newFoodData = uniqueFoodData.filter((item) => !existingNames.has(item.name));

    if (newFoodData.length > 0) {
      // Insert only new items into FoodTable
      await prisma.foodTable.createMany({ data: newFoodData });
      console.log(`Inserted ${newFoodData.length} new items into FoodTable for menu ID ${menuId}.`);
    } else {
      console.log(`No new items to insert for menu ID ${menuId}.`);
    }
  } catch (error) {
    console.error('Error populating FoodTable:', error);
  } finally {
    await prisma.$disconnect();
  }
}
