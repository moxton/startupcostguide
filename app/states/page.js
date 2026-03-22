import Link from 'next/link';
import guidesIndex from '@/src/data/guides-index.json';
import stateData from '@/src/data/state-data.json';

export const metadata = {
  title: 'Startup Costs by State',
  description:
    'Compare LLC fees, tax rates, and startup costs across all 50 US states. Find state-specific business guides and cost breakdowns for your state.',
  openGraph: {
    title: 'Startup Costs by State | Startup Cost Guide',
    description:
      'Compare LLC fees, tax rates, and startup costs across all 50 US states. Find state-specific business guides and cost breakdowns for your state.',
  },
};

function countGuidesForState(stateSlug) {
  const suffix = `-in-${stateSlug}`;
  return guidesIndex.filter((g) => g.slug.endsWith(suffix)).length;
}

export default function StatesPage() {
  const states = Object.entries(stateData)
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="article-wrap">
      <div className="entry-content">
        <h1>Startup Costs by State</h1>
        <p>
          Every state has different LLC fees, tax rates, and operating costs.
          Pick yours.
        </p>
      </div>

      <div
        className="scg-guides-grid"
        style={{ padding: 0, marginTop: 32 }}
      >
        {states.map((state) => {
          const guideCount = countGuidesForState(state.slug);
          return (
            <Link
              href={`/states/${state.slug}`}
              className="scg-guide-card"
              key={state.slug}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <h3 style={{ margin: 0 }}>{state.name}</h3>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--mid)',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {state.abbr}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: 'var(--mid)',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  LLC fee:{' '}
                  <strong style={{ color: 'var(--ink)' }}>
                    ${state.llcFee}
                  </strong>
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {guideCount} {guideCount === 1 ? 'guide' : 'guides'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
