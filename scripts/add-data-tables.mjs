import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const GUIDES_DIR = join(import.meta.dirname, '..', 'src', 'data', 'guides');
const CALC_PATH = join(import.meta.dirname, '..', 'src', 'data', 'calculator-data.json');

const calcData = JSON.parse(readFileSync(CALC_PATH, 'utf8'));
const bizBySlug = Object.fromEntries(calcData.businesses.map(b => [b.slug, b]));

function fmt(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function getMonthlyRows(biz) {
  const monthlyCosts = biz.costs.filter(c => c.type === 'recurring-monthly');
  if (monthlyCosts.length > 0) {
    return monthlyCosts.map(c => ({ name: c.name, low: c.low, high: c.high }));
  }
  // Derive estimated monthly from one-time costs for relevant categories
  const derivable = biz.costs.filter(c => {
    const n = c.name.toLowerCase();
    return c.type === 'one-time' && (
      n.includes('marketing') || n.includes('insurance') ||
      n.includes('working capital') || n.includes('supplies') ||
      n.includes('inventory')
    );
  });
  // Also include annual costs divided by 12
  const annuals = biz.costs.filter(c => c.type === 'recurring-annual');

  const rows = [];
  for (const c of derivable) {
    rows.push({ name: c.name + ' (est.)', low: Math.round(c.low / 12), high: Math.round(c.high / 12) });
  }
  for (const c of annuals) {
    rows.push({ name: c.name, low: Math.round(c.low / 12), high: Math.round(c.high / 12) });
  }
  // If still nothing, estimate from total startup / 12
  if (rows.length === 0) {
    const totalLow = biz.costs.reduce((s, c) => s + c.low, 0);
    const totalHigh = biz.costs.reduce((s, c) => s + c.high, 0);
    rows.push({ name: 'Estimated Operating Costs', low: Math.round(totalLow * 0.15), high: Math.round(totalHigh * 0.15) });
  }
  return rows;
}

function buildMonthlyTable(biz) {
  const rows = getMonthlyRows(biz);
  const totalLow = rows.reduce((s, r) => s + r.low, 0);
  const totalHigh = rows.reduce((s, r) => s + r.high, 0);

  let html = '<h3>Monthly Operating Costs</h3>\n<table><thead><tr><th>Expense</th><th>Low Estimate</th><th>High Estimate</th></tr></thead><tbody>\n';
  for (const r of rows) {
    html += `<tr><td>${r.name}</td><td>${fmt(r.low)}/mo</td><td>${fmt(r.high)}/mo</td></tr>\n`;
  }
  html += `<tr style="font-weight:700"><td>Total Monthly</td><td>${fmt(totalLow)}/mo</td><td>${fmt(totalHigh)}/mo</td></tr>\n`;
  html += '</tbody></table>';
  return { html, totalLow, totalHigh };
}

function buildBreakevenTable(biz) {
  const { beLo, beHi } = biz;
  const bizName = biz.biz.toLowerCase();

  // Build timeline stages based on actual breakeven range
  let stages;
  if (beHi <= 6) {
    // Fast breakeven
    stages = [
      ['Months 1–2', 'Launch & initial sales', 'Operating at a loss'],
      ['Months 2–4', 'Building customer base', 'Revenue growing, closing the gap'],
      ['Months 4–6', 'Reaching profitability', 'Approaching or at breakeven'],
      ['Months 6–12', 'Growth & reinvestment', 'Generating profit'],
    ];
  } else if (beHi <= 12) {
    // Moderate breakeven
    stages = [
      ['Months 1–3', 'Launch & ramp-up', 'Operating at a loss'],
      ['Months 3–6', 'Building momentum', 'Revenue growing, still in the red'],
      ['Months 6–9', 'Approaching breakeven', 'Narrowing the gap'],
      ['Months 9–12', 'Reaching profitability', 'At or near breakeven'],
      ['Months 12+', 'Growth phase', 'Generating consistent profit'],
    ];
  } else if (beHi <= 18) {
    // Slower breakeven
    stages = [
      ['Months 1–3', 'Launch & ramp-up', 'Operating at a loss'],
      ['Months 3–6', 'Early growth', 'Revenue building, high expenses'],
      ['Months 6–12', 'Building customer base', 'Revenue growing steadily'],
      ['Months 12–18', 'Approaching breakeven', 'Closing the gap on costs'],
      ['Months 18+', 'Profitability', 'Generating consistent profit'],
    ];
  } else {
    // Long breakeven (18+)
    stages = [
      ['Months 1–3', 'Launch & ramp-up', 'Operating at a loss'],
      ['Months 3–6', 'Early operations', 'Revenue building slowly'],
      ['Months 6–12', 'Establishing the business', 'Significant gap remains'],
      ['Months 12–18', 'Growing revenue', 'Steadily reducing losses'],
      ['Months 18–24', 'Approaching breakeven', 'Closing the gap'],
      ['Months 24+', 'Profitability', 'Generating consistent profit'],
    ];
  }

  let html = '<h3>Typical Breakeven Timeline</h3>\n<table><thead><tr><th>Period</th><th>Stage</th><th>Revenue vs. Costs</th></tr></thead><tbody>\n';
  for (const [period, stage, revenue] of stages) {
    html += `<tr><td>${period}</td><td>${stage}</td><td>${revenue}</td></tr>\n`;
  }
  html += '</tbody></table>\n';
  html += `<p>Most ${bizName} owners break even within <strong>${beLo}\u2013${beHi} months</strong>.</p>`;
  return html;
}

function buildFirstYearTable(biz, monthlyLow, monthlyHigh) {
  const oneTimeLow = biz.costs.filter(c => c.type === 'one-time').reduce((s, c) => s + c.low, 0);
  const oneTimeHigh = biz.costs.filter(c => c.type === 'one-time').reduce((s, c) => s + c.high, 0);
  // Add annual costs to one-time
  const annualLow = biz.costs.filter(c => c.type === 'recurring-annual').reduce((s, c) => s + c.low, 0);
  const annualHigh = biz.costs.filter(c => c.type === 'recurring-annual').reduce((s, c) => s + c.high, 0);

  const startupLow = oneTimeLow + annualLow;
  const startupHigh = oneTimeHigh + annualHigh;
  const opLow = monthlyLow * 12;
  const opHigh = monthlyHigh * 12;
  const totalLow = startupLow + opLow;
  const totalHigh = startupHigh + opHigh;

  let html = '<h3>First-Year Cash Flow Summary</h3>\n<table><thead><tr><th>Category</th><th>Low</th><th>High</th></tr></thead><tbody>\n';
  html += `<tr><td>One-Time Startup Costs</td><td>${fmt(startupLow)}</td><td>${fmt(startupHigh)}</td></tr>\n`;
  html += `<tr><td>12 Months Operating Costs</td><td>${fmt(opLow)}</td><td>${fmt(opHigh)}</td></tr>\n`;
  html += `<tr style="font-weight:700;border-top:2px solid #333"><td>Total First Year</td><td>${fmt(totalLow)}</td><td>${fmt(totalHigh)}</td></tr>\n`;
  html += '</tbody></table>';
  return html;
}

function insertAfterH2Section(content, h2Title, insertHtml) {
  // Find the H2, then find the next H2 and insert before it
  const h2Regex = new RegExp(`(<h2>${h2Title}</h2>)`, 'i');
  const match = content.match(h2Regex);
  if (!match) return null;

  const h2Pos = content.indexOf(match[0]);
  const afterH2 = content.indexOf('<h2>', h2Pos + match[0].length);
  if (afterH2 === -1) return null;

  return content.slice(0, afterH2) + insertHtml + '\n\n' + content.slice(afterH2);
}

function insertBeforeH2Section(content, h2Title, insertHtml) {
  const h2Regex = new RegExp(`<h2>${h2Title}</h2>`, 'i');
  const match = content.match(h2Regex);
  if (!match) return null;

  const pos = content.indexOf(match[0]);
  return content.slice(0, pos) + insertHtml + '\n\n' + content.slice(pos);
}

// Main
const guideFiles = readdirSync(GUIDES_DIR).filter(f => {
  if (!f.endsWith('.json')) return false;
  if (f.includes('-in-')) return false;
  if (f.includes('-vs-')) return false;
  return true;
});

let updated = 0;
let skippedNoCalc = 0;
let skippedAlready = 0;
let skippedMissingSections = 0;

for (const file of guideFiles) {
  const slug = file.replace('.json', '');
  const biz = bizBySlug[slug];
  if (!biz) {
    skippedNoCalc++;
    continue;
  }

  const filePath = join(GUIDES_DIR, file);
  const guide = JSON.parse(readFileSync(filePath, 'utf8'));

  if (guide.content.includes('Monthly Operating Costs')) {
    skippedAlready++;
    continue;
  }

  let content = guide.content;
  let modified = false;

  // 1. Monthly Operating Cost Table — after "Detailed Cost Breakdown"
  const monthly = buildMonthlyTable(biz);
  const r1 = insertAfterH2Section(content, 'Detailed Cost Breakdown', monthly.html);
  if (r1) {
    content = r1;
    modified = true;
  }

  // 2. Breakeven Timeline Table — after "How Long Until You're Profitable?"
  const breakevenHtml = buildBreakevenTable(biz);
  // Try multiple apostrophe variants
  const profTitles = [
    "How Long Until You\u2019re Profitable\\?",
    "How Long Until You're Profitable\\?",
    "How Long Until You.re Profitable.",
  ];
  let r2 = null;
  for (const t of profTitles) {
    r2 = insertAfterH2Section(content, t, breakevenHtml);
    if (r2) break;
  }
  if (r2) {
    content = r2;
    modified = true;
  }

  // 3. First-Year Cash Flow — before "How to Start for Less"
  const firstYearHtml = buildFirstYearTable(biz, monthly.totalLow, monthly.totalHigh);
  const r3 = insertBeforeH2Section(content, 'How to Start for Less', firstYearHtml);
  if (r3) {
    content = r3;
    modified = true;
  }

  if (modified) {
    guide.content = content;
    writeFileSync(filePath, JSON.stringify(guide, null, 2), 'utf8');
    updated++;
  } else {
    skippedMissingSections++;
  }
}

console.log(`Done!`);
console.log(`  Updated: ${updated}`);
console.log(`  Skipped (no calculator data): ${skippedNoCalc}`);
console.log(`  Skipped (already has tables): ${skippedAlready}`);
console.log(`  Skipped (missing H2 sections): ${skippedMissingSections}`);
console.log(`  Total base guides: ${guideFiles.length}`);
