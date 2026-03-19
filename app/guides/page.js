import Link from 'next/link';
import guidesIndex from '@/src/data/guides-index.json';
import categories from '@/src/data/categories.json';
import { formatShortRange } from '@/src/lib/formatCurrency';

export const metadata = {
  title: 'All 100 Startup Cost Guides',
  description: 'Browse detailed startup cost breakdowns for 100 business types. Line-item costs, hidden expenses, and breakeven timelines for every industry.',
};

export default function GuidesPage() {
  // Group guides by category
  const grouped = {};
  for (const guide of guidesIndex) {
    if (!grouped[guide.category]) grouped[guide.category] = [];
    grouped[guide.category].push(guide);
  }

  // Sort categories by guide count (most first)
  const sortedCats = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="article-wrap">
      <div className="entry-content">
        <h1>All 100 Startup Cost Guides</h1>
        <p>Every business type we cover. Pick one and get the real numbers.</p>
      </div>

      {sortedCats.map(([category, guides]) => (
        <div key={category} style={{ marginTop: 48 }}>
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
