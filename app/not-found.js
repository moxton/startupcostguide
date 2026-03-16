import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="article-wrap" style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 800, marginBottom: 16 }}>404</h1>
      <p style={{ fontSize: 18, color: 'var(--mid)', marginBottom: 32 }}>
        This page doesn&apos;t exist. Maybe you&apos;re looking for one of our cost guides?
      </p>
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
    </div>
  );
}
