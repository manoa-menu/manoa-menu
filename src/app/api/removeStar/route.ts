import { removeFavoriteItem } from '@/lib/foodTable';

// eslint-disable-next-line import/prefer-default-export
export async function POST(request: Request) {
  try {
    const { userId, item } = await request.json();

    if (!item) {
      return new Response('Item is required', { status: 400 });
    }

    const result = await removeFavoriteItem(Number(userId), item);

    if (result) {
      return new Response('Item starred successfully', { status: 200 });
    }
    return new Response('Item is already starred', { status: 400 });
  } catch (error) {
    console.error('Error adding favorite item:', error);
    return new Response('Error adding favorite item', { status: 500 });
  }
}
