'use server';

import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

export enum Location {
  CAMPUS_CENTER = 'CAMPUS_CENTER',
  GATEWAY = 'GATEWAY',
  HALE_ALOHA = 'HALE_ALOHA',
}

function getCurrentWeek(): Date {
  const today = new Date();
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = today.getDay();
  // Calculate the start of the week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  // Calculate the end of the week (Saturday)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
  return startOfWeek;
}

/**
 * Creates a new menu in the database.
 * @param menuRow, an object with the following properties: email, password.
 */
export async function insertMenu(menuInfo: DayMenu[], location: Location, language: string, country: string) {
  const weekOf = getCurrentWeek();
  const weekMenu = JSON.parse(JSON.stringify(menuInfo));
  await prisma.menus.create({
    data: {
      week_of: weekOf,
      location,
      menu: weekMenu,
      language,
      country,
    },
  });
}

/**
 * Edits an existing menu in the database.
 * @param id, the ID of the menu to edit.
 * @param menuRow, an object with the updated menu properties.
 */
export async function editMenu(id: number, menuInfo: DayMenu[], location: Location, language: string, country: string) {
  const weekOf = getCurrentWeek();
  const weekMenu = JSON.parse(JSON.stringify(menuInfo));
  await prisma.menus.update({
    where: { id },
    data: {
      week_of: weekOf,
      location,
      menu: weekMenu,
      language,
      country,
    },
  });
}

/**
 * Deletes a menu from the database.
 * @param id, the ID of the menu to delete.
 */
export async function deleteMenu(id: number) {
  await prisma.menus.delete({
    where: { id },
  });
}

/**
 * Retrieves a menu from the database.
 * @param id, the ID of the menu to retrieve.
 * @returns the menu object.
 */
export async function getMenu(week_of: Date, language: string) {
  return prisma.menus.findFirst({
    where: {
      week_of,
      language,
    },
  });
}

/**
 * Retrieves the latest menu from the database using the week_of field.
 * @returns the latest menu object.
 */
export async function getLatestMenu() {
  return prisma.menus.findFirst({
    where: {
      language: 'English',
    },
    orderBy: {
      week_of: 'desc',
    },
  });
}

/**
 * Retrieves all menus from the database.
 * @returns an array of menu objects.
 */
export async function getAllMenus() {
  return prisma.menus.findMany();
}

/**
 * Creates a new user in the database.
 * @param credentials, an object with the following properties: email, password.
 */
export async function createUser(credentials: { email: string; password: string }) {
  // console.log(`createUser data: ${JSON.stringify(credentials, null, 2)}`);
  const password = await hash(credentials.password, 10);
  await prisma.user.create({
    data: {
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
