import Link from 'next/link';
import guidesIndex from '@/src/data/guides-index.json';
import categories from '@/src/data/categories.json';
import { formatShortRange } from '@/src/lib/formatCurrency';

const FEATURED_SLUGS = [
  'cost-to-start-a-restaurant',
  'cost-to-start-a-food-truck',
  'cost-to-start-a-cleaning-business',
  'cost-to-start-a-coffee-shop',
  'cost-to-start-a-gym',
  'cost-to-start-a-pressure-washing-business',
];

function getGuideCount(categoryTitle) {
  const normalized = categoryTitle
    .replace(' Business Startup Costs', '')
    .replace(' Startup Costs', '');
  return guidesIndex.filter(g => {
    const gCat = g.category.replace(' Businesses', '').replace(' Business', '');
    return gCat === normalized || g.category.toLowerCase().includes(normalized.toLowerCase());
  }).length;
}

export default function HomePage() {
  const featured = FEATURED_SLUGS
    .map(slug => guidesIndex.find(g => g.slug === slug))
    .filter(Boolean);

  return (
    <>
      {/* HERO */}
      <section className="scg-hero">
        <div className="scg-hero-inner">
          <div className="scg-hero-badge">Researched from scratch, not copied</div>
          <h1>How Much Does It <em>Really</em> Cost to Start a Business?</h1>
          <p>Real cost breakdowns for 100+ business types. Line items, hidden costs, breakeven timelines.</p>
          <div className="scg-hero-ctas">
            <Link href="/guides" className="scg-hero-btn scg-hero-btn-primary">Browse All Guides</Link>
            <Link href="/calculator" className="scg-hero-btn scg-hero-btn-secondary">Try the Calculator</Link>
          </div>
        </div>
      </section>

      {/* FEATURED GUIDES */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>
        <div className="scg-section-label" style={{ color: 'var(--mid)' }}>Most Popular</div>
        <h2 className="scg-section-title" style={{ color: 'var(--ink)' }}>Featured Cost Guides</h2>
        <p style={{ color: 'var(--mid)', fontSize: 18, marginBottom: 48 }}>
          The most-searched business types with full cost breakdowns.
        </p>
      </div>

      <div className="scg-guides-grid">
        {featured.map(guide => (
          <Link href={`/${guide.slug}`} className="scg-guide-card" key={guide.slug}>
            <div className="scg-guide-card-category">{guide.category}</div>
            <h3>{guide.businessType}</h3>
            <div className="scg-guide-card-range">{formatShortRange(guide.costLow, guide.costHigh)}</div>
            <p>{guide.metaDescription?.slice(0, 140)}</p>
          </Link>
        ))}
      </div>

      {/* CATEGORIES */}
      <section className="scg-categories" style={{ marginTop: 64 }}>
        <div className="scg-categories-inner">
          <div className="scg-section-label">Browse by Category</div>
          <h2 className="scg-section-title" style={{ color: '#fff' }}>Pick Your Industry</h2>
          <p style={{ color: '#9ca3af', fontSize: 18, marginBottom: 40 }}>
            100+ businesses across 11 categories. Every cost accounted for.
          </p>
          <div className="scg-cat-grid">
            {categories.map(cat => {
              const count = getGuideCount(cat.title);
              return (
                <Link href={`/${cat.slug}`} className="scg-cat-pill" key={cat.slug}>
                  {cat.title.replace(' Business Startup Costs', '').replace(' Startup Costs', '')}
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {count > 0 ? `${count} guide${count !== 1 ? 's' : ''}` : 'Coming soon'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CREDIBILITY */}
      <section className="scg-cred">
        <div className="scg-cred-inner">
          <h3>Why trust these numbers?</h3>
          <p>
            <strong>Most startup cost guides are useless.</strong> Not because the writers are lazy. Because they&apos;re copying each other. Article A cites Article B cites Article C. Somewhere back there, someone made a number up. We got tired of it. Every breakdown here starts from scratch: SBA data, industry reports, conversations with people who actually opened these businesses.{' '}
            <Link href="/methodology">See how we do it &rarr;</Link>
          </p>
        </div>
      </section>

      {/* COMMUNITY DATA CTA */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 80px', textAlign: 'center' }}>
        <div className="cost-submit-card" style={{ background: 'var(--ink)', color: '#fff', border: 'none', padding: '48px 40px' }}>
          <h3 style={{ color: 'var(--accent)', fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 12 }}>You started a business. What did it actually cost?</h3>
          <p style={{ color: '#9ca3af', fontSize: 15, marginBottom: 24, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 24px' }}>
            We&apos;re collecting real startup costs from real owners. Anonymous. 60 seconds. The next person planning your type of business will thank you.
          </p>
          <Link href="/guides" style={{ display: 'inline-block', background: 'var(--accent)', color: 'var(--ink)', padding: '12px 28px', borderRadius: 100, fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em', textDecoration: 'none' }}>
            Find Your Business &amp; Share
          </Link>
        </div>
      </div>
    </>
  );
}
