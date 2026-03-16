import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readFileSync } from 'fs';
import { join } from 'path';
import guidesIndex from '@/src/data/guides-index.json';
import categories from '@/src/data/categories.json';
import { formatRange } from '@/src/lib/formatCurrency';

// Generate static params for all guides + categories
export async function generateStaticParams() {
  const guideSlugs = guidesIndex.map(g => ({ slug: g.slug }));
  const catSlugs = categories.map(c => ({ slug: c.slug }));
  return [...guideSlugs, ...catSlugs];
}

// Generate metadata per page
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const guide = guidesIndex.find(g => g.slug === slug);
  if (guide) {
    return {
      title: guide.title,
      description: guide.metaDescription,
      openGraph: {
        title: guide.facebookTitle || guide.title,
        description: guide.facebookDescription || guide.metaDescription,
      },
    };
  }

  const category = categories.find(c => c.slug === slug);
  if (category) {
    return {
      title: category.seoTitle,
      description: category.metaDescription,
    };
  }

  return { title: 'Not Found' };
}

function loadGuideContent(slug) {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'guides', `${slug}.json`);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export default async function SlugPage({ params }) {
  const { slug } = await params;

  // Check if it's a guide
  const guideIndex = guidesIndex.find(g => g.slug === slug);
  if (guideIndex) {
    const guide = loadGuideContent(slug);
    if (!guide) notFound();

    return (
      <article className="article-wrap">
        <div className="category-badge">{guide.category}</div>
        <div className="cost-badge">{formatRange(guide.costLow, guide.costHigh)}</div>
        <div className="entry-content" dangerouslySetInnerHTML={{ __html: guide.content }} />
        {guide.faqSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: guide.faqSchema }}
          />
        )}
      </article>
    );
  }

  // Check if it's a category
  const category = categories.find(c => c.slug === slug);
  if (category) {
    // Find guides in this category
    const catGuides = guidesIndex.filter(g => {
      const catName = category.title
        .replace(' Business Startup Costs', '')
        .replace(' Startup Costs', '');
      const gCat = g.category.replace(' Businesses', '').replace(' Business', '');
      return gCat === catName || g.category.toLowerCase().includes(catName.toLowerCase());
    });

    return (
      <article className="article-wrap">
        <div className="entry-content" dangerouslySetInnerHTML={{ __html: category.content }} />
        {catGuides.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
              All {category.title.replace(' Business Startup Costs', '').replace(' Startup Costs', '')} Guides
            </h2>
            <div className="scg-guides-grid" style={{ padding: 0 }}>
              {catGuides.map(g => (
                <Link href={`/${g.slug}`} className="scg-guide-card" key={g.slug}>
                  <h3>{g.businessType}</h3>
                  <div className="scg-guide-card-range">
                    {formatRange(g.costLow, g.costHigh)}
                  </div>
                  <p style={{ color: 'var(--mid)', fontSize: 14 }}>{g.metaDescription?.slice(0, 120)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    );
  }

  notFound();
}
