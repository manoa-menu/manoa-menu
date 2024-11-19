'use server';

import { hash } from 'bcrypt';
// import { redirect } from 'next/navigation';
import { prisma } from './prisma';

interface MenuRow {
  week_of: string;
  menu: DayMenu[];
}

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
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
 * Creates a new user in the database.
 * @param menuRow, an object with the following properties: email, password.
 */
export async function insertMenu(menuRow: MenuRow) {
  // console.log(`createUser data: ${JSON.stringify(credentials, null, 2)}`);
  const weekOf = getCurrentWeek();
  const weekMenu = JSON.parse(JSON.stringify(menuRow.menu));
  await prisma.menus.create({
    data: {
      week_of: weekOf,
      menu: weekMenu,
    },
  });
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
