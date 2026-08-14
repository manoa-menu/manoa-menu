import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import {
  TRANSLATION_REVIEW_COOKIE,
  defaultReviewerLanguage,
  getReviewerByToken,
  reviewerCanAccessLanguage,
  toPublicReviewer,
} from '@/lib/translationReviewers';
import { parseTranslationLanguage } from '@/lib/translationReviewShared';
import TranslationReview from './TranslationReview';
import './translations.css';
import '../ai-dash/ai-dash.css';

export const metadata: Metadata = {
  title: 'Translation review',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ key?: string; language?: string }>;
};

export default async function TranslationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (params.key) {
    const unlock = new URLSearchParams({ key: params.key });
    if (params.language) {
      unlock.set('language', params.language);
    }
    redirect(`/api/translations/unlock?${unlock.toString()}`);
  }

  const cookieStore = await cookies();
  const reviewer = getReviewerByToken(cookieStore.get(TRANSLATION_REVIEW_COOKIE)?.value);
  if (!reviewer) {
    notFound();
  }

  const requested = parseTranslationLanguage(params.language);
  const initialLanguage = requested && reviewerCanAccessLanguage(reviewer, requested)
    ? requested
    : defaultReviewerLanguage(reviewer);

  return (
    <main className="ai-dash">
      <header className="ai-dash-header">
        <p className="ai-dash-eyebrow">Internal</p>
        <h1>Translation review</h1>
        <p className="ai-dash-sub">
          Edit a dish name or description. Corrections show on the live menu and are reused later.
        </p>
      </header>
      <TranslationReview
        reviewer={toPublicReviewer(reviewer)}
        initialLanguage={initialLanguage}
      />
    </main>
  );
}
