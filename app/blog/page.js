import Link from 'next/link';
import blogIndex from '@/src/data/blog-index.json';

export const metadata = {
  title: 'Blog',
  description: 'Insights on startup costs, business funding, and the real economics of entrepreneurship.',
};

export default function BlogPage() {
  const featured = blogIndex.slice(0, 3);
  const rest = blogIndex.slice(3);

  return (
    <div className="article-wrap">
      <div className="entry-content">
        <h1>Blog</h1>
        <p>Insights on startup costs, business funding, and the real economics of entrepreneurship.</p>
      </div>

      {/* Featured posts - larger cards */}
      <div className="blog-featured-grid" style={{ marginTop: 32 }}>
        {featured.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-featured-card">
            <h2>{post.title}</h2>
            <p>{post.metaDescription?.slice(0, 160)}</p>
          </Link>
        ))}
      </div>

      {/* Remaining posts - compact list */}
      {rest.length > 0 && (
        <div className="blog-list">
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-list-item">
              <h3>{post.title}</h3>
              <p>{post.metaDescription?.slice(0, 120)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
