import Link from 'next/link';
import guidesIndex from '@/src/data/guides-index.json';
import { formatShortRange } from '@/src/lib/formatCurrency';

export const metadata = {
  title: 'Compare Startup Costs | Side-by-Side Business Cost Comparisons',
  description:
    'Side-by-side cost comparisons to help you decide between business types. Franchise vs independent, online vs storefront, and head-to-head industry matchups.',
  openGraph: {
    title: 'Compare Startup Costs | Side-by-Side Business Cost Comparisons',
    description:
      'Side-by-side cost comparisons to help you decide between business types. Franchise vs independent, online vs storefront, and head-to-head industry matchups.',
  },
};

function classifyComparison(guide) {
  const slug = guide.slug;
  const bt = guide.businessType.toLowerCase();
  if (slug.startsWith('franchise-vs-independent')) return 'Franchise vs Independent';
  if (
    bt.includes('llc') ||
    bt.includes('sole proprietorship') ||
    bt.includes('home-based') ||
    bt.includes('storefront') ||
    bt.includes('online') ||
    bt.includes('brick-and-mortar')
  )
    return 'Business Structure';
  return 'Industry Matchups';
}

const groupOrder = ['Industry Matchups', 'Franchise vs Independent', 'Business Structure'];

const groupDescriptions = {
  'Industry Matchups':
    'Head-to-head cost comparisons between similar business types in the same industry.',
  'Franchise vs Independent':
    'What you really pay for a franchise brand versus going independent.',
  'Business Structure':
    'How your business model and legal structure affect what you spend upfront.',
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ComparePage() {
  const comparisons = guidesIndex.filter((g) => g.slug.includes('-vs-'));

  const grouped = {};
  for (const guide of comparisons) {
    const group = classifyComparison(guide);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(guide);
  }

  // Sort each group alphabetically by businessType
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.businessType.localeCompare(b.businessType));
  }

  const sortedGroups = groupOrder.filter((g) => grouped[g]);

  return (
    <div className="article-wrap">
      <div className="entry-content">
        <h1>Compare Startup Costs</h1>
        <p style={{ fontSize: 18, color: 'var(--mid)', maxWidth: 620, marginTop: 8 }}>
          Side-by-side cost comparisons to help you decide between business types.
        </p>
      </div>

      {/* Jump nav */}
      <nav
        style={{
          margin: '32px 0 48px',
          padding: '24px 28px',
          background: 'var(--card-bg)',
          border: '1px solid var(--light)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--mid)',
            marginBottom: 12,
          }}
        >
          Jump to section
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
          {sortedGroups.map((group) => (
            <a
              key={group}
              href={`#${slugify(group)}`}
              style={{
                color: 'var(--ink)',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 500,
                borderBottom: '1px solid var(--light)',
                paddingBottom: 2,
              }}
            >
              {group}{' '}
              <span style={{ color: 'var(--mid)', fontSize: 13 }}>
                ({grouped[group].length})
              </span>
            </a>
          ))}
        </div>
      </nav>

      {sortedGroups.map((group) => (
        <div
          key={group}
          id={slugify(group)}
          style={{ marginTop: 48, scrollMarginTop: 80 }}
        >
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
              paddingBottom: 12,
              borderBottom: '2px solid var(--light)',
            }}
          >
            {group}{' '}
            <span style={{ color: 'var(--mid)', fontSize: 16, fontWeight: 400 }}>
              ({grouped[group].length})
            </span>
          </h2>
          <p
            style={{
              color: 'var(--mid)',
              fontSize: 15,
              marginBottom: 20,
              marginTop: 0,
            }}
          >
            {groupDescriptions[group]}
          </p>
          <div className="scg-guides-grid" style={{ padding: 0 }}>
            {grouped[group].map((g) => (
              <Link href={`/${g.slug}`} className="scg-guide-card" key={g.slug}>
                <h3>{g.businessType}</h3>
                {g.costLow > 0 && g.costHigh > 0 && (
                  <div className="scg-guide-card-range">
                    {formatShortRange(g.costLow, g.costHigh)}
                  </div>
                )}
                <p style={{ color: 'var(--mid)', fontSize: 14 }}>
                  {g.metaDescription?.slice(0, 120)}
                  {g.metaDescription?.length > 120 ? '...' : ''}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
