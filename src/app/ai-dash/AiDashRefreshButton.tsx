'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function AiDashRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={`ai-dash-refresh${isPending ? ' is-pending' : ''}`}
      aria-label="Refresh dashboard"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    >
      <svg
        className="ai-dash-refresh-icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-2.6-6.4" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
      <span>{isPending ? 'Refreshing…' : 'Refresh'}</span>
    </button>
  );
}
