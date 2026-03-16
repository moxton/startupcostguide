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

  // Build full guide file
  const guideData = {
    title: record.post_title,
    slug,
    category: record.category,
    businessType: record.business_type,
    costLow: parseInt(record.total_cost_low) || 0,
    costHigh: parseInt(record.total_cost_high) || 0,
    content: record.post_content,
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
  { file: 'blog-03-night-shift-costs.html', slug: 'how-i-funded-night-shift-brewing' },
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

  const blogData = {
    title,
    slug,
    seoTitle: seoTitleMatch ? seoTitleMatch[1].trim() : title,
    metaDescription: metaMatch ? metaMatch[1].trim() : '',
    focusKeyword: keywordMatch ? keywordMatch[1].trim() : '',
    content,
  };

  writeFileSync(join(BLOG_DIR, `${slug}.json`), JSON.stringify(blogData));

  blogIndex.push({
    title,
    slug,
    seoTitle: blogData.seoTitle,
    metaDescription: blogData.metaDescription,
  });
}

writeFileSync(join(DATA_DIR, 'blog-index.json'), JSON.stringify(blogIndex, null, 2));
console.log(`  → ${blogIndex.length} blog posts parsed`);

console.log('\nDone! Data files written to src/data/');
