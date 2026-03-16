import guidesIndex from '@/src/data/guides-index.json';
import categories from '@/src/data/categories.json';
import blogIndex from '@/src/data/blog-index.json';

const BASE_URL = 'https://startupcostguide.com';

export default function sitemap() {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/methodology`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  const guidePages = guidesIndex.map(g => ({
    url: `${BASE_URL}/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const categoryPages = categories.map(c => ({
    url: `${BASE_URL}/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const blogPages = blogIndex.map(p => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...guidePages, ...categoryPages, ...blogPages];
}
