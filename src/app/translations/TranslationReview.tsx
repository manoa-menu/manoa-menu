'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  TranslationReviewKind,
  TranslationReviewLanguage,
  TranslationReviewRow,
  TranslationReviewSort,
  TranslationReviewStatus,
  TranslationReviewerPublic,
} from '@/lib/translationReviewShared';
import { formatOccurrenceDates } from '@/lib/translationOccurrences';
import { translationSourceKey } from '@/lib/translationSource';
import TranslationCachePurge from './TranslationCachePurge';

type ListResponse = {
  rows: TranslationReviewRow[];
  total: number;
  uncorrectedCount: number;
  correctedCount: number;
  page: number;
  pageSize: number;
};

type Props = {
  reviewer: TranslationReviewerPublic;
  initialLanguage: TranslationReviewLanguage;
};

const LOCATION_ORDER = ['GW', 'HA', 'CC'] as const;
const LOCATION_LABELS = {
  GW: 'Gateway',
  HA: 'Hale Aloha',
  CC: 'Campus Center',
} as const;

function primaryLocation(row: TranslationReviewRow): keyof typeof LOCATION_LABELS | null {
  let bestLocation: keyof typeof LOCATION_LABELS | null = null;
  let bestDate = '';
  row.occurrences.forEach((occurrence) => {
    occurrence.dates.forEach((date) => {
      const location = occurrence.location;
      if (
        bestLocation == null
        || date < bestDate
        || (date === bestDate
          && LOCATION_ORDER.indexOf(location) < LOCATION_ORDER.indexOf(bestLocation))
      ) {
        bestLocation = location;
        bestDate = date;
      }
    });
  });
  return bestLocation ?? row.occurrences[0]?.location ?? null;
}

type DisplayGroup = {
  key: string;
  place: keyof typeof LOCATION_LABELS | null;
  dish: TranslationReviewRow | null;
  dishLabel: string | null;
  descriptions: TranslationReviewRow[];
};

function buildDisplayGroups(
  rows: TranslationReviewRow[],
  groupDishDesc: boolean,
): DisplayGroup[] {
  if (!groupDishDesc) {
    return rows.map((row) => ({
      key: String(row.id),
      place: primaryLocation(row),
      dish: row.kind === 'dish' ? row : null,
      dishLabel: row.kind === 'description' ? row.parentDishText : null,
      descriptions: row.kind === 'description' ? [row] : [],
    }));
  }

  const groups: DisplayGroup[] = [];
  let index = 0;
  while (index < rows.length) {
    const row = rows[index];
    if (row.kind === 'dish') {
      const dishKey = translationSourceKey(row.sourceText);
      const descriptions: TranslationReviewRow[] = [];
      let cursor = index + 1;
      while (cursor < rows.length) {
        const next = rows[cursor];
        if (next.kind !== 'description') {
          break;
        }
        if (
          next.parentDishText
          && translationSourceKey(next.parentDishText) === dishKey
        ) {
          descriptions.push(next);
          cursor += 1;
          continue;
        }
        break;
      }
      groups.push({
        key: `dish-${row.id}`,
        place: primaryLocation(row),
        dish: row,
        dishLabel: null,
        descriptions,
      });
      index = cursor;
      continue;
    }

    const parentKey = row.parentDishText
      ? translationSourceKey(row.parentDishText)
      : translationSourceKey(row.sourceText);
    const descriptions = [row];
    let cursor = index + 1;
    while (cursor < rows.length) {
      const next = rows[cursor];
      if (next.kind !== 'description') {
        break;
      }
      const nextParent = next.parentDishText
        ? translationSourceKey(next.parentDishText)
        : translationSourceKey(next.sourceText);
      if (nextParent !== parentKey) {
        break;
      }
      descriptions.push(next);
      cursor += 1;
    }
    groups.push({
      key: `desc-${row.id}`,
      place: primaryLocation(row),
      dish: null,
      dishLabel: row.parentDishText,
      descriptions,
    });
    index = cursor;
  }
  return groups;
}

