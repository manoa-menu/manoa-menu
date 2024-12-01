import type { NextApiRequest, NextApiResponse } from 'next';
import parseCampusCenterMenu from '@/lib/menuParse';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileURL } = req.body;

  if (!fileURL) {
    return res.status(400).json({ error: 'fileURL is required' });
  }

  try {
    const parsedMenu = await parseCampusCenterMenu(fileURL);
    return res.status(200).json(parsedMenu);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'An unknown error occurred' });
  }
}
