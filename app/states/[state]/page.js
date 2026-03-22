import Link from 'next/link';
import { notFound } from 'next/navigation';
import guidesIndex from '@/src/data/guides-index.json';
import stateData from '@/src/data/state-data.json';
import { formatShortRange } from '@/src/lib/formatCurrency';

export function generateStaticParams() {
  return Object.keys(stateData).map((state) => ({ state }));
}

export async function generateMetadata({ params }) {
  const { state } = await params;
  const stateInfo = stateData[state];
  if (!stateInfo) return {};
  return {
    title: `Startup Costs in ${stateInfo.name} (${stateInfo.abbr})`,
    description: `How much does it cost to start a business in ${stateInfo.name}? LLC fee: $${stateInfo.llcFee}, sales tax: ${(stateInfo.salesTax * 100).toFixed(2)}%, min wage: $${stateInfo.minWage.toFixed(2)}. Browse all ${stateInfo.name} startup cost guides.`,
    openGraph: {
      title: `Startup Costs in ${stateInfo.name} | Startup Cost Guide`,
      description: `Compare startup costs for every business type in ${stateInfo.name}. LLC fee: $${stateInfo.llcFee}, sales tax: ${(stateInfo.salesTax * 100).toFixed(2)}%.`,
    },
  };
}

export default async function StatePage({ params }) {
  const { state } = await params;
  const stateInfo = stateData[state];
  if (!stateInfo) notFound();

  const suffix = `-in-${state}`;
  const stateGuides = guidesIndex
    .filter((g) => g.slug.endsWith(suffix))
    .sort((a, b) => a.businessType.localeCompare(b.businessType));

  const salesTaxPct = (stateInfo.salesTax * 100).toFixed(2);

  return (
    <div className="article-wrap">
      <div className="entry-content">
        <nav
          style={{
            marginBottom: 24,
            fontSize: 14,
            fontFamily: 'var(--sans)',
          }}
        >
          <Link
            href="/states"
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            &larr; All States
          </Link>
        </nav>

        <h1>Startup Costs in {stateInfo.name}</h1>

        {/* Key stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            margin: '28px 0 36px',
          }}
        >
          {[
            { label: 'LLC Filing Fee', value: `$${stateInfo.llcFee}` },
            { label: 'Sales Tax', value: `${salesTaxPct}%` },
            {
              label: 'Minimum Wage',
              value: `$${stateInfo.minWage.toFixed(2)}/hr`,
            },
            { label: 'Guides Available', value: stateGuides.length },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--light)',
                borderRadius: 'var(--radius)',
                padding: '20px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--mid)',
                  marginBottom: 6,
                  fontFamily: 'var(--sans)',
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  fontFamily: 'var(--serif)',
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Business climate */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--light)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            marginBottom: 40,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontFamily: 'var(--serif)',
              fontWeight: 700,
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            Business Climate
          </h2>
          <p
            style={{
              color: 'var(--mid)',
              fontSize: 15,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {stateInfo.businessClimate}
          </p>
        </div>

        {/* Major cities & top industries */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--light)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--mid)',
                marginTop: 0,
                marginBottom: 12,
                fontFamily: 'var(--sans)',
              }}
            >
              Major Cities
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15 }}>
              {stateInfo.majorCities.map((city) => (
                <li key={city} style={{ marginBottom: 4 }}>
                  {city}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--light)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--mid)',
                marginTop: 0,
                marginBottom: 12,
                fontFamily: 'var(--sans)',
              }}
            >
              Top Industries
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15 }}>
              {stateInfo.topIndustries.map((ind) => (
                <li key={ind} style={{ marginBottom: 4 }}>
                  {ind}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* State guides grid */}
        {stateGuides.length > 0 ? (
          <>
            <h2
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: '2px solid var(--light)',
              }}
            >
              {stateInfo.name} Startup Cost Guides{' '}
              <span
                style={{ color: 'var(--mid)', fontSize: 16, fontWeight: 400 }}
              >
                ({stateGuides.length})
              </span>
            </h2>
            <div className="scg-guides-grid" style={{ padding: 0 }}>
              {stateGuides.map((g) => (
                <Link
                  href={`/${g.slug}`}
                  className="scg-guide-card"
                  key={g.slug}
                >
                  <h3>{g.businessType}</h3>
                  <div className="scg-guide-card-range">
                    {formatShortRange(g.costLow, g.costHigh)}
                  </div>
                  <p style={{ color: 'var(--mid)', fontSize: 14 }}>
                    {g.metaDescription?.slice(0, 100)}
                  </p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'var(--card-bg)',
              border: '1px solid var(--light)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p style={{ color: 'var(--mid)', fontSize: 16, margin: 0 }}>
              No state-specific guides for {stateInfo.name} yet. Check out our{' '}
              <Link
                href="/guides"
                style={{ color: 'var(--accent)', fontWeight: 600 }}
              >
                national guides
              </Link>{' '}
              for general cost breakdowns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
