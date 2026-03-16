import { notFound } from 'next/navigation';
import { readFileSync } from 'fs';
import { join } from 'path';
import blogIndex from '@/src/data/blog-index.json';

export async function generateStaticParams() {
  return blogIndex.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = blogIndex.find(p => p.slug === slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.seoTitle || post.title,
    description: post.metaDescription,
  };
}

function loadBlogPost(slug) {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'blog', `${slug}.json`);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = loadBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="article-wrap">
      <div className="entry-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
