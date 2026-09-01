import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { favorites: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.favorites || []);
  } catch (error) {
    console.error('Error fetching favorite items:', error);
    return NextResponse.json({ message: 'Error fetching favorite items' }, { status: 500 });
  }
}
