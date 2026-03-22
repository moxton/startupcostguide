import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

const DATA_PATH = join(process.cwd(), 'src', 'data', 'community-costs.json');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ count: 0 });
  }

  try {
    if (!existsSync(DATA_PATH)) {
      return NextResponse.json({ count: 0 });
    }

    const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
    const entries = data[slug] || [];

    if (entries.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const costs = entries.map(e => e.totalSpent).filter(Boolean).sort((a, b) => a - b);
    const years = entries.map(e => e.year).filter(Boolean).sort();
    const surprises = entries.map(e => e.surprise).filter(Boolean);
    const advices = entries.map(e => e.advice).filter(Boolean);

    return NextResponse.json({
      count: entries.length,
      average: Math.round(costs.reduce((a, b) => a + b, 0) / costs.length),
      low: costs[0],
      high: costs[costs.length - 1],
      medianYear: years.length > 0 ? years[years.length - 1] : null,
      topSurprise: surprises.length > 0 ? surprises[0] : null,
      topAdvice: advices.length > 0 ? advices[0] : null,
    });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
