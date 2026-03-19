'use client';

import { useState } from 'react';

export default function CostSubmissionForm({ businessType, slug }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [totalSpent, setTotalSpent] = useState('');
  const [year, setYear] = useState('');
  const [state, setState] = useState('');
  const [surprise, setSurprise] = useState('');
  const [advice, setAdvice] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!totalSpent) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/submit-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType,
          slug,
          totalSpent: parseInt(totalSpent.replace(/[^0-9]/g, '')) || 0,
          year: year || null,
          state: state || null,
          surprise: surprise || null,
          advice: advice || null,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="cost-submit-form">
        <div className="cost-submit-success">
          <strong>Thanks.</strong> Your real numbers make this resource better for the next person. We review every submission and use them to keep our cost ranges honest.
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="cost-submit-form">
        <div className="cost-submit-prompt" onClick={() => setOpen(true)}>
          <strong>Started a {businessType}?</strong> Tell us what you actually spent. The next founder planning this business needs your real numbers.
          <span className="cost-submit-cta">Share your costs</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cost-submit-form">
      <div className="cost-submit-card">
        <h3>What did you actually spend to start your {businessType}?</h3>
        <p style={{ color: 'var(--mid)', fontSize: 14, marginBottom: 24 }}>
          Anonymous. Takes 60 seconds. Helps the next person planning this business.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="cost-submit-field">
            <label>Total startup cost (approximate) *</label>
            <input
              type="text"
              placeholder="e.g. $45,000"
              value={totalSpent}
              onChange={e => setTotalSpent(e.target.value)}
              required
            />
          </div>
          <div className="cost-submit-row">
            <div className="cost-submit-field">
              <label>Year you started</label>
              <input
                type="text"
                placeholder="e.g. 2024"
                value={year}
                onChange={e => setYear(e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="cost-submit-field">
              <label>State</label>
              <input
                type="text"
                placeholder="e.g. TX"
                value={state}
                onChange={e => setState(e.target.value)}
                maxLength={2}
              />
            </div>
          </div>
          <div className="cost-submit-field">
            <label>Biggest cost surprise?</label>
            <textarea
              placeholder="What cost more than you expected?"
              value={surprise}
              onChange={e => setSurprise(e.target.value)}
              rows={2}
            />
          </div>
          <div className="cost-submit-field">
            <label>One piece of advice for someone starting this business?</label>
            <textarea
              placeholder="What do you wish you knew?"
              value={advice}
              onChange={e => setAdvice(e.target.value)}
              rows={2}
            />
          </div>
          <button type="submit" className="cost-submit-btn" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Submitting...' : 'Submit your costs'}
          </button>
          {status === 'error' && (
            <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
