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

        <h2>Most Startup Cost Content Is Useless</h2>

        <p>Not because the writers are lazy, but because they&apos;re copying each other. Article A cites Article B cites Article C, and somewhere back there someone just made a number up. The result is an internet full of &ldquo;startup costs vary from $3,000 to $500,000 depending on the type of business&rdquo;  - which is technically true and completely unhelpful.</p>

        <p>We built Startup Cost Guide because we got tired of it. Every breakdown on this site is researched from scratch: SBA data, industry reports, vendor pricing, and real conversations with people who&apos;ve actually opened these businesses.</p>

        <h2>What This Site Does</h2>

        <p>Startup Cost Guide provides detailed cost breakdowns for 100+ business types. Each guide includes a line-item cost table, detailed explanations of every expense category, the hidden costs that catch first-time owners off guard, realistic profitability timelines, and practical strategies for reducing your startup investment.</p>

        <p>We&apos;re not selling you a course. We&apos;re not trying to convince you that starting a business is easy. We&apos;re giving you the financial reality of entrepreneurship so you can make an informed decision about whether  - and how  - to start.</p>

        <h2>How We&apos;re Different</h2>

        <p>Most startup cost content on the internet has three problems. First, the numbers are vague  - &ldquo;costs vary depending on location&rdquo; tells you nothing useful. Second, the hidden costs are missing  - the expenses that show up after you&apos;ve already committed are the ones that sink businesses, and most guides don&apos;t cover them. Third, the content is recycled  - the same generic ranges passed between sites with no original research behind them.</p>

        <p>Every guide on this site includes specific dollar ranges for every line item, sourced from industry data, vendor pricing, and practitioner input. We cover the expenses you won&apos;t find in other guides  - the commissary kitchen requirement for food trucks, the workers&apos; comp rate shock for landscaping companies, the seasonal revenue gap that closes fitness studios. And we&apos;re honest about profitability, because overpromising on breakeven timelines helps no one.</p>

        <p>For a detailed look at how we research and calculate cost ranges, read our <Link href="/methodology">methodology page</Link>.</p>

        <h2>Our Research Process</h2>

        <p>Every guide goes through a multi-step research process: industry cost benchmarking from government and trade sources, vendor and supplier price verification, cross-referencing with real business owners, and editorial review for accuracy and completeness. We don&apos;t publish a guide until we&apos;re confident the numbers reflect what someone would actually spend today.</p>

        <p>We also keep guides current. Startup costs change over time  - equipment prices fluctuate, insurance rates adjust, and licensing requirements evolve. Our highest-traffic guides are reviewed quarterly, and all guides are reviewed at least annually.</p>

        <h2>Contact</h2>

        <p>Have a question about a specific cost guide? Spot something that needs updating? Want to share your own startup cost experience?</p>

        <p>Reach out at <strong>hello@startupcostguide.com</strong>.</p>

        <p>If a specific business type isn&apos;t covered yet, let us know  - we&apos;re adding new guides regularly.</p>
      </div>
    </article>
  );
}
