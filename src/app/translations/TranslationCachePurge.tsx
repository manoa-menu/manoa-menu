'use client';

import { useEffect, useState } from 'react';

import {
  TRANSLATION_REVIEW_LANGUAGES,
  type TranslationReviewLanguage,
} from '@/lib/translationReviewShared';
import {
  TRANSLATION_LOCATIONS,
  shiftIsoDate,
  type TranslationLocation,
} from '@/lib/translationOccurrences';

const LOCATION_LABELS: Record<TranslationLocation, string> = {
  GW: 'Gateway',
  HA: 'Hale Aloha',
  CC: 'Campus Center',
};

type Props = {
  initialLanguage: TranslationReviewLanguage;
  onPurged: () => Promise<void>;
};

type PurgeResult = {
  deletedMenuRows: number;
  deletedStringRows: number;
  matchedEnglishStrings: number;
};

function formatWeek(weekOf: string): string {
  const format = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  };
  return `${format(weekOf)} – ${format(shiftIsoDate(weekOf, 6))}`;
}

export default function TranslationCachePurge({ initialLanguage, onPurged }: Props) {
  const [open, setOpen] = useState(false);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [weekOf, setWeekOf] = useState('');
  const [locations, setLocations] = useState<TranslationLocation[]>([
    ...TRANSLATION_LOCATIONS,
  ]);
  const [languages, setLanguages] = useState<TranslationReviewLanguage[]>([initialLanguage]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || weeks.length > 0 || loadingOptions) {
      return;
    }

    const loadOptions = async () => {
      setLoadingOptions(true);
      setError(null);
      try {
        const response = await fetch('/api/translations/cache', { cache: 'no-store' });
        const payload = await response.json() as { weeks?: string[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load cache options.');
        }
        const nextWeeks = payload.weeks ?? [];
        setWeeks(nextWeeks);
        setWeekOf(nextWeeks[0] ?? '');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load cache options.');
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, [loadingOptions, open, weeks.length]);

  const toggleLocation = (location: TranslationLocation) => {
    setLocations((current) => current.includes(location)
      ? current.filter((item) => item !== location)
      : [...current, location]);
  };

  const toggleLanguage = (language: TranslationReviewLanguage) => {
    setLanguages((current) => current.includes(language)
      ? current.filter((item) => item !== language)
      : [...current, language]);
  };

  const purge = async () => {
    if (!weekOf || locations.length === 0 || languages.length === 0) {
      setError('Choose a week, at least one menu, and at least one language.');
      return;
    }

    const confirmed = window.confirm(
      `Reset ${languages.join(', ')} for ${formatWeek(weekOf)}?\n\n`
      + 'This deletes the selected translated menu rows and matching permanent string-cache '
      + 'entries. English menus stay. Shared phrases may also be removed for these languages '
      + 'and will translate again on next load.',
    );
    if (!confirmed) {
      return;
    }

    setPurging(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/translations/cache', {
        method: 'DELETE',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekOf, locations, languages }),
      });
      const payload = await response.json() as PurgeResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Could not purge the selected cache.');
      }
      setMessage(
        `Purged ${payload.deletedMenuRows} menu row(s) and `
        + `${payload.deletedStringRows} string translation(s).`,
      );
      await onPurged();
    } catch (purgeError) {
      setError(purgeError instanceof Error ? purgeError.message : 'Could not purge the cache.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <details
      className="translation-cache-tools"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Cache tools</summary>
      <div className="translation-cache-body">
        <p>
          Reset selected translated menus for a week: deletes translated menu table rows
          and matching permanent phrase translations. English menus are kept.
        </p>
        {loadingOptions ? <p className="translation-status">Loading weeks…</p> : null}
        {weeks.length > 0 ? (
          <div className="translation-cache-grid">
            <label className="translation-cache-field">
              <span>Week</span>
              <select value={weekOf} onChange={(event) => setWeekOf(event.target.value)}>
                {weeks.map((week) => (
                  <option key={week} value={week}>{formatWeek(week)}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Menus</legend>
              {TRANSLATION_LOCATIONS.map((location) => (
                <label key={location}>
                  <input
                    type="checkbox"
                    checked={locations.includes(location)}
                    onChange={() => toggleLocation(location)}
                  />
                  {LOCATION_LABELS[location]}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Languages</legend>
              {TRANSLATION_REVIEW_LANGUAGES.map((language) => (
                <label key={language}>
                  <input
                    type="checkbox"
                    checked={languages.includes(language)}
                    onChange={() => toggleLanguage(language)}
                  />
                  {language}
                </label>
              ))}
            </fieldset>
          </div>
        ) : null}
        <p className="translation-cache-warning">
          Shared phrases are global: purging one menu can remove phrases also used by another menu.
        </p>
        {error ? <p className="translation-error">{error}</p> : null}
        {message ? <p className="translation-cache-success">{message}</p> : null}
        <button
          type="button"
          className="translation-btn translation-btn-danger"
          disabled={purging || loadingOptions || !weekOf}
          onClick={() => void purge()}
        >
          {purging ? 'Purging…' : 'Purge selected cache'}
        </button>
      </div>
    </details>
  );
}
