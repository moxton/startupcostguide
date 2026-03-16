import Link from 'next/link';

export const metadata = {
  title: 'About Startup Cost Guide - Written by a Founder Who\'s Done It',
  description: 'Startup Cost Guide was created by Michael Oxton, who co-founded Night Shift Brewing, grew it over 13 years, and sold the company. These cost breakdowns come from real experience.',
};

export default function AboutPage() {
  return (
    <article className="article-wrap">
      <div className="entry-content">
        <h1>About Startup Cost Guide</h1>

        <h2>This Site Exists Because I Got My Startup Costs Wrong</h2>

        <p>In 2012, I co-founded Night Shift Brewing with two friends, a business plan we wrote on a whiteboard, and about $180,000 in startup capital. We got a lot of things right — the brand, the beer, the timing. But we got plenty of the financial planning wrong.</p>

        <p>We underestimated our buildout costs by 30%. We didn&apos;t budget for the lag time between buying ingredients and getting paid for the finished product. We didn&apos;t account for the regulatory costs of operating a manufacturing facility in Massachusetts. We learned all of this the hard way — by running out of money faster than expected and scrambling to cover the gap.</p>

        <p>Over the next 13 years, we grew Night Shift into one of New England&apos;s largest independent craft breweries with over 150 employees, a distribution company, multiple taprooms, and national brand recognition. We learned what things actually cost — not what the internet said they cost, but what we wrote the checks for. And eventually, we sold the company.</p>

        <p>That experience — starting a business, scaling it, funding it, nearly running out of money, and ultimately selling it — is why this site exists. Because the single most important thing you can do before starting a business is understand what it&apos;s actually going to cost. Not the optimistic version. The real version.</p>

        <h2>What This Site Does</h2>

        <p>Startup Cost Guide provides detailed cost breakdowns for every type of business. Each guide includes a line-item cost table, detailed explanations of every expense category, the hidden costs that catch first-time owners off guard, realistic profitability timelines, and practical strategies for reducing your startup investment.</p>

        <p>We&apos;re not selling you a course. We&apos;re not trying to convince you that starting a business is easy. We&apos;re giving you the financial reality of entrepreneurship so you can make an informed decision about whether — and how — to start.</p>

        <h2>How We&apos;re Different</h2>

        <p>Most startup cost content on the internet has three problems. First, the numbers are vague — &ldquo;costs vary depending on location&rdquo; tells you nothing useful. Second, the hidden costs are missing — the expenses that show up after you&apos;ve already committed are the ones that sink businesses, and most guides don&apos;t cover them. Third, the content is written by people who&apos;ve never started a business — it reads like it was researched, not experienced.</p>

        <p>Every guide on this site includes specific dollar ranges for every line item, sourced from industry data, vendor pricing, and firsthand experience. We cover the expenses you won&apos;t find in other guides — the commissary kitchen requirement for food trucks, the workers&apos; comp rate shock for landscaping companies, the seasonal revenue gap that closes fitness studios. And we&apos;re honest about profitability, because overpromising on breakeven timelines helps no one.</p>

        <p>For a detailed look at how we research and calculate cost ranges, read our <Link href="/methodology">methodology page</Link>.</p>

        <h2>About Michael Oxton</h2>

        <p><strong>Michael Oxton</strong> is the creator of Startup Cost Guide and the co-founder of two companies.</p>

        <p><strong>Night Shift Brewing (Co-Founder, 2012–2025):</strong> Michael co-founded Night Shift Brewing with Rob Burns and Mike O&apos;Mara, growing it over 13 years from a homebrew operation into one of New England&apos;s most recognized craft brewery brands. The company grew to over 150 employees, launched Night Shift Distributing as a separate distribution company, and operated multiple taproom locations before the company was acquired in early 2025.</p>

        <p><strong>Everfur (Co-Founder &amp; CBO, 2025–Present):</strong> Michael is currently co-founder and Chief Business Officer of Everfur, a dog health intelligence platform that analyzes biomarkers from fur samples to provide proactive health insights for dogs.</p>

        <p>Michael holds a degree from Bowdoin College. He lives in Sudbury, Massachusetts with his wife, two children, and two dogs.</p>

        <h2>Contact</h2>

        <p>Have a question about a specific cost guide? Spot something that needs updating? Want to share your own startup cost experience?</p>

        <p>Reach out at <strong>michael@startupcostguide.com</strong> or connect with me on <a href="https://www.linkedin.com/in/michaeloxton/" target="_blank" rel="noopener noreferrer">LinkedIn</a>.</p>

        <p>If a specific business type isn&apos;t covered yet, let me know — we&apos;re adding new guides every week.</p>
      </div>
    </article>
  );
}
