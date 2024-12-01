import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { foodItemId } = req.query;

  if (req.method === 'GET') {
    const foodItem = await prisma.foodTable.findUnique({
      where: { id: Number(foodItemId) },
    });

    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    return res.json({ likes: foodItem.likes });
  }
  return res.status(405).end(); // Method Not Allowed
}
