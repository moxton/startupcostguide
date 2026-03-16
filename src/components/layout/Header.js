'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <div className="logo-mark">$</div>
          Startup Cost Guide
        </Link>
        <button
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`nav-links${menuOpen ? ' open' : ''}`}>
          <Link href="/" onClick={() => setMenuOpen(false)}>Guides</Link>
          <Link href="/calculator" onClick={() => setMenuOpen(false)}>Calculator</Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)}>Blog</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
        </nav>
      </div>
    </header>
  );
}
