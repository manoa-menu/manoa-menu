'use server';

import { getServerSession } from 'next-auth';

import authOptions from '@/lib/authOptions';
import { getUserLanguageByEmail } from '@/lib/dbActions';

/** Session-scoped language lookup. Does not take an email from the client. */
export async function getUserLanguage(): Promise<string> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return 'English';
  }
  return getUserLanguageByEmail(email);
}
