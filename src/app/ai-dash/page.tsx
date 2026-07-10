import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAiUsageDashboard,
  parseAiUsagePeriod,
  type AiUsageGroup,
  type AiUsagePeriod,
  type AiUsageRow,
} from '@/lib/aiTokenUsage';
import AiDashRefreshButton from './AiDashRefreshButton';
import './ai-dash.css';

export const metadata: Metadata = {
  title: 'AI Cost Dashboard',
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
  searchParams: Promise<{ key?: string; period?: string }>;
};

const PERIODS: { id: AiUsagePeriod; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'all', label: 'All-time' },
];

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isAuthorized(providedKey: string | undefined): boolean {
  const expected = process.env['AI-DASH'];
  if (!expected || !providedKey) {
    return false;
  }
  return timingSafeEqual(providedKey, expected);
}

function formatUsd(value: number): string {
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  }
  if (value >= 0.01 || value === 0) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(6)}`;
}

function formatTokens(value: number): string {
  return value.toLocaleString('en-US');
}

function formatCompactTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 10_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return formatTokens(value);
}

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Honolulu',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatPeriodRange(period: AiUsagePeriod, since: Date | null): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Honolulu',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (period === 'all' || !since) {
    return 'All recorded usage';
  }

  const start = fmt.format(since);
  const end = fmt.format(new Date());
  if (period === 'day') {
    return `Today · ${end} HST`;
  }
  return `${start} – ${end} HST`;
}

function operationLabel(operation: string): string {
  switch (operation) {
    case 'cc_pdf_parse':
      return 'CC PDF parse';
    case 'cc_translate':
      return 'CC translate';
    case 'sdx_translate':
      return 'SDX translate';
    case 'sdx_translate_batch':
      return 'SDX string batch';
    default:
      return operation;
  }
}

function PeriodSwitcher({
  period,
  secretKey,
}: {
  period: AiUsagePeriod;
  secretKey: string;
}) {
  return (
    <div className="ai-dash-period" role="tablist" aria-label="Time period">
      {PERIODS.map((option) => {
        const href = `/ai-dash?key=${encodeURIComponent(secretKey)}&period=${option.id}`;
        const active = option.id === period;
        return (
          <Link
            key={option.id}
            href={href}
            role="tab"
            aria-selected={active}
            className={`ai-dash-period-btn${active ? ' is-active' : ''}`}
            prefetch={false}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`ai-dash-card${emphasize ? ' ai-dash-card-emphasize' : ''}`}>
      <div className="ai-dash-card-label">{label}</div>
      <div className="ai-dash-card-value">{value}</div>
      {hint ? <div className="ai-dash-card-hint">{hint}</div> : null}
    </div>
  );
}

function GroupCards({ title, rows }: { title: string; rows: AiUsageGroup[] }) {
  return (
    <section className="ai-dash-panel">
      <div className="ai-dash-panel-head">
        <h2>{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="ai-dash-empty">No usage in this period.</p>
      ) : (
        <ul className="ai-dash-group-list">
          {rows.map((row) => (
            <li key={row.key} className="ai-dash-group-item">
              <div className="ai-dash-group-top">
                <span className="ai-dash-group-name">
                  {title.includes('operation') ? operationLabel(row.key) : row.key}
                </span>
                <span className="ai-dash-strong">{formatUsd(row.totalCost)}</span>
              </div>
              <div className="ai-dash-group-meta">
                <span>{formatTokens(row.calls)} calls</span>
                <span>{formatCompactTokens(row.inputTokens)} in</span>
                <span>{formatCompactTokens(row.menuOutputTokens)} menu out</span>
                <span>{formatCompactTokens(row.reasoningTokens)} reason</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UsageCards({ rows }: { rows: AiUsageRow[] }) {
  return (
    <div className="ai-dash-usage-cards">
      {rows.map((row) => (
        <article key={row.id} className="ai-dash-usage-card">
          <div className="ai-dash-usage-card-top">
            <div>
              <div className="ai-dash-usage-op">{operationLabel(row.operation)}</div>
              <div className="ai-dash-usage-when">{formatWhen(row.createdAt)}</div>
            </div>
            <div className="ai-dash-strong">{formatUsd(row.totalCost)}</div>
          </div>
          <div className="ai-dash-usage-grid">
            <div>
              <span>Input</span>
              <strong>{formatTokens(row.inputTokens)}</strong>
            </div>
            <div>
              <span>Output</span>
              <strong>{formatTokens(row.outputTokens)}</strong>
            </div>
            <div>
              <span>Reasoning</span>
              <strong>{formatTokens(row.reasoningTokens)}</strong>
            </div>
            <div>
              <span>Menu out</span>
              <strong>{formatTokens(row.menuOutputTokens)}</strong>
            </div>
            <div>
              <span>Total tok</span>
              <strong>{formatTokens(row.totalTokens)}</strong>
            </div>
          </div>
          <div className="ai-dash-usage-foot">
            <span className="ai-dash-mono">{row.model}</span>
            <span>{row.language ?? '—'}</span>
            <span>#{row.id}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function UsageTable({ rows }: { rows: AiUsageRow[] }) {
  return (
    <div className="ai-dash-table-wrap ai-dash-table-desktop">
      <table className="ai-dash-table ai-dash-table-dense">
        <thead>
          <tr>
            <th>id</th>
            <th>createdAt</th>
            <th>operation</th>
            <th>model</th>
            <th>language</th>
            <th>inputTokens</th>
            <th>outputTokens</th>
            <th>reasoningTokens</th>
            <th>menuOutputTokens</th>
            <th>totalTokens</th>
            <th>inputCost</th>
            <th>outputCost</th>
            <th>totalCost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{formatWhen(row.createdAt)}</td>
              <td>{row.operation}</td>
              <td className="ai-dash-mono">{row.model}</td>
              <td>{row.language ?? '—'}</td>
              <td>{formatTokens(row.inputTokens)}</td>
              <td>{formatTokens(row.outputTokens)}</td>
              <td>{formatTokens(row.reasoningTokens)}</td>
              <td>{formatTokens(row.menuOutputTokens)}</td>
              <td>{formatTokens(row.totalTokens)}</td>
              <td>{formatUsd(row.inputCost)}</td>
              <td>{formatUsd(row.outputCost)}</td>
              <td className="ai-dash-strong">{formatUsd(row.totalCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AiDashPage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (!isAuthorized(params.key)) {
    notFound();
  }

  const period = parseAiUsagePeriod(params.period);
  const data = await getAiUsageDashboard(150, period);
  const { summary } = data;
  const secretKey = params.key as string;

  return (
    <main className="ai-dash">
      <header className="ai-dash-header">
        <div className="ai-dash-header-copy">
          <p className="ai-dash-eyebrow">Internal</p>
          <h1>AI Cost Dashboard</h1>
          <p className="ai-dash-sub">
            Estimated OpenAI spend from recorded token usage.
          </p>
        </div>
      </header>

      <section className="ai-dash-overview" aria-labelledby="ai-dash-overview-title">
        <div className="ai-dash-overview-bar">
          <div>
            <h2 id="ai-dash-overview-title" className="ai-dash-overview-title">Overview</h2>
            <p className="ai-dash-overview-range">{formatPeriodRange(period, data.since)}</p>
          </div>
          <PeriodSwitcher period={period} secretKey={secretKey} />
        </div>

        <div className="ai-dash-summary">
          <SummaryCard
            label="Total spend"
            value={formatUsd(summary.totalCost)}
            hint="input + output"
            emphasize
          />
          <SummaryCard label="Input cost" value={formatUsd(summary.inputCost)} />
          <SummaryCard label="Output cost" value={formatUsd(summary.outputCost)} />
          <SummaryCard label="API calls" value={formatTokens(summary.calls)} />
          <SummaryCard label="Input tokens" value={formatCompactTokens(summary.inputTokens)} />
          <SummaryCard label="Output tokens" value={formatCompactTokens(summary.outputTokens)} />
          <SummaryCard label="Reasoning" value={formatCompactTokens(summary.reasoningTokens)} />
          <SummaryCard
            label="Menu output"
            value={formatCompactTokens(summary.menuOutputTokens)}
            hint="output − reasoning"
          />
        </div>
      </section>

      <div className="ai-dash-grid">
        <GroupCards title="By operation" rows={data.byOperation} />
        <GroupCards title="By model" rows={data.byModel} />
      </div>

      <section className="ai-dash-panel">
        <div className="ai-dash-panel-head">
          <h2>Token usage</h2>
          <p className="ai-dash-panel-note">
            DB columns plus menu output tokens and total price · {data.recent.length} rows
          </p>
        </div>
        {data.recent.length === 0 ? (
          <p className="ai-dash-empty">No usage in this period.</p>
        ) : (
          <>
            <UsageCards rows={data.recent} />
            <UsageTable rows={data.recent} />
          </>
        )}
      </section>

      <AiDashRefreshButton />
    </main>
  );
}
