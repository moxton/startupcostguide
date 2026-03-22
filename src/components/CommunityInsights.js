'use client';

import { useState, useEffect } from 'react';

export default function CommunityInsights({ businessType, slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/community-costs?slug=${encodeURIComponent(slug)}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return null;

  // No data yet — show subtle prompt
  if (!data || !data.count || data.count === 0) {
    return (
      <div className="community-insights community-insights--empty">
        <div className="community-insights-icon">📊</div>
        <div className="community-insights-body">
          <strong>Real cost data from {businessType} owners</strong>
          <p>We're collecting actual startup costs from founders who've done this. No submissions yet for this business type.</p>
          <p className="community-insights-cta">Scroll down to share what you spent — it takes 60 seconds.</p>
        </div>
      </div>
    );
  }

  // We have submissions — show aggregated data
  return (
    <div className="community-insights community-insights--active">
      <div className="community-insights-header">
        <div className="community-insights-icon">📊</div>
        <strong>What real owners spent</strong>
        <span className="community-insights-count">{data.count} {data.count === 1 ? 'report' : 'reports'}</span>
      </div>

      <div className="community-insights-stats">
        <div className="community-stat">
          <span className="community-stat-label">Average</span>
          <span className="community-stat-value">${data.average?.toLocaleString()}</span>
        </div>
        <div className="community-stat">
          <span className="community-stat-label">Range</span>
          <span className="community-stat-value">${data.low?.toLocaleString()} – ${data.high?.toLocaleString()}</span>
        </div>
        {data.medianYear && (
          <div className="community-stat">
            <span className="community-stat-label">Most recent</span>
            <span className="community-stat-value">{data.medianYear}</span>
          </div>
        )}
      </div>

      {data.topSurprise && (
        <div className="community-insights-quote">
          <span className="community-quote-label">Most common surprise cost:</span>
          <span className="community-quote-text">"{data.topSurprise}"</span>
        </div>
      )}

      {data.topAdvice && (
        <div className="community-insights-quote">
          <span className="community-quote-label">Best advice from owners:</span>
          <span className="community-quote-text">"{data.topAdvice}"</span>
        </div>
      )}

      <p className="community-insights-footer">
        Based on {data.count} anonymous {data.count === 1 ? 'submission' : 'submissions'} from real {businessType} owners.
        <a href="#cost-submit">Add yours</a>
      </p>
    </div>
  );
}
