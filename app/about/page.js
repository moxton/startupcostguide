import Link from 'next/link';

export const metadata = {
  title: 'About Startup Cost Guide - Real Numbers, Not Guesswork',
  description: 'Startup Cost Guide provides detailed, research-backed startup cost breakdowns for 100+ business types. SBA data, industry reports, and real conversations with business owners.',
};

export default function AboutPage() {
  return (
    <article className="article-wrap">
      <div className="entry-content">
        <h1>About Startup Cost Guide</h1>

        <h2>The Problem</h2>

        <p>Google &ldquo;how much does it cost to start a restaurant.&rdquo; You&apos;ll get the same answer everywhere: &ldquo;$175,000 to $750,000 depending on your concept and location.&rdquo; Technically true. Completely useless.</p>

        <p>That&apos;s because most startup cost content is copied. Article A cites Article B cites Article C. Somewhere back there, someone made a number up. The whole internet is quoting a guess.</p>

        <p>We built this site because we got tired of it.</p>

        <h2>What We Do</h2>

        <p>Every guide on this site is researched from scratch. SBA data. Industry reports. Vendor pricing. Real conversations with people who&apos;ve actually opened these businesses.</p>

        <p>100 business types. Line-item cost tables. Hidden costs that catch first-time owners off guard. Realistic profitability timelines. Strategies to spend less without cutting corners.</p>

        <p>No courses. No &ldquo;starting a business is easy!&rdquo; cheerleading. Just the financial reality so you can decide whether and how to start.</p>

        <h2>Three Things We Do Differently</h2>

        <p><strong>Specific numbers.</strong> &ldquo;Costs vary depending on location&rdquo; tells you nothing. Our guides give dollar ranges for every line item. You can add them up.</p>

        <p><strong>Hidden costs included.</strong> The commissary kitchen requirement for food trucks. The workers&apos; comp rate shock for landscaping companies. The seasonal revenue gap that closes fitness studios. The expenses that show up after you&apos;ve committed are the ones that sink businesses. We cover them.</p>

        <p><strong>Original research.</strong> We don&apos;t recycle other sites&apos; ranges. Every number traces back to a source. Read our <Link href="/methodology">methodology</Link> for the full process.</p>

        <h2>Staying Current</h2>

        <p>Startup costs change. Equipment prices shift. Insurance rates adjust. Licensing requirements evolve. High-traffic guides are reviewed quarterly. Everything else, at least annually.</p>

        <h2>Contact</h2>

        <p>Question about a cost guide? Spot something outdated? Started a business we don&apos;t cover yet?</p>

        <p><strong>hello@startupcostguide.com</strong></p>
      </div>
    </article>
  );
}
