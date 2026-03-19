import Link from 'next/link';

const POPULAR = [
  { slug: 'cost-to-start-a-restaurant', name: 'Restaurant', range: '$175K - $750K' },
  { slug: 'cost-to-start-a-food-truck', name: 'Food Truck', range: '$28K - $114K' },
  { slug: 'cost-to-start-a-cleaning-business', name: 'Cleaning Business', range: '$2K - $15K' },
];

export default function NotFound() {
  return (
    <div className="article-wrap" style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 800, marginBottom: 16 }}>404</h1>
      <p style={{ fontSize: 18, color: 'var(--mid)', marginBottom: 40 }}>
        This page doesn&apos;t exist. Here are some places to start:
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
        {POPULAR.map(p => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--light)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 180,
            }}
          >
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 16 }}>{p.name}</div>
            <div style={{ color: 'var(--cost-low)', fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 14, marginTop: 4 }}>{p.range}</div>
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: 'var(--ink)',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: 100,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Browse All Guides
        </Link>
        <Link
          href="/calculator"
          style={{
            display: 'inline-block',
            background: 'transparent',
            color: 'var(--ink)',
            padding: '12px 28px',
            borderRadius: 100,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 14,
            border: '1px solid var(--light)',
          }}
        >
          Try the Calculator
        </Link>
      </div>
    </div>
  );
}
