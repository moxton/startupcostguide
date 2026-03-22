'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

function formatShortRange(low, high) {
  const fmt = n => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${n}`;
  };
  return `${fmt(low)} – ${fmt(high)}`;
}

export default function GuidesSearch({ guides }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase().trim();
    return guides.filter(g =>
      g.businessType?.toLowerCase().includes(q) ||
      g.title?.toLowerCase().includes(q) ||
      g.category?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query, guides]);

  return (
    <div className="guides-search-wrap">
      <div className="guides-search-box">
        <svg className="guides-search-icon" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
        </svg>
        <input
          type="text"
          placeholder="Search business types... (e.g. food truck, salon, gym)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="guides-search-input"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="guides-search-clear"
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      {results && (
        <div className="guides-search-results">
          {results.length === 0 ? (
            <p className="guides-search-empty">
              No guides found for &ldquo;{query}&rdquo;. Try a different search term.
            </p>
          ) : (
            <>
              <p className="guides-search-count">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              <div className="scg-guides-grid" style={{ padding: 0 }}>
                {results.map(g => (
                  <Link href={`/${g.slug}`} className="scg-guide-card" key={g.slug}>
                    <div className="scg-guide-card-category">{g.category}</div>
                    <h3>{g.businessType}</h3>
                    <div className="scg-guide-card-range">{formatShortRange(g.costLow, g.costHigh)}</div>
                    <p style={{ color: 'var(--mid)', fontSize: 14 }}>{g.metaDescription?.slice(0, 100)}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
