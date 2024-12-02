import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId || Number.isNaN(Number(userId))) {
    return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { favorites: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.favorites || []);
  } catch (error) {
    console.error('Error fetching favorite items:', error);
    return NextResponse.json({ message: 'Error fetching favorite items' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
