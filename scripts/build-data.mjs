#!/usr/bin/env node
/**
 * Build-time data pipeline: converts WordPress CSV/HTML source files into JSON
 * for the Next.js site. Run with: node scripts/build-data.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
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

// ============================================================
// STEP 6: Merge JSON-native guides into guides-index.json
// ============================================================
console.log('Merging JSON-native guides into index...');
const existingSlugs = new Set(guidesIndex.map(g => g.slug));
const guideFiles = readdirSync(GUIDES_DIR).filter(f => f.endsWith('.json'));
let jsonNativeCount = 0;

for (const file of guideFiles) {
  const slug = file.replace('.json', '');
  if (existingSlugs.has(slug)) continue;

  // This is a JSON-native guide not from the CSV import
  const guideData = JSON.parse(readFileSync(join(GUIDES_DIR, file), 'utf-8'));
  guidesIndex.push({
    title: guideData.title || '',
    slug: guideData.slug || slug,
    category: guideData.category || '',
    businessType: guideData.businessType || '',
    costLow: guideData.costLow || 0,
    costHigh: guideData.costHigh || 0,
    metaDescription: guideData.metaDescription || '',
    focusKeyword: guideData.focusKeyword || '',
    facebookTitle: guideData.facebookTitle || '',
    facebookDescription: guideData.facebookDescription || '',
  });
  existingSlugs.add(slug);
  jsonNativeCount++;
}

// Re-write the updated guides index
writeFileSync(join(DATA_DIR, 'guides-index.json'), JSON.stringify(guidesIndex, null, 2));
console.log(`  → ${jsonNativeCount} JSON-native guides merged into index (${guidesIndex.length} total)`);

// ============================================================
// STEP 7: Append calculator data for new guides
// ============================================================
console.log('Appending calculator data for new guides...');
const calcDataRaw = JSON.parse(readFileSync(join(DATA_DIR, 'calculator-data.json'), 'utf-8'));
const existingCalcSlugs = new Set(calcDataRaw.businesses.map(b => b.slug));

const newCalcEntries = [
  {
    biz: "AI Consulting Business",
    slug: "cost-to-start-an-ai-consulting-business",
    cat: "Online",
    low: 5000,
    high: 50000,
    beLo: 2,
    beHi: 6,
    costs: [
      { name: "AI/ML Tools & API Credits", low: 1000, high: 10000, type: "one-time" },
      { name: "Professional Website & Portfolio", low: 500, high: 5000, type: "one-time" },
      { name: "Business Formation & E&O Insurance", low: 500, high: 3000, type: "one-time" },
      { name: "Training & Certifications", low: 1000, high: 8000, type: "one-time" },
      { name: "Marketing & Lead Generation", low: 500, high: 5000, type: "one-time" },
      { name: "Hardware (GPU workstation or cloud)", low: 1000, high: 15000, type: "one-time" },
      { name: "CRM & Project Management Software", low: 200, high: 1200, type: "recurring-annual" },
      { name: "Cloud Computing Credits", low: 100, high: 2000, type: "recurring-monthly" }
    ],
    hidden: [
      { name: "Rapid Skill Obsolescence", cost: "AI frameworks change every 3-6 months; budget $2,000-$5,000/year for continuous learning and certifications" },
      { name: "Free Competitor Problem", cost: "Clients increasingly expect free AI advice before paying; plan for 30-40% of sales calls yielding no contract" },
      { name: "Liability Insurance Gaps", cost: "Standard E&O policies may exclude AI-specific claims; specialized coverage runs $2,000-$6,000/year" },
      { name: "API Cost Overruns on Client Projects", cost: "A single proof-of-concept can consume $500-$2,000 in API credits that clients refuse to reimburse" }
    ]
  },
  {
    biz: "AI Automation Agency",
    slug: "cost-to-start-an-ai-automation-agency",
    cat: "Online",
    low: 8000,
    high: 75000,
    beLo: 3,
    beHi: 8,
    costs: [
      { name: "Automation Platform Licenses", low: 1500, high: 12000, type: "recurring-annual" },
      { name: "AI API Credits & Subscriptions", low: 500, high: 5000, type: "recurring-monthly" },
      { name: "Website & Sales Funnel", low: 1000, high: 8000, type: "one-time" },
      { name: "Business Formation & Insurance", low: 500, high: 3000, type: "one-time" },
      { name: "Developer Tools & Testing Environments", low: 500, high: 5000, type: "one-time" },
      { name: "Marketing & Content Creation", low: 1000, high: 10000, type: "one-time" },
      { name: "Contract & Legal Templates", low: 500, high: 3000, type: "one-time" },
      { name: "Working Capital (first 3 months)", low: 2000, high: 20000, type: "one-time" }
    ],
    hidden: [
      { name: "Scope Creep on Automation Projects", cost: "Clients routinely add 'just one more workflow' - expect 20-40% of projects to exceed original scope without additional payment" },
      { name: "Platform Lock-in Risk", cost: "If a key platform (Make, Zapier, n8n) changes pricing or APIs, you may need to rebuild client systems at your own cost" },
      { name: "Ongoing Maintenance Liability", cost: "Automations break when third-party APIs update; budget 5-10 hours/month of unpaid maintenance per active client" },
      { name: "Demo Environment Costs", cost: "Keeping live demo automations running for sales pitches costs $200-$800/month in platform and API fees" }
    ]
  },
  {
    biz: "Grill Cleaning Business",
    slug: "cost-to-start-a-grill-cleaning-business",
    cat: "Service",
    low: 500,
    high: 5000,
    beLo: 1,
    beHi: 3,
    costs: [
      { name: "Cleaning Equipment & Supplies", low: 200, high: 1500, type: "one-time" },
      { name: "Vehicle Signage & Branding", low: 100, high: 800, type: "one-time" },
      { name: "Business License & Insurance", low: 100, high: 1000, type: "one-time" },
      { name: "Marketing (flyers, door hangers, Google)", low: 50, high: 1000, type: "one-time" },
      { name: "Cleaning Supplies Restocking", low: 30, high: 150, type: "recurring-monthly" },
      { name: "Uniform & Safety Gear", low: 50, high: 300, type: "one-time" }
    ],
    hidden: [
      { name: "Seasonal Demand Cliff", cost: "Revenue drops 60-80% from November through March in most markets; you need a plan for winter months" },
      { name: "Water Access Issues", cost: "Many jobs require you to bring your own water supply - a portable tank and pump add $200-$500" },
      { name: "Grill Part Replacement Liability", cost: "You will inevitably break a rusted grate or igniter; budget $50-$150/month for replacement parts you eat the cost on" },
      { name: "Chemical Disposal Compliance", cost: "Some municipalities require proper disposal of degreaser runoff; permits and compliance can cost $100-$500/year" }
    ]
  },
  {
    biz: "Picnic Setup Business",
    slug: "cost-to-start-a-picnic-setup-business",
    cat: "Service",
    low: 1000,
    high: 8000,
    beLo: 2,
    beHi: 4,
    costs: [
      { name: "Tables, Rugs & Cushions", low: 300, high: 2000, type: "one-time" },
      { name: "Decor, Tableware & Props", low: 200, high: 2000, type: "one-time" },
      { name: "Canopy/Umbrella & Weather Gear", low: 100, high: 800, type: "one-time" },
      { name: "Vehicle for Transport", low: 0, high: 1000, type: "one-time" },
      { name: "Website & Booking System", low: 100, high: 800, type: "one-time" },
      { name: "Photography for Portfolio", low: 100, high: 500, type: "one-time" },
      { name: "Business License & Insurance", low: 100, high: 600, type: "one-time" },
      { name: "Consumable Supplies (candles, flowers)", low: 50, high: 300, type: "recurring-monthly" }
    ],
    hidden: [
      { name: "Weather Cancellations", cost: "Expect 15-25% of bookings to cancel or reschedule due to weather; most operators cannot charge full cancellation fees without losing future referrals" },
      { name: "Park Permit Fees", cost: "Many public parks require commercial use permits at $50-$200 per event - and some ban commercial setups entirely" },
      { name: "Inventory Damage & Theft", cost: "Outdoor use destroys inventory fast - budget $100-$300/month to replace stained cushions, broken props, and missing tableware" },
      { name: "Setup/Teardown Time Underestimation", cost: "Most operators underestimate by 50% - a '1-hour setup' takes 90 minutes plus 45 minutes teardown, limiting you to 2-3 events per day max" }
    ]
  },
  {
    biz: "Climate Tech Consulting",
    slug: "cost-to-start-a-climate-tech-consulting-business",
    cat: "Professional",
    low: 5000,
    high: 25000,
    beLo: 3,
    beHi: 8,
    costs: [
      { name: "Industry Certifications (LEED, GHG Protocol)", low: 1500, high: 6000, type: "one-time" },
      { name: "Carbon Accounting Software", low: 500, high: 3000, type: "recurring-annual" },
      { name: "Professional Website & Thought Leadership", low: 500, high: 3000, type: "one-time" },
      { name: "Business Formation & E&O Insurance", low: 500, high: 3000, type: "one-time" },
      { name: "Conference Attendance & Networking", low: 1000, high: 5000, type: "recurring-annual" },
      { name: "Research Subscriptions & Data Access", low: 500, high: 3000, type: "recurring-annual" },
      { name: "Marketing & Content", low: 500, high: 3000, type: "one-time" }
    ],
    hidden: [
      { name: "Regulatory Whiplash", cost: "Climate regulations change with administrations; a single policy reversal can eliminate 30-50% of your service demand overnight" },
      { name: "Greenwashing Liability", cost: "If a client misuses your analysis for false sustainability claims, you may face legal exposure; specialized insurance adds $1,500-$4,000/year" },
      { name: "Long Sales Cycles", cost: "Enterprise sustainability budgets are approved annually; expect 3-9 month sales cycles requiring extensive unpaid proposals" },
      { name: "Certification Maintenance", cost: "LEED, GHG Protocol, and other credentials require continuing education and renewal fees of $500-$2,000/year each" }
    ]
  },
  {
    biz: "Pure Green Franchise",
    slug: "cost-to-start-a-pure-green-franchise",
    cat: "Food & Beverage",
    low: 132000,
    high: 235000,
    beLo: 18,
    beHi: 30,
    costs: [
      { name: "Franchise Fee", low: 30000, high: 30000, type: "one-time" },
      { name: "Leasehold Improvements & Buildout", low: 40000, high: 80000, type: "one-time" },
      { name: "Equipment (blenders, juicers, POS)", low: 25000, high: 45000, type: "one-time" },
      { name: "Initial Inventory & Supplies", low: 5000, high: 10000, type: "one-time" },
      { name: "Signage & Branding", low: 5000, high: 15000, type: "one-time" },
      { name: "Pre-Opening Marketing", low: 5000, high: 10000, type: "one-time" },
      { name: "Working Capital (3 months)", low: 15000, high: 30000, type: "one-time" },
      { name: "Royalty Fee", low: 500, high: 1500, type: "recurring-monthly" },
      { name: "Marketing Fund Contribution", low: 300, high: 800, type: "recurring-monthly" }
    ],
    hidden: [
      { name: "Produce Waste at Scale", cost: "Fresh juice operations waste 15-25% of produce inventory; this costs $1,500-$4,000/month that does not show up in franchise cost projections" },
      { name: "Territory Restrictions Are Not Demand Guarantees", cost: "Your protected territory may have insufficient foot traffic; the franchise will not relocate you for free if the site underperforms" },
      { name: "Required Vendor Pricing", cost: "Franchise-mandated suppliers often charge 10-20% above market rate; you cannot shop around for cheaper produce or cups" },
      { name: "Renewal and Transfer Fees", cost: "Franchise renewal costs $10,000-$15,000 every 10 years; selling your location incurs a $5,000-$10,000 transfer fee" }
    ]
  },
  {
    biz: "BrightStar Care Franchise",
    slug: "cost-to-start-a-brightstar-care-franchise",
    cat: "Health & Fitness",
    low: 132000,
    high: 235000,
    beLo: 12,
    beHi: 24,
    costs: [
      { name: "Franchise Fee", low: 50000, high: 50000, type: "one-time" },
      { name: "Office Space Setup", low: 10000, high: 25000, type: "one-time" },
      { name: "Technology & Software Systems", low: 5000, high: 15000, type: "one-time" },
      { name: "Insurance (general, professional, workers comp)", low: 10000, high: 25000, type: "one-time" },
      { name: "Initial Staffing & Training", low: 15000, high: 35000, type: "one-time" },
      { name: "Marketing & Grand Opening", low: 10000, high: 20000, type: "one-time" },
      { name: "Working Capital (6 months)", low: 25000, high: 50000, type: "one-time" },
      { name: "Royalty Fee (5.25% of revenue)", low: 800, high: 3000, type: "recurring-monthly" },
      { name: "Brand Fund Contribution", low: 300, high: 1000, type: "recurring-monthly" }
    ],
    hidden: [
      { name: "Caregiver Turnover Costs", cost: "Home care industry averages 65-80% annual turnover; each replacement costs $2,500-$5,000 in recruiting, background checks, and training" },
      { name: "Workers Compensation Surprise", cost: "Home health care workers comp rates are among the highest; expect $3,000-$8,000/year per employee, and one claim can spike your premiums 30-50%" },
      { name: "Medicaid Reimbursement Delays", cost: "Government-paid clients mean 60-90 day payment delays; you need cash reserves to cover payroll while waiting for reimbursement" },
      { name: "State Licensing Complexity", cost: "Home health licensing requirements vary dramatically by state; some require a registered nurse on staff ($70,000-$90,000/year) even before your first client" }
    ]
  },
  {
    biz: "Print-on-Demand Business",
    slug: "cost-to-start-a-print-on-demand-business",
    cat: "Online",
    low: 500,
    high: 5000,
    beLo: 1,
    beHi: 4,
    costs: [
      { name: "E-commerce Platform (Shopify/Etsy)", low: 0, high: 400, type: "recurring-annual" },
      { name: "Design Software & Tools", low: 0, high: 300, type: "recurring-annual" },
      { name: "Sample Orders for Quality Control", low: 100, high: 500, type: "one-time" },
      { name: "Business Formation & Licenses", low: 50, high: 300, type: "one-time" },
      { name: "Logo & Brand Design", low: 50, high: 500, type: "one-time" },
      { name: "Paid Advertising (initial)", low: 200, high: 2000, type: "one-time" },
      { name: "Mockup Generator Tools", low: 0, high: 200, type: "recurring-annual" }
    ],
    hidden: [
      { name: "Razor-Thin Margins After Platform Fees", cost: "After POD base cost, platform fees, and transaction fees, your real margin on a $25 shirt is often $3-$6 - not the $10+ calculators suggest" },
      { name: "Return Shipping Costs You Absorb", cost: "POD providers rarely cover return shipping; you eat $5-$8 per return plus the original product cost on sizing issues" },
      { name: "Design Trend Velocity", cost: "Trending designs have a 2-4 week window; by the time you see a trend, hundreds of sellers already have similar listings" },
      { name: "Trademark Infringement Risk", cost: "A single DMCA takedown or trademark claim can shut down your entire store; legal defense starts at $3,000-$5,000" }
    ]
  },
  {
    biz: "Subscription Box Business",
    slug: "cost-to-start-a-subscription-box-business",
    cat: "Online",
    low: 2000,
    high: 15000,
    beLo: 3,
    beHi: 8,
    costs: [
      { name: "Initial Product Inventory", low: 500, high: 5000, type: "one-time" },
      { name: "Custom Packaging & Branding", low: 300, high: 3000, type: "one-time" },
      { name: "E-commerce & Subscription Platform", low: 200, high: 1200, type: "recurring-annual" },
      { name: "Website Design", low: 200, high: 2000, type: "one-time" },
      { name: "Shipping Supplies", low: 100, high: 500, type: "one-time" },
      { name: "Business Formation & Insurance", low: 100, high: 500, type: "one-time" },
      { name: "Marketing & Launch Campaign", low: 500, high: 5000, type: "one-time" },
      { name: "Monthly Product Sourcing", low: 300, high: 2000, type: "recurring-monthly" }
    ],
    hidden: [
      { name: "Churn Rate Reality Check", cost: "Average subscription box churn is 10-15% per month; you must acquire 10-15 new subscribers monthly just to stay flat on a 100-subscriber base" },
      { name: "Shipping Cost Escalation", cost: "Dimensional weight pricing means your 3-lb box may be billed as 5 lbs; shipping costs often exceed product costs at $8-$15 per box" },
      { name: "Minimum Order Quantities from Suppliers", cost: "Most product suppliers require MOQs of 100-500 units; if you have 50 subscribers, you are buying double what you need" },
      { name: "Unboxing Experience Costs", cost: "Custom tissue paper, stickers, thank-you cards, and inserts add $2-$5 per box in costs that feel optional but drive retention" }
    ]
  },
  {
    biz: "Mini Pancake Business",
    slug: "cost-to-start-a-mini-pancake-business",
    cat: "Food & Beverage",
    low: 2000,
    high: 15000,
    beLo: 2,
    beHi: 6,
    costs: [
      { name: "Mini Pancake Equipment (poffertjes grill, supplies)", low: 300, high: 2000, type: "one-time" },
      { name: "Cart, Kiosk, or Trailer", low: 500, high: 5000, type: "one-time" },
      { name: "Health Department Permits & Food Handler Cert", low: 200, high: 1500, type: "one-time" },
      { name: "Initial Ingredients & Packaging", low: 200, high: 1000, type: "one-time" },
      { name: "Branding, Signage & Menu Board", low: 100, high: 1000, type: "one-time" },
      { name: "Business License & Insurance", low: 200, high: 1000, type: "one-time" },
      { name: "POS System & Payment Processing", low: 100, high: 500, type: "one-time" },
      { name: "Monthly Ingredients & Supplies", low: 200, high: 800, type: "recurring-monthly" },
      { name: "Commissary Kitchen Rental", low: 200, high: 800, type: "recurring-monthly" }
    ],
    hidden: [
      { name: "Commissary Kitchen Requirement", cost: "Most health departments require food cart operators to prep in a licensed commissary kitchen; monthly rental runs $400-$1,200 even if you barely use it" },
      { name: "Event Vendor Fee Stacking", cost: "Farmers markets charge $50-$150/day, festivals charge $200-$1,000 per event, and many require proof of $1M insurance - fees eat 15-30% of gross revenue" },
      { name: "Novelty Fatigue", cost: "Mini pancakes are an impulse buy; expect revenue to drop 30-50% at repeat locations as the novelty wears off - you must constantly rotate locations" },
      { name: "Power Supply Costs", cost: "If your grill is electric, outdoor events require a generator ($500-$1,500 purchase) plus $10-$20/day in fuel; many events charge extra for power hookups" }
    ]
  }
];

let calcAdded = 0;
for (const entry of newCalcEntries) {
  if (!existingCalcSlugs.has(entry.slug)) {
    calcDataRaw.businesses.push(entry);
    existingCalcSlugs.add(entry.slug);
    calcAdded++;
  }
}

// Sort businesses alphabetically by name
calcDataRaw.businesses.sort((a, b) => a.biz.localeCompare(b.biz));

writeFileSync(join(DATA_DIR, 'calculator-data.json'), JSON.stringify(calcDataRaw));
console.log(`  → ${calcAdded} new calculator entries added (${calcDataRaw.businesses.length} total)`);

console.log('\nDone! Data files written to src/data/');
