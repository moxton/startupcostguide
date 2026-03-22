import Link from 'next/link';
import guidesIndex from '@/src/data/guides-index.json';
import categories from '@/src/data/categories.json';
import { formatShortRange } from '@/src/lib/formatCurrency';
import GuidesSearch from '@/src/components/GuidesSearch';

export const metadata = {
  title: 'All 100+ Startup Cost Guides',
  description: 'Browse detailed startup cost breakdowns for 100+ business types. Line-item costs, hidden expenses, and breakeven timelines for every industry.',
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function GuidesPage() {
  const grouped = {};
  for (const guide of guidesIndex) {
    if (!grouped[guide.category]) grouped[guide.category] = [];
    grouped[guide.category].push(guide);
  }

  const sortedCats = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="article-wrap">
      <div className="entry-content">
        <h1>All 100+ Startup Cost Guides</h1>
        <p>Every business type we cover. Pick one and get the real numbers.</p>
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
