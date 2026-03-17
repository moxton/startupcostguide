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
  // Map category page titles to the category values in guides-index
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
          <p>Not the vague &ldquo;it depends&rdquo; answer. Real cost breakdowns with line items, hidden expenses, and the numbers most guides leave out.</p>
        </div>
      </section>

      {/* FEATURED GUIDES */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>
        <div className="scg-section-label" style={{ color: 'var(--mid)' }}>Most Popular</div>
        <h2 className="scg-section-title" style={{ color: 'var(--ink)' }}>Featured Cost Guides</h2>
        <p style={{ color: 'var(--mid)', fontSize: 18, marginBottom: 48 }}>
          The highest-demand business types with the deepest cost breakdowns.
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
          <h2 className="scg-section-title" style={{ color: '#fff' }}>Every Business Type, Covered</h2>
          <p style={{ color: '#9ca3af', fontSize: 18, marginBottom: 40 }}>
            Detailed cost breakdowns organized by industry.
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

      {/* CREDIBILITY BANNER */}
      <section className="scg-cred">
        <div className="scg-cred-inner">
          <div className="scg-cred-avatar">SCG</div>
          <div>
            <h3>Why trust these numbers?</h3>
            <p>
              <strong>Most startup cost guides are useless.</strong> Not because the writers are lazy, but because they&apos;re copying each other. Article A cites Article B cites Article C, and somewhere back there someone just made a number up. We built Startup Cost Guide because we got tired of it. Every breakdown here is researched from scratch: SBA data, industry reports, and real conversations with people who&apos;ve actually opened these businesses.{' '}
              <Link href="/methodology">Read our methodology &rarr;</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ESSENTIAL TOOLS */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>
        <div className="scg-section-label" style={{ color: 'var(--mid)' }}>Recommended</div>
        <h2 className="scg-section-title" style={{ color: 'var(--ink)' }}>Essential Tools for New Business Owners</h2>
        <p style={{ color: 'var(--mid)', fontSize: 18, marginBottom: 40 }}>
          Regardless of what you&apos;re starting, you&apos;ll need some combination of these.
        </p>

        <p><strong>Business Formation:</strong> <a href="/recommends/legalzoom/" rel="nofollow sponsored" target="_blank">LegalZoom</a> — Form your LLC, get your EIN, and handle basic legal setup in one place.</p>
        <p><strong>Accounting:</strong> <a href="/recommends/quickbooks/" rel="nofollow sponsored" target="_blank">QuickBooks</a> — Track income, expenses, mileage, and taxes from day one.</p>
        <p><strong>Business Insurance:</strong> <a href="/recommends/next-insurance/" rel="nofollow sponsored" target="_blank">Next Insurance</a> — General liability, professional liability, and commercial auto quotes in minutes.</p>
        <p><strong>Payments:</strong> <a href="/recommends/square-pos/" rel="nofollow sponsored" target="_blank">Square</a> — Accept card payments from day one. Free reader, simple pricing.</p>
        <p><strong>Payroll:</strong> <a href="/recommends/gusto-payroll/" rel="nofollow sponsored" target="_blank">Gusto</a> — When you hire your first employee, Gusto handles payroll, taxes, and benefits.</p>

        <p style={{ fontSize: 13, color: 'var(--mid)', fontStyle: 'italic', padding: '12px 16px', background: '#fafaf8', borderRadius: 8, borderLeft: '3px solid var(--light)', marginTop: 24 }}>
          Some links above are affiliate links. We may earn a commission if you sign up — at no extra cost to you. We only recommend tools we&apos;d use ourselves.
        </p>
      </div>
    </>
  );
}
