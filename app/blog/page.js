import Link from 'next/link';
import blogIndex from '@/src/data/blog-index.json';

export const metadata = {
  title: 'Blog',
  description: 'Insights on startup costs, business funding, and the real economics of entrepreneurship.',
};

export default function BlogPage() {
  return (
    <div className="article-wrap">
      <div className="entry-content">
        <h1>Blog</h1>
        <p>Insights on startup costs, business funding, and the real economics of entrepreneurship.</p>
      </div>
      <div style={{ marginTop: 32 }}>
        {blogIndex.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{
              display: 'block',
              background: 'var(--card-bg)',
              border: '1px solid var(--light)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              marginBottom: 16,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'var(--transition)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              {post.title}
            </h2>
            <p style={{ color: 'var(--mid)', fontSize: 15, margin: 0 }}>
              {post.metaDescription}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
