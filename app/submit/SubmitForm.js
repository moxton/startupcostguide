'use client';

import { useState, useMemo } from 'react';
import guidesIndex from '@/src/data/guides-index.json';

export default function SubmitForm() {
  const [selectedSlug, setSelectedSlug] = useState('');
  const [searchText, setSearchText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [totalSpent, setTotalSpent] = useState('');
  const [year, setYear] = useState('');
  const [state, setState] = useState('');
  const [surprise, setSurprise] = useState('');
  const [advice, setAdvice] = useState('');
  const [status, setStatus] = useState('idle');

  const selectedGuide = guidesIndex.find(g => g.slug === selectedSlug);

  const filtered = useMemo(() => {
    if (!searchText) return guidesIndex.slice(0, 20);
    const q = searchText.toLowerCase();
    return guidesIndex
      .filter(g => g.businessType.toLowerCase().includes(q) || g.category.toLowerCase().includes(q))
      .slice(0, 20);
  }, [searchText]);

  function pickBusiness(guide) {
    setSelectedSlug(guide.slug);
    setSearchText(guide.businessType);
    setDropdownOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlug || !totalSpent) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/submit-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType: selectedGuide?.businessType || searchText,
          slug: selectedSlug,
          totalSpent: parseInt(totalSpent.replace(/[^0-9]/g, '')) || 0,
          year: year || null,
          state: state || null,
          surprise: surprise || null,
          advice: advice || null,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="submit-page">
        <div className="submit-page-inner">
          <div className="submit-success-card">
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
            <h2>Thanks. Your numbers matter.</h2>
            <p>We review every submission and use real data to keep our cost ranges honest. The next person planning a {selectedGuide?.businessType || 'business'} will benefit from what you shared.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-page">
      <div className="submit-page-inner">
        <div className="submit-hero">
          <h1>You started a business.<br />What did it <em>actually</em> cost?</h1>
          <p>Anonymous. 60 seconds. Your real numbers help the next founder plan better.</p>
        </div>

        <form className="submit-form-card" onSubmit={handleSubmit}>
          {/* Business picker */}
          <div className="submit-field">
            <label>What type of business did you start? *</label>
            <div className="submit-biz-wrap">
              <input
                type="text"
                placeholder="Search 100+ business types..."
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setDropdownOpen(true); setSelectedSlug(''); }}
                onFocus={() => setDropdownOpen(true)}
                autoComplete="off"
                className="submit-biz-input"
              />
              {dropdownOpen && (
                <div className="submit-biz-dropdown">
                  {filtered.map(g => (
                    <div
                      key={g.slug}
                      className={`submit-biz-option${selectedSlug === g.slug ? ' selected' : ''}`}
                      onClick={() => pickBusiness(g)}
                    >
                      <span>{g.businessType}</span>
                      <span style={{ fontSize: 12, color: 'var(--mid)' }}>{g.category}</span>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div style={{ padding: '12px 16px', color: 'var(--mid)', fontSize: 14 }}>No matches found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cost */}
          <div className="submit-field">
            <label>Total startup cost (approximate) *</label>
            <input
              type="text"
              placeholder="e.g. $45,000"
              value={totalSpent}
              onChange={e => setTotalSpent(e.target.value)}
              required
            />
          </div>

          {/* Year + State row */}
          <div className="submit-row">
            <div className="submit-field">
              <label>Year you started</label>
              <input type="text" placeholder="e.g. 2024" value={year} onChange={e => setYear(e.target.value)} maxLength={4} />
            </div>
            <div className="submit-field">
              <label>State</label>
              <input type="text" placeholder="e.g. TX" value={state} onChange={e => setState(e.target.value)} maxLength={2} />
            </div>
          </div>

          {/* Surprise */}
          <div className="submit-field">
            <label>Biggest cost surprise?</label>
            <textarea placeholder="What cost more than you expected?" value={surprise} onChange={e => setSurprise(e.target.value)} rows={2} />
          </div>

          {/* Advice */}
          <div className="submit-field">
            <label>One piece of advice for someone starting this business?</label>
            <textarea placeholder="What do you wish you knew?" value={advice} onChange={e => setAdvice(e.target.value)} rows={2} />
          </div>

          <button type="submit" className="submit-btn" disabled={!selectedSlug || !totalSpent || status === 'submitting'}>
            {status === 'submitting' ? 'Submitting...' : 'Submit Your Costs'}
          </button>
          {status === 'error' && (
            <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>Something went wrong. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  );
}
