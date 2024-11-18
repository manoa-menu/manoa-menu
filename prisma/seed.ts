import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';
// import { InputJsonValue } from '@prisma/client/runtime/library';
import * as config from '../config/settings.development.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database');
  const password = await hash('changeme', 10);
  config.defaultAccounts.forEach(async (account) => {
    let role: Role = 'USER';
    if (account.role === 'ADMIN') {
      role = 'ADMIN';
    }
    console.log(`  Creating user: ${account.email} with role: ${role}`);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        password,
        role,
      },
    });
    // console.log(`  Created user: ${user.email} with role: ${user.role}`);
  });
  // (config.defaultData as unknown as Menus[]).forEach(async (data: Menus, index) => {
  //   console.log(`  Adding menu for week of: ${data.week_of}`);
  //   await prisma.menus.upsert({
  //     where: { id: index + 1 },
  //     update: {},
  //     create: {
  //       week_of: new Date(data.week_of),
  //       menu: data.menu as InputJsonValue,
  //     },
  //   });
  // });
}
main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
