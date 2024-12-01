import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { foodItemId } = req.body;

  const foodItem = await prisma.foodTable.findUnique({
    where: { id: Number(foodItemId) },
  });

  if (!foodItem) {
    return res.status(404).json({ message: 'Food item not found' });
  }

  const updatedFoodItem = await prisma.foodTable.update({
    where: { id: Number(foodItemId) },
    data: { likes: foodItem.likes + 1 },
  });

  return res.json({ likes: updatedFoodItem.likes });
}