function occurrenceTitle(row: TranslationReviewRow): string {
  return row.occurrences.map((occurrence) => {
    const location = LOCATION_LABELS[occurrence.location];
    return `${location} ${formatOccurrenceDates(occurrence.dates)}`;
  }).join(' · ');
}

export default function TranslationReview({ reviewer, initialLanguage }: Props) {
  const [language, setLanguage] = useState<TranslationReviewLanguage>(initialLanguage);
  const [status, setStatus] = useState<TranslationReviewStatus>('uncorrected');
  const [kind, setKind] = useState<TranslationReviewKind>('all');
  const [sort, setSort] = useState<TranslationReviewSort>('text');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [language, status, kind, sort, debouncedQuery]);

  const listUrl = useMemo(() => {
    const params = new URLSearchParams({
      language,
      status,
      kind,
      sort,
      page: String(page),
    });
    if (debouncedQuery) {
      params.set('q', debouncedQuery);
    }
    return `/api/translations?${params.toString()}`;
  }, [language, status, kind, sort, page, debouncedQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(listUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Could not load translations.');
      }
      const payload = await response.json() as ListResponse;
      setData(payload);
      setDrafts(Object.fromEntries(payload.rows.map((row) => [row.id, row.translatedText])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load translations.');
    } finally {
      setLoading(false);
    }
  }, [listUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRow = async (row: TranslationReviewRow, resetToAi = false) => {
    setSavingId(row.id);
    setError(null);
    try {
      const response = await fetch('/api/translations', {
        method: 'PATCH',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetToAi
          ? { id: row.id, resetToAi: true }
          : {
            id: row.id,
            translatedText: drafts[row.id] ?? row.translatedText,
          }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Could not save translation.');
      }
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save translation.');
    } finally {
      setSavingId(null);
    }
  };

  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const languageLabel = reviewer.languages.join(', ');
  const displayGroups = useMemo(
    () => (data ? buildDisplayGroups(data.rows, kind === 'all') : []),
    [data, kind],
  );

  const renderEditor = (row: TranslationReviewRow, nested: boolean) => {
    const draft = drafts[row.id] ?? row.translatedText;
    const dirty = draft.trim() !== row.translatedText.trim();
    const kindLabel = row.kind === 'description' ? 'Description' : 'Dish';
    const whereTitle = occurrenceTitle(row);
    return (
      <div key={row.id} className={`translation-row${nested ? ' translation-row-child' : ''}`}>
        <div className="translation-row-meta">
          <span className={`translation-kind translation-kind-${row.kind}`}>
            {kindLabel}
          </span>
          <span className={`translation-badge ${row.isCorrected ? 'translation-badge-human' : 'translation-badge-ai'}`}>
            {row.isCorrected ? 'Corrected' : 'AI'}
          </span>
        </div>
        <div className="translation-copy">
          <div className="translation-source">{row.sourceText}</div>
          {row.occurrenceLabel ? (
            <p className="translation-where" title={whereTitle || undefined}>
              {row.occurrenceLabel}
            </p>
          ) : null}
        </div>
        {row.aiTranslatedText && row.aiTranslatedText !== draft ? (
          <p className="translation-ai">
            AI: {row.aiTranslatedText}
          </p>
        ) : null}
        {row.kind === 'description' ? (
          <textarea
            className="translation-input"
            aria-label={`${kindLabel} translation`}
            rows={2}
            value={draft}
            onChange={(event) => {
              const { value } = event.target;
              setDrafts((current) => ({ ...current, [row.id]: value }));
            }}
          />
        ) : (
          <input
            className="translation-input"
            aria-label={`${kindLabel} translation`}
            value={draft}
            onChange={(event) => {
              const { value } = event.target;
              setDrafts((current) => ({ ...current, [row.id]: value }));
            }}
          />
        )}
        <div className="translation-actions">
          <button
            type="button"
            className="translation-btn translation-btn-primary"
            disabled={savingId === row.id || (!dirty && row.isCorrected)}
            onClick={() => {
              void saveRow(row);
            }}
          >
            {savingId === row.id ? 'Saving…' : 'Save'}
          </button>
          {row.isCorrected ? (
            <button
              type="button"
              className="translation-btn"
              disabled={savingId === row.id}
              onClick={() => {
                void saveRow(row, true);
              }}
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="ai-dash-overview" aria-labelledby="translation-filters-title">
        <div className="ai-dash-overview-bar">
          <div>
            <h2 id="translation-filters-title" className="ai-dash-overview-title">
              {reviewer.name}
            </h2>
            <p className="ai-dash-overview-range">
              {languageLabel}
              {data
                ? ` · ${data.uncorrectedCount} need review · ${data.correctedCount} corrected`
                : ' · Loading…'}
            </p>
          </div>
          {reviewer.languages.length > 1 ? (
            <div className="translation-seg" role="tablist" aria-label="Language">
              {reviewer.languages.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={language === option}
                  className={`translation-seg-btn${language === option ? ' is-active' : ''}`}
                  onClick={() => setLanguage(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="translation-toolbar">
          <div className="translation-seg" role="tablist" aria-label="Status">
            {([
              ['uncorrected', 'Needs review'],
              ['corrected', 'Corrected'],
              ['all', 'All'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={status === id}
                className={`translation-seg-btn${status === id ? ' is-active' : ''}`}
                onClick={() => setStatus(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="translation-seg" role="tablist" aria-label="String type">
            {([
              ['all', 'All types'],
              ['dish', 'Dishes'],
              ['description', 'Descriptions'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={kind === id}
                className={`translation-seg-btn${kind === id ? ' is-active' : ''}`}
                onClick={() => setKind(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="translation-seg" role="tablist" aria-label="Sort">
            {([
              ['text', 'Name'],
              ['date', 'Date'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={sort === id}
                className={`translation-seg-btn${sort === id ? ' is-active' : ''}`}
                onClick={() => setSort(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="translation-search">
            <span className="visually-hidden">Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search English or translation"
            />
          </label>
        </div>
        {reviewer.name === 'Justin' ? (
          <TranslationCachePurge
            key={language}
            initialLanguage={language}
            onPurged={load}
          />
        ) : null}
      </section>

      <section className="ai-dash-panel">
        {error ? <p className="translation-error">{error}</p> : null}
        {loading && !data ? (
          <p className="ai-dash-empty">Loading translations…</p>
        ) : !data || data.rows.length === 0 ? (
          <p className="ai-dash-empty">No strings match these filters.</p>
        ) : (
          <div className="translation-list">
            {displayGroups.map((group, index) => {
              const previousPlace = index > 0 ? displayGroups[index - 1].place : null;
              const showPlaceHeader = sort === 'date'
                && group.place != null
                && group.place !== previousPlace;
              return (
                <div key={group.key} className="translation-list-item">
                  {showPlaceHeader && group.place ? (
                    <h3 className="translation-place-header">
                      {LOCATION_LABELS[group.place]}
                    </h3>
                  ) : null}
                  <article className="translation-group">
                    {group.dish ? renderEditor(group.dish, false) : null}
                    {!group.dish && group.dishLabel ? (
                      <p className="translation-dish-context">{group.dishLabel}</p>
                    ) : null}
                    {group.descriptions.map((row) => renderEditor(
                      row,
                      Boolean(group.dish) || Boolean(group.dishLabel),
                    ))}
                  </article>
                </div>
              );
            })}
          </div>
        )}

        {data && data.total > data.pageSize ? (
          <div className="translation-pager">
            <button
              type="button"
              className="translation-btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span className="translation-status">
              Page {page} of {pageCount} · {data.total}
            </span>
            <button
              type="button"
              className="translation-btn"
              disabled={page >= pageCount || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
