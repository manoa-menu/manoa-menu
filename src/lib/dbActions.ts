import { DayMenu, Location, FilteredSodexoMeal } from '@/types/menuTypes';
import { prisma } from '@/lib/prisma';

export async function insertCCMenu(
  menuInfo: DayMenu[],
  location: Location,
  language: string,
  date: string,
) {
  try {
    if (!menuInfo || menuInfo.length === 0) {
      console.log(`Skipping empty CC menu insert for ${date} (${language})`);
      return;
    }

    const weekMenu = JSON.parse(JSON.stringify(menuInfo));
    const existing = await getCCMenu(date, language);
    if (existing) {
      const existingMenu = (existing.menu as unknown as DayMenu[]) || [];
      if (existingMenu.length > 0) {
        console.log(`CC menu already exists for ${date} (${language}); skipping insert`);
        return;
      }
      await prisma.campusCenterMenus.update({
        where: { id: existing.id },
        data: { menu: weekMenu },
      });
      return;
    }

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

export async function insertSdxMenu(
  menuInfo: FilteredSodexoMeal[],
  location: Location,
  language: string,
  date: string,
) {
  try {
    // Don't persist blank menus — no unique (date, language) constraint, so they
    // duplicate on every cache miss / concurrent request.
    if (!menuInfo || menuInfo.length === 0) {
      console.log(`Skipping empty SDX menu insert for ${date} (${language}, ${location})`);
      return;
    }

    const weekMenu = JSON.parse(JSON.stringify(menuInfo));
    const existing = await getSdxMenu(date, language, location);

    if (existing) {
      const existingMenu = (existing.menu as unknown as FilteredSodexoMeal[]) || [];
      if (existingMenu.length > 0) {
        console.log(`SDX menu already exists for ${date} (${language}, ${location}); skipping insert`);
        return;
      }

      if (location === Location.GATEWAY) {
        await prisma.gatewayMenus.update({
          where: { id: existing.id },
          data: { menu: weekMenu },
        });
      } else if (location === Location.HALE_ALOHA) {
        await prisma.haleAlohaMenus.update({
          where: { id: existing.id },
          data: { menu: weekMenu },
        });
      } else {
        throw new Error('Invalid location');
      }
      return;
    }

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

export async function getSdxMenu(date: string, language: string, location: Location) {
  try {
    if (location === Location.GATEWAY) {
      return await prisma.gatewayMenus.findFirst({
        where: {
          date,
          language,
        },
      });
    }
    if (location === Location.HALE_ALOHA) {
      return await prisma.haleAlohaMenus.findFirst({
        where: {
          date,
          language,
        },
      });
    }
    throw new Error('Invalid location');
  } catch (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }
}

export async function getUserLanguageByEmail(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { language: true },
  });
  return user?.language || 'English';
}
