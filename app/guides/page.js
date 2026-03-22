import Link from 'next/link';
import guidesIndex from '@/src/data/guides-index.json';
import categories from '@/src/data/categories.json';
import { formatShortRange } from '@/src/lib/formatCurrency';
import GuidesSearch from '@/src/components/GuidesSearch';

export const metadata = {
  title: 'All Startup Cost Guides | Browse by Business Type',
  description: 'Browse detailed startup cost breakdowns for 100+ business types. Line-item costs, hidden expenses, and breakeven timelines for every industry.',
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function GuidesPage() {
  // Only show base guides (no state-specific or comparison pages)
  const baseGuides = guidesIndex.filter(g => !g.slug.includes('-in-') && !g.slug.includes('-vs-'));

  const grouped = {};
  for (const guide of baseGuides) {
    if (!grouped[guide.category]) grouped[guide.category] = [];
    grouped[guide.category].push(guide);
  }

  const sortedCats = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="article-wrap">
      <div className="entry-content">
        <h1>Startup Cost Guides</h1>
        <p>Real cost breakdowns for 100+ business types. Pick one and get the numbers.</p>
      </div>

      {/* Browse navigation */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <span style={{ padding: '8px 16px', background: 'var(--ink)', color: '#fff', borderRadius: 100, fontSize: 14, fontWeight: 600 }}>
          By Business Type
        </span>
        <Link href="/states" style={{ padding: '8px 16px', background: 'var(--card-bg)', color: 'var(--ink)', border: '1px solid var(--light)', borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          By State
        </Link>
        <Link href="/compare" style={{ padding: '8px 16px', background: 'var(--card-bg)', color: 'var(--ink)', border: '1px solid var(--light)', borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Comparisons
        </Link>
      </div>

      <GuidesSearch guides={guidesIndex} />

      {/* Table of contents */}
      <nav style={{ margin: '32px 0 48px', padding: '24px 28px', background: 'var(--card-bg)', border: '1px solid var(--light)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mid)', marginBottom: 12 }}>Jump to category</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
          {sortedCats.map(([category, guides]) => (
            <a
              key={category}
              href={`#${slugify(category)}`}
              style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 15, fontWeight: 500, borderBottom: '1px solid var(--light)', paddingBottom: 2 }}
            >
              {category} <span style={{ color: 'var(--mid)', fontSize: 13 }}>({guides.length})</span>
            </a>
          ))}
        </div>
      </nav>

      {sortedCats.map(([category, guides]) => (
        <div key={category} id={slugify(category)} style={{ marginTop: 48, scrollMarginTop: 80 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 700, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid var(--light)' }}>
            {category} <span style={{ color: 'var(--mid)', fontSize: 16, fontWeight: 400 }}>({guides.length})</span>
          </h2>
          <div className="scg-guides-grid" style={{ padding: 0 }}>
            {guides.map(g => (
              <Link href={`/${g.slug}`} className="scg-guide-card" key={g.slug}>
                <h3>{g.businessType}</h3>
                <div className="scg-guide-card-range">{formatShortRange(g.costLow, g.costHigh)}</div>
                <p style={{ color: 'var(--mid)', fontSize: 14 }}>{g.metaDescription?.slice(0, 100)}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
