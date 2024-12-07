'use server';

import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { DayMenu, Location, FilteredSodexoMeal } from '@/types/menuTypes';
import { getCurrentWeekOf, getCurrentDayOf } from '@/lib/dateFunctions';

const prisma = new PrismaClient();

/**
 * Creates a new menu in the database.
 * @param menuRow, an object with the following properties: email, password.
 */
export async function insertCCMenu(
  menuInfo: DayMenu[],
  location: Location,
  language: string,
  date: string,
) {
  try {
    const weekMenu = JSON.parse(JSON.stringify(menuInfo));
    await prisma.campusCenterMenus.create({
      data: {
        week_of: date,
        location,
        menu: weekMenu,
        language,
      },
    });
  } catch (error) {
    console.error('Error inserting menu:', error);
    throw error;
  }
}

/**
 * Edits a menu in the database.
 * @param id - The ID of the menu to edit.
 * @param data - The new data for the menu.
 * @returns the updated menu object.
 */
export async function editCCMenu(id: number, data: any) {
  try {
    return await prisma.campusCenterMenus.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error editing menu:', error);
    throw error;
  }
}

/**
 * Deletes a menu from the database.
 * @param id - The ID of the menu to delete.
 * @returns the deleted menu object.
 */
export async function deleteCCMenu(id: number) {
  try {
    return await prisma.campusCenterMenus.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    throw error;
  }
}

/**
 * Retrieves a menu from the database.
 * @param id, the ID of the menu to retrieve.
 * @returns the menu object.
 */
export async function getCCMenu(week_of: string, language: string) {
  try {
    return await prisma.campusCenterMenus.findFirst({
      where: {
        week_of,
        language,
      },
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }
}

/**
 * Retrieves the latest menu from the database using the week_of field.
 * @returns the latest menu object.
 */
export async function getLatestCCMenu(language: string, location: Location) {
  try {
    return await prisma.campusCenterMenus.findFirst({
      where: {
        language,
        week_of: getCurrentWeekOf(),
        location,
      },
    });
  } catch (error) {
    console.error('Error fetching latest menu:', error);
    throw error;
  }
}

/**
 * Retrieves all menus from the database.
 * @returns an array of menu objects.
 */
export async function getAllCCMenus() {
  try {
    return await prisma.campusCenterMenus.findMany();
  } catch (error) {
    console.error('Error fetching all menus:', error);
    throw error;
  }
}

export async function insertSdxMenu(
  menuInfo: FilteredSodexoMeal[],
  location: Location,
  language: string,
  date: string,
) {
  try {
    const weekMenu = JSON.parse(JSON.stringify(menuInfo));
    if (location === Location.GATEWAY) {
      await prisma.gatewayMenus.create({
        data: {
          date,
          location,
          menu: weekMenu,
          language,
        },
      });
    } else if (location === Location.HALE_ALOHA) {
      await prisma.haleAlohaMenus.create({
        data: {
          date,
          location,
          menu: weekMenu,
          language,
        },
      });
    } else {
      throw new Error('Invalid location');
    }
  } catch (error) {
    console.error('Error inserting menu:', error);
    throw error;
  }
}

/**
 * Retrieves the latest menu from the database using the week_of field.
 * @returns the latest menu object.
 */
export async function getLatestSdxMenu(language: string, location: Location) {
  try {
    if (location === Location.GATEWAY) {
      return await prisma.gatewayMenus.findFirst({
        where: {
          language,
          date: getCurrentDayOf(),
          location,
        },
      });
    } if (location === Location.HALE_ALOHA) {
      return await prisma.haleAlohaMenus.findFirst({
        where: {
          language,
          date: getCurrentDayOf(),
          location,
        },
      });
    }
    throw new Error('Invalid location');
  } catch (error) {
    console.error('Error fetching latest menu:', error);
    throw error;
  }
}

export async function getUserLanguage(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { language: true },
  });
  return user?.language || 'English';
}

export async function getUserFavorites(email: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { favorites: true },
  });
  return user?.favorites || [];
}

/**
 * Creates a new user in the database.
 * @param credentials, an object with the following properties: email, password.
 */
export async function createUser(credentials: { email: string; username: string; password: string }) {
  // console.log(`createUser data: ${JSON.stringify(credentials, null, 2)}`);
  const password = await hash(credentials.password, 10);
  await prisma.user.create({
    data: {
      username: credentials.username,
      email: credentials.email,
      password,
    },
  });
}

/**
 * Changes the password of an existing user in the database.
 * @param credentials, an object with the following properties: email, password.
 */
export async function changePassword(credentials: { email: string; password: string }) {
  // console.log(`changePassword data: ${JSON.stringify(credentials, null, 2)}`);
  const password = await hash(credentials.password, 10);
  await prisma.user.update({
    where: { email: credentials.email },
    data: {
      password,
    },
  });
}
