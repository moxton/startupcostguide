#!/usr/bin/env node
/**
 * Build-time data pipeline: converts WordPress CSV/HTML source files into JSON
 * for the Next.js site. Run with: node scripts/build-data.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE = join(ROOT, '..', 'claude build 1');
const DATA_DIR = join(ROOT, 'src', 'data');
const GUIDES_DIR = join(DATA_DIR, 'guides');
const BLOG_DIR = join(DATA_DIR, 'blog');

// Ensure output directories exist
[DATA_DIR, GUIDES_DIR, BLOG_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

// ============================================================
// STEP 1: Parse CSV into guide JSON files
// ============================================================
console.log('Parsing wp-import-100.csv...');
const csvContent = readFileSync(join(SOURCE, 'wp-import-100.csv'), 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
});

const guidesIndex = [];

for (const record of records) {
  const slug = record.post_slug;
  if (!slug) continue;

  // Build index entry (lightweight)
  guidesIndex.push({
    title: record.post_title,
    slug,
    category: record.category,
    businessType: record.business_type,
    costLow: parseInt(record.total_cost_low) || 0,
    costHigh: parseInt(record.total_cost_high) || 0,
    metaDescription: record.meta_rank_math_description,
    focusKeyword: record.meta_rank_math_focus_keyword,
    facebookTitle: record.meta_rank_math_facebook_title,
    facebookDescription: record.meta_rank_math_facebook_description,
  });

  // Strip personal author bio and inline personal references from content
  let cleanContent = record.post_content;
  cleanContent = cleanContent.replace(/<hr>\s*<h2>About the Author<\/h2>\s*<p>.*?<\/p>/s, '');
  // Replace inline Night Shift personal reference in brewery guide
  cleanContent = cleanContent.replace(
    /I started Night Shift Brewing for \$180,000 in 2012 - today that same setup would cost \$250,000\+\./g,
    'A typical craft brewery startup in 2012 cost around $180,000  - today that same setup would cost $250,000+.'
  );

  // Build full guide file
  const guideData = {
    title: record.post_title,
    slug,
    category: record.category,
    businessType: record.business_type,
    costLow: parseInt(record.total_cost_low) || 0,
    costHigh: parseInt(record.total_cost_high) || 0,
    content: cleanContent,
    metaDescription: record.meta_rank_math_description,
    focusKeyword: record.meta_rank_math_focus_keyword,
    faqSchema: record.meta_rank_math_schema_FAQPage || '',
    facebookTitle: record.meta_rank_math_facebook_title,
    facebookDescription: record.meta_rank_math_facebook_description,
  };

  writeFileSync(join(GUIDES_DIR, `${slug}.json`), JSON.stringify(guideData));
}

writeFileSync(join(DATA_DIR, 'guides-index.json'), JSON.stringify(guidesIndex, null, 2));
console.log(`  → ${guidesIndex.length} guides parsed`);

// ============================================================
// STEP 2: Extract calculator data from HTML
// ============================================================
console.log('Extracting calculator data...');
const calcHtml = readFileSync(join(SOURCE, 'startup-cost-calculator.html'), 'utf-8');

// Extract the DATA array
const dataMatch = calcHtml.match(/const DATA\s*=\s*(\[[\s\S]*?\]);/);
if (dataMatch) {
  const calculatorData = JSON.parse(dataMatch[1]);

  // Extract POPULAR_SLUGS
  const popularMatch = calcHtml.match(/const POPULAR_SLUGS\s*=\s*(\[[\s\S]*?\]);/);
  const popularSlugs = popularMatch ? JSON.parse(popularMatch[1].replace(/'/g, '"')) : [];

  writeFileSync(join(DATA_DIR, 'calculator-data.json'), JSON.stringify({
    businesses: calculatorData,
    popularSlugs,
  }));
  console.log(`  → ${calculatorData.length} businesses extracted for calculator`);
} else {
  console.error('  ✗ Could not extract DATA array from calculator HTML');
}

// ============================================================
// STEP 3: Parse category pages
// ============================================================
console.log('Parsing category pages...');
const catHtml = readFileSync(join(SOURCE, 'category-pages.html'), 'utf-8');

// Split on the PAGE comment markers
const catSections = catHtml.split(/<!-- =+ -->\s*<!-- PAGE \d+:/);
const categories = [];

for (let i = 1; i < catSections.length; i++) {
  const section = catSections[i];

  // Extract slug from comment
  const slugMatch = section.match(/Slug:\s*(\S+)/);
  const seoTitleMatch = section.match(/SEO Title:\s*(.+?)(?:\s*-->|\n)/);
  const metaMatch = section.match(/Meta:\s*(.+?)(?:\s*-->|\n)/);

  if (!slugMatch) continue;

  const slug = slugMatch[1];

  // Extract the HTML content (after the closing comment -->)
  const contentStart = section.indexOf('-->');
  const content = contentStart >= 0 ? section.slice(contentStart + 3).trim() : '';

  // Remove trailing <hr> if present
  const cleanContent = content.replace(/<hr\s*\/?>[\s]*$/, '').trim();

  // Extract the H1 title
  const h1Match = cleanContent.match(/<h1>(.*?)<\/h1>/);
  const title = h1Match ? h1Match[1] : slug;

  categories.push({
    title,
    slug,
    seoTitle: seoTitleMatch ? seoTitleMatch[1].trim() : title,
    metaDescription: metaMatch ? metaMatch[1].trim() : '',
    content: cleanContent,
  });
}

writeFileSync(join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2));
console.log(`  → ${categories.length} categories parsed`);

// ============================================================
// STEP 4: Parse blog posts
// ============================================================
console.log('Parsing blog posts...');
const blogFiles = [
  { file: 'blog-01-businesses-under-5k.html', slug: 'businesses-you-can-start-for-under-5000' },
  { file: 'blog-02-real-cost-starting-business.html', slug: 'real-cost-of-starting-a-business' },
  // blog-03 (Night Shift personal story) removed  - replaced with static JSON
  { file: 'blog-04-hidden-costs.html', slug: 'hidden-costs-that-sink-businesses' },
  { file: 'blog-05-cheapest-way-to-start.html', slug: 'cheapest-way-to-start-every-business' },
];

const blogIndex = [];

for (const blog of blogFiles) {
  const html = readFileSync(join(SOURCE, blog.file), 'utf-8');

  // Extract metadata from HTML comments
  const titleMatch = html.match(/BLOG POST:\s*(.+?)(?:\n|$)/);
  const slugMatch = html.match(/Slug:\s*\/blog\/(.+?)\//);
  const seoTitleMatch = html.match(/SEO Title:\s*(.+?)(?:\n|$)/);
  const metaMatch = html.match(/Meta Description:\s*(.+?)(?:\n|$)/);
  const keywordMatch = html.match(/Focus Keyword:\s*(.+?)(?:\n|$)/);

  const slug = slugMatch ? slugMatch[1] : blog.slug;

  // Extract content (everything after the closing comment -->)
  const contentStart = html.indexOf('-->');
  const content = contentStart >= 0 ? html.slice(contentStart + 3).trim() : html;

  // Extract H1 title from content
  const h1Match = content.match(/<h1>(.*?)<\/h1>/);
  const title = h1Match ? h1Match[1] : (titleMatch ? titleMatch[1].trim() : blog.slug);

  // Strip any personal references from blog content
  let blogContent = content;
  blogContent = blogContent.replace(/I spent \$180,000 starting <a href="\/about\/">Night Shift Brewing<\/a> in 2012\. If I could do it over, I'd change one thing: I'd have had 30% more cash than I thought I needed\. Every unexpected cost - buildout overruns, delayed permits, equipment failures, slow initial sales - was survivable because we eventually found the money\. But the stress of scrambling for cash while simultaneously trying to launch a business is a tax on your decision-making and your health\./g,
    'One brewery founder spent $180,000 launching in 2012 and told us the one thing they\'d change: having 30% more cash than they thought they needed. Every unexpected cost  - buildout overruns, delayed permits, equipment failures, slow initial sales  - was survivable because they eventually found the money. But the stress of scrambling for cash while simultaneously trying to launch a business is a tax on your decision-making and your health.');
  blogContent = blogContent.replace(/<hr>\s*<p><em><a href="\/about\/">Read more about my background<\/a>.*?<\/em><\/p>/s, '');

  const blogData = {
    title,
    slug,
    seoTitle: seoTitleMatch ? seoTitleMatch[1].trim() : title,
    metaDescription: metaMatch ? metaMatch[1].trim() : '',
    focusKeyword: keywordMatch ? keywordMatch[1].trim() : '',
    content: blogContent,
  };

  writeFileSync(join(BLOG_DIR, `${slug}.json`), JSON.stringify(blogData));

  blogIndex.push({
    title,
    slug,
    seoTitle: blogData.seoTitle,
    metaDescription: blogData.metaDescription,
  });
}

// ============================================================
// STEP 5: Parse new blog posts from /files/ directory
// ============================================================
console.log('Parsing new blog posts from files/...');
const FILES_DIR = join(ROOT, '..', 'files');
const newBlogFiles = [
  { file: 'blog-06-save-before-quitting.html', slug: 'how-much-to-save-before-starting-a-business' },
  { file: 'blog-07-llc-vs-sole-prop.html', slug: 'llc-vs-sole-proprietorship-cost-breakdown' },
  { file: 'blog-08-first-year-hidden-costs.html', slug: 'first-year-costs-nobody-warns-you-about' },
  { file: 'blog-09-businesses-under-1000.html', slug: 'businesses-you-can-start-for-under-1000' },
  { file: 'blog-10-self-employment-tax.html', slug: 'self-employment-tax-surprise' },
  { file: 'blog-11-profitable-year-one.html', slug: 'businesses-most-likely-profitable-year-one' },
  { file: 'blog-12-start-with-no-money.html', slug: 'how-to-start-a-business-with-no-money' },
  { file: 'blog-13-funding-your-business.html', slug: 'how-real-owners-fund-their-businesses' },
  { file: 'blog-14-gen-z-businesses.html', slug: 'gen-z-businesses-2026' },
  { file: 'blog-15-why-businesses-fail.html', slug: 'why-businesses-fail' },
  { file: 'blog-16-cheapest-states.html', slug: 'cheapest-states-to-start-a-business' },
  { file: 'blog-17-franchise-vs-independent.html', slug: 'franchise-vs-independent-cost-comparison' },
  { file: 'blog-18-pricing-your-services.html', slug: 'how-to-price-your-services' },
  { file: 'blog-19-essential-tools.html', slug: 'essential-tools-for-new-business-owners' },
  { file: 'blog-20-business-insurance.html', slug: 'business-insurance-nobody-tells-you-about' },
];

// Build set of valid guide slugs for link validation
const validGuideSlugs = new Set(guidesIndex.map(g => g.slug));

function fixBlogLinks(html) {
  // Fix calculator route
  html = html.replace(/href="\/startup-cost-calculator\/"/g, 'href="/calculator"');
  // Fix grammar errors in guide slugs
  html = html.replace(/href="\/cost-to-start-a-auto-/g, 'href="/cost-to-start-an-auto-');
  html = html.replace(/href="\/cost-to-start-a-ecommerce-/g, 'href="/cost-to-start-an-ecommerce-');
  // Strip trailing slashes from internal guide/page links (but not external links)
  html = html.replace(/href="(\/[^"]+?)\/"/g, 'href="$1"');
  // Remove links to non-existent guides (replace with just the text)
  html = html.replace(/<a href="\/cost-to-start-a-supplement-business">[^<]*<\/a>/g, (match) => {
    const textMatch = match.match(/>([^<]*)</);
    return textMatch ? textMatch[1] : match;
  });
  return html;
}

for (const blog of newBlogFiles) {
  const filePath = join(FILES_DIR, blog.file);
  if (!existsSync(filePath)) {
    console.warn(`  ⚠ Missing file: ${blog.file}`);
    continue;
  }
  const html = readFileSync(filePath, 'utf-8');

  // Extract metadata from comment block (Title:, Meta Description:, Focus Keyword:)
  const titleMatch = html.match(/Title:\s*(.+?)(?:\n|$)/);
  const metaMatch = html.match(/Meta Description:\s*(.+?)(?:\n|$)/);
  const keywordMatch = html.match(/Focus Keyword:\s*(.+?)(?:\n|$)/);

  // Extract content (everything after the closing comment -->)
  const contentStart = html.indexOf('-->');
  let content = contentStart >= 0 ? html.slice(contentStart + 3).trim() : html;

  // Fix internal links
  content = fixBlogLinks(content);

  // Extract H1 title from content (or use metadata title)
  const h1Match = content.match(/<h1>(.*?)<\/h1>/);
  const title = h1Match ? h1Match[1] : (titleMatch ? titleMatch[1].trim() : blog.slug);
  const seoTitle = titleMatch ? `${titleMatch[1].trim()} | Startup Cost Guide` : title;

  const blogData = {
    title,
    slug: blog.slug,
    seoTitle,
    metaDescription: metaMatch ? metaMatch[1].trim() : '',
    focusKeyword: keywordMatch ? keywordMatch[1].trim() : '',
    content,
  };

  writeFileSync(join(BLOG_DIR, `${blog.slug}.json`), JSON.stringify(blogData));

  blogIndex.push({
    title,
    slug: blog.slug,
    seoTitle: blogData.seoTitle,
    metaDescription: blogData.metaDescription,
  });
}
console.log(`  → ${newBlogFiles.length} new blog posts parsed from files/`);

// Write replacement blog post for the removed Night Shift personal story
const fundingBlog = {
  title: 'How to Fund Your First Business: 7 Real Options Ranked',
  slug: 'how-to-fund-your-first-business',
  seoTitle: 'How to Fund Your First Business: 7 Real Options Ranked | Startup Cost Guide',
  metaDescription: '7 realistic funding options for first-time business owners, ranked by accessibility and risk. Personal savings, SBA loans, friends & family, and more.',
  focusKeyword: 'how to fund a business',
  content: `<h1>How to Fund Your First Business: 7 Real Options Ranked</h1>

<p>You've figured out what your business will cost to start. Now comes the harder question: where does the money come from? Here are seven realistic funding options for first-time business owners, ranked from most accessible to least.</p>

<h2>1. Personal Savings (Most Common)</h2>
<p>The majority of small businesses are funded with personal savings. It's the simplest path  - no applications, no interest, no one else's timeline. The obvious risk is that you're putting your own financial security on the line. The rule of thumb: only invest what you could afford to lose without it devastating your household finances.</p>

<h2>2. Friends &amp; Family</h2>
<p>The second most common funding source for first-time founders. Keep it professional: put the terms in writing, be clear about risks, and treat it like a real investment  - because it is. The relationships are worth more than the money, so structure it in a way that survives the business failing.</p>

<h2>3. SBA Microloans ($500–$50,000)</h2>
<p>The SBA microloan program offers up to $50,000 through nonprofit intermediary lenders. Interest rates are typically 8–13%, and the application process is less intimidating than a traditional bank loan. These are specifically designed for startups and new businesses that lack the track record for conventional lending.</p>

<h2>4. SBA 7(a) Loans (Up to $5M)</h2>
<p>The flagship SBA loan program. The SBA doesn't lend directly  - it guarantees a portion of the loan, which makes banks more willing to lend to small businesses. You'll need a solid business plan, reasonable credit (680+), and typically some collateral. Processing takes 30–90 days.</p>

<h2>5. Business Credit Cards</h2>
<p>Not ideal for large startup costs, but useful for bridging gaps and covering early operating expenses. Many business cards offer 0% APR for 12–15 months, which is essentially a free short-term loan if you can pay it off. The danger is obvious: 20%+ interest rates after the intro period.</p>

<h2>6. Equipment Financing</h2>
<p>If your biggest startup cost is equipment (food trucks, salon chairs, pressure washers, brewing systems), equipment financing lets you spread the cost over 2–7 years with the equipment itself as collateral. Approval is often easier than unsecured loans because the lender can repossess the equipment if you default.</p>

<h2>7. Crowdfunding</h2>
<p>Platforms like Kickstarter and Indiegogo work for product-based businesses with a compelling story. Service businesses rarely succeed here. The hidden cost: a successful campaign requires significant upfront marketing effort and ongoing fulfillment obligations. It's not free money  - it's pre-selling with extra steps.</p>

<h2>The Funding Mistake That Sinks Businesses</h2>
<p>Under-capitalization. It's not failing to raise enough money to open  - it's failing to raise enough money to survive the first 3–6 months of operations when revenue is lower than projected. Whatever your startup cost estimate is, add 20–30% as an operating cash buffer. If you don't need it, you'll have a comfortable reserve. If you do need it  - and you probably will  - it's the difference between a challenging start and a failed one.</p>

<hr>
<p><em>Browse our <a href="/">full library of business cost guides</a> for detailed breakdowns of every business type.</em></p>`,
};

writeFileSync(join(BLOG_DIR, `${fundingBlog.slug}.json`), JSON.stringify(fundingBlog));
blogIndex.push({
  title: fundingBlog.title,
  slug: fundingBlog.slug,
  seoTitle: fundingBlog.seoTitle,
  metaDescription: fundingBlog.metaDescription,
});
console.log('  → Wrote replacement blog post: how-to-fund-your-first-business');

writeFileSync(join(DATA_DIR, 'blog-index.json'), JSON.stringify(blogIndex, null, 2));
console.log(`  → ${blogIndex.length} blog posts parsed`);

console.log('\nDone! Data files written to src/data/');
