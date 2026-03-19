'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import calcData from '@/src/data/calculator-data.json';
import { formatCurrency } from '@/src/lib/formatCurrency';

const DATA = calcData.businesses;
const POPULAR_SLUGS = calcData.popularSlugs;

function getScaleLabel(v) {
  if (v < 25) return 'Lean / Solo';
  if (v < 50) return 'Small';
  if (v < 75) return 'Medium';
  return 'Full Build-Out';
}
function getLocLabel(v) {
  if (v < 20) return 'Rural / Low Cost';
  if (v < 40) return 'Below Average';
  if (v < 60) return 'Average';
  if (v < 80) return 'Above Average';
  return 'Major City / High Cost';
}
function getEquipLabel(v) {
  if (v < 25) return 'All Used / Budget';
  if (v < 50) return 'Mostly Used';
  if (v < 75) return 'Mix of New & Used';
  return 'All New / Premium';
}

export default function Calculator() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedBiz, setSelectedBiz] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scale, setScale] = useState(50);
  const [location, setLocation] = useState(50);
  const [equipment, setEquipment] = useState(50);
  const [initialized, setInitialized] = useState(false);

  const wrapRef = useRef(null);
  const resultsRef = useRef(null);

  // Restore state from URL params on mount
  useEffect(() => {
    const bizSlug = searchParams.get('biz');
    const s = searchParams.get('scale');
    const l = searchParams.get('loc');
    const e = searchParams.get('equip');

    if (bizSlug) {
      const biz = DATA.find(d => d.slug === bizSlug);
      if (biz) {
        setSelectedBiz(biz);
        setSearchText(biz.biz);
      }
    }
    if (s) setScale(Math.min(100, Math.max(0, parseInt(s) || 50)));
    if (l) setLocation(Math.min(100, Math.max(0, parseInt(l) || 50)));
    if (e) setEquipment(Math.min(100, Math.max(0, parseInt(e) || 50)));
    setInitialized(true);
  }, []);

  // Sync state to URL params (without page reload)
  const updateUrl = useCallback((biz, s, l, e) => {
    if (!biz) return;
    const params = new URLSearchParams();
    params.set('biz', biz.slug);
    if (s !== 50) params.set('scale', s);
    if (l !== 50) params.set('loc', l);
    if (e !== 50) params.set('equip', e);
    window.history.replaceState(null, '', `/calculator?${params.toString()}`);
  }, []);

  useEffect(() => {
    if (initialized && selectedBiz) {
      updateUrl(selectedBiz, scale, location, equipment);
    }
  }, [initialized, selectedBiz, scale, location, equipment, updateUrl]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const cats = useMemo(() => [...new Set(DATA.map(d => d.cat))].sort(), []);

  const filtered = useMemo(() => {
    let result = DATA;
    if (activeCat) result = result.filter(d => d.cat === activeCat);
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(d => d.biz.toLowerCase().includes(q) || d.cat.toLowerCase().includes(q));
    }
    return result.slice(0, 30);
  }, [activeCat, searchText]);

  const popularBizzes = useMemo(
    () => POPULAR_SLUGS.map(slug => DATA.find(x => x.slug === slug)).filter(Boolean),
    []
  );

  // Calculate adjusted costs
  const results = useMemo(() => {
    if (!selectedBiz) return null;

    const s = scale / 100;
    const l = location / 100;
    const e = equipment / 100;

    const locFactor = 0.7 + (l * 0.6);
    const equipFactor = 0.7 + (e * 0.6);
    const scaleFactor = 0.3 + (s * 0.7);

    let totalLow = 0, totalHigh = 0;
    const adjusted = selectedBiz.costs.map(c => {
      const range = c.high - c.low;
      const base = c.low + (range * scaleFactor);
      const adj = Math.round(base * locFactor * equipFactor);
      const lo = Math.round(adj * 0.85);
      const hi = Math.round(adj * 1.15);
      totalLow += lo;
      totalHigh += hi;
      return { ...c, adjLo: lo, adjHi: hi, adjMid: adj };
    });

    const maxCost = Math.max(...adjusted.map(c => c.adjMid));
    const beLo = Math.max(1, Math.round(selectedBiz.beLo * (0.8 + s * 0.4)));
    const beHi = Math.max(beLo + 1, Math.round(selectedBiz.beHi * (0.8 + s * 0.4)));

    return { adjusted, totalLow, totalHigh, maxCost, beLo, beHi };
  }, [selectedBiz, scale, location, equipment]);

  function selectBusiness(slug) {
    const biz = DATA.find(d => d.slug === slug);
    if (!biz) return;
    setSelectedBiz(biz);
    setSearchText(biz.biz);
    setDropdownOpen(false);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  return (
    <>
      <section className="calc-hero">
        <div className="calc-hero-inner">
          <div className="hero-count">100 Business Types</div>
          <h1>Startup Cost <em>Calculator</em></h1>
          <p>Select your business, adjust for your situation, get a personalized cost estimate with hidden costs and breakeven timeline.</p>
        </div>
      </section>

      <div className="calc-wrap">
        {/* STEP 1: Select Business */}
        <div className="step-card">
          <div className="step-label">Step 1</div>
          <h2 className="step-title">What business are you starting?</h2>
          <div className="biz-select-wrap" ref={wrapRef}>
            <input
              type="text"
              className="biz-search"
              placeholder="Search 100+ business types..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              autoComplete="off"
            />
            <div className={`biz-dropdown${dropdownOpen ? ' open' : ''}`}>
              {filtered.map(d => (
                <div
                  key={d.slug}
                  className={`biz-option${selectedBiz?.slug === d.slug ? ' selected' : ''}`}
                  onClick={() => selectBusiness(d.slug)}
                >
                  <span>{d.biz}</span>
                  <div className="biz-option-right">
                    <div className="biz-option-range">{formatCurrency(d.low)} - {formatCurrency(d.high)}</div>
                    <div className="biz-option-cat">{d.cat}</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '12px 18px', color: 'var(--mid)', textAlign: 'center', fontSize: 14 }}>
                  No matches found
                </div>
              )}
            </div>

          {/* Category filters - inside wrapRef so outside-click handler doesn't close dropdown */}
          <div className="cat-filters">
            <button
              className={`cat-btn${!activeCat ? ' active' : ''}`}
              onClick={() => { setActiveCat(null); setDropdownOpen(true); }}
            >
              All ({DATA.length})
            </button>
            {cats.map(c => (
              <button
                key={c}
                className={`cat-btn${activeCat === c ? ' active' : ''}`}
                onClick={() => { setActiveCat(c); setDropdownOpen(true); }}
              >
                {c} ({DATA.filter(d => d.cat === c).length})
              </button>
            ))}
          </div>
          </div>

          {/* Quick picks */}
          <div className="quick-picks">
            <div className="quick-picks-label">Popular</div>
            <div className="quick-grid">
              {popularBizzes.map(d => (
                <div key={d.slug} className="quick-card" onClick={() => selectBusiness(d.slug)}>
                  <div className="quick-card-name">{d.biz}</div>
                  <div className="quick-card-range">{formatCurrency(d.low)} - {formatCurrency(d.high)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 2: Sliders */}
        {selectedBiz && (
          <div className="step-card">
            <div className="step-label">Step 2</div>
            <h2 className="step-title">Customize your estimate</h2>

            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">Business Scale</span>
                <span className="slider-value">{getScaleLabel(scale)}</span>
              </div>
              <input type="range" className="slider" min="0" max="100" value={scale} onChange={e => setScale(Number(e.target.value))} />
              <div className="slider-hint"><span>Lean / Solo</span><span>Full Build-Out</span></div>
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">Location Cost Factor</span>
                <span className="slider-value">{getLocLabel(location)}</span>
              </div>
              <input type="range" className="slider" min="0" max="100" value={location} onChange={e => setLocation(Number(e.target.value))} />
              <div className="slider-hint"><span>Rural / Low Cost</span><span>Major City / High Cost</span></div>
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">Equipment Strategy</span>
                <span className="slider-value">{getEquipLabel(equipment)}</span>
              </div>
              <input type="range" className="slider" min="0" max="100" value={equipment} onChange={e => setEquipment(Number(e.target.value))} />
              <div className="slider-hint"><span>All Used / Budget</span><span>All New / Premium</span></div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {results ? (
          <div ref={resultsRef}>
            <div className="results-card">
              <div className="results-header">
                <div>
                  <div className="results-biz">{selectedBiz.biz}</div>
                  <div className="results-sub">{selectedBiz.cat}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="results-range">{formatCurrency(results.totalLow)} - {formatCurrency(results.totalHigh)}</div>
                  <div className="results-sub">Estimated Total</div>
                </div>
              </div>

              {/* Cost bars */}
              <div className="cost-bar-group">
                {results.adjusted.map((c, i) => {
                  const pct = (c.adjMid / results.maxCost) * 100;
                  const tp = c.type === 'one-time' ? 'One-Time' : c.type === 'recurring-monthly' ? 'Monthly' : 'Annual';
                  return (
                    <div className="cost-bar-item" key={i}>
                      <div className="cost-bar-header">
                        <span className="cost-bar-name">{c.name}</span>
                        <span className="cost-bar-amount">{formatCurrency(c.adjLo)} - {formatCurrency(c.adjHi)}</span>
                      </div>
                      <div className="cost-bar-track">
                        <div className="cost-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="cost-bar-type">{tp}</div>
                    </div>
                  );
                })}
              </div>

              {/* Breakeven cards */}
              <div className="breakeven-row">
                <div className="breakeven-card">
                  <div className="breakeven-num">{formatCurrency(results.totalLow)}</div>
                  <div className="breakeven-label">Low Estimate</div>
                </div>
                <div className="breakeven-card">
                  <div className="breakeven-num">{formatCurrency(results.totalHigh)}</div>
                  <div className="breakeven-label">High Estimate</div>
                </div>
                <div className="breakeven-card">
                  <div className="breakeven-num">{results.beLo}-{results.beHi} mo</div>
                  <div className="breakeven-label">Breakeven</div>
                </div>
                <div className="breakeven-card">
                  <div className="breakeven-num">{results.adjusted.length}</div>
                  <div className="breakeven-label">Cost Categories</div>
                </div>
              </div>

              {/* Hidden costs */}
              <div className="hidden-section">
                <div className="hidden-title">&#9888; Costs Most People Forget</div>
                {selectedBiz.hidden.map((h, i) => (
                  <div className="hidden-item" key={i}>
                    <span className="hidden-name">{h.name}</span>
                    <span className="hidden-cost">{h.cost}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="cta-row">
                <Link className="cta-btn cta-primary" href={`/${selectedBiz.slug}`}>
                  Read Full Cost Guide &rarr;
                </Link>
                <button className="cta-btn cta-secondary" onClick={() => window.print()}>
                  Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="step-card">
            <div className="empty-state">
              <div className="empty-state-icon">&#128202;</div>
              <p>Select a business type above to see your personalized cost estimate with detailed breakdown, hidden costs, and breakeven timeline.</p>
            </div>
          </div>
        )}
      </div>

      <div className="disclaimer">
        <p>
          <strong>Disclaimer:</strong> This calculator provides estimates based on national averages.
          Your actual costs will vary based on location, scale, and vendor choices. These are starting
          points for planning — not financial advice.{' '}
          <Link href="/methodology">Read our methodology &rarr;</Link>
        </p>
      </div>
    </>
  );
}
