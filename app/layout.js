import { DM_Sans, Fraunces } from 'next/font/google';
import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Startup Cost Guide - Real Business Startup Cost Breakdowns',
    template: '%s | Startup Cost Guide',
  },
  description: 'Detailed startup cost breakdowns for 100+ business types. Real numbers, hidden costs, and breakeven timelines from a founder who built and sold a company.',
  openGraph: {
    siteName: 'Startup Cost Guide',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://startupcostguide.com/#website',
      url: 'https://startupcostguide.com',
      name: 'Startup Cost Guide',
      description: 'Detailed startup cost breakdowns for 100+ business types. Real numbers, hidden costs, and breakeven timelines.',
      publisher: { '@id': 'https://startupcostguide.com/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://startupcostguide.com/#organization',
      name: 'Startup Cost Guide',
      url: 'https://startupcostguide.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://startupcostguide.com/icon.svg',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
