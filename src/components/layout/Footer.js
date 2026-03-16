import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-links">
          <Link href="/about">About</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/calculator">Calculator</Link>
          <Link href="/blog">Blog</Link>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} Startup Cost Guide</p>
      </div>
    </footer>
  );
}
