import { redirect } from 'next/navigation';

const AFFILIATE_LINKS = {
  // Business Formation
  'legalzoom': 'https://www.legalzoom.com',
  'zenbusiness': 'https://www.zenbusiness.com',
  'incfile': 'https://www.incfile.com',
  'northwest-registered-agent': 'https://www.northwestregisteredagent.com',
  'stripe-atlas': 'https://stripe.com/atlas',
  // Accounting & Finance
  'quickbooks': 'https://quickbooks.intuit.com',
  'freshbooks': 'https://www.freshbooks.com',
  'wave': 'https://www.waveapps.com',
  // Payroll
  'gusto-payroll': 'https://gusto.com',
  'adp': 'https://www.adp.com',
  // Insurance
  'next-insurance': 'https://www.nextinsurance.com',
  'hiscox': 'https://www.hiscox.com',
  // POS & Payments
  'square-pos': 'https://squareup.com',
  'toast-pos': 'https://pos.toasttab.com',
  'clover': 'https://www.clover.com',
  // Website & Ecommerce
  'squarespace': 'https://www.squarespace.com',
  'shopify': 'https://www.shopify.com',
  'wix': 'https://www.wix.com',
  // Service Business Tools
  'homeadvisor': 'https://www.homeadvisor.com',
  'thumbtack': 'https://www.thumbtack.com',
  'yelp-ads': 'https://biz.yelp.com',
  'jobber': 'https://getjobber.com',
  'housecall-pro': 'https://www.housecallpro.com',
  // Health & Fitness
  'mindbody': 'https://www.mindbodyonline.com',
  'vagaro': 'https://www.vagaro.com',
  'pike13': 'https://www.pike13.com',
  'zen-planner': 'https://www.zenplanner.com',
  // Pet Business
  'petdesk': 'https://www.petdesk.com',
  'gingr': 'https://www.gingrapp.com',
};

export async function GET(request, { params }) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/\/$/, '');
  const url = AFFILIATE_LINKS[cleanSlug];

  if (url) {
    redirect(url);
  }

  // Fallback: redirect to homepage if unknown affiliate
  redirect('/');
}
