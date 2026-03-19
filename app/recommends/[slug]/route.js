import { redirect } from 'next/navigation';

const AFFILIATE_LINKS = {
  'legalzoom': 'https://www.legalzoom.com',
  'quickbooks': 'https://quickbooks.intuit.com',
  'gusto-payroll': 'https://gusto.com',
  'next-insurance': 'https://www.nextinsurance.com',
  'square-pos': 'https://squareup.com',
  'toast-pos': 'https://pos.toasttab.com',
  'squarespace': 'https://www.squarespace.com',
  'shopify': 'https://www.shopify.com',
  'wix': 'https://www.wix.com',
  'freshbooks': 'https://www.freshbooks.com',
  'homeadvisor': 'https://www.homeadvisor.com',
  'thumbtack': 'https://www.thumbtack.com',
  'yelp-ads': 'https://biz.yelp.com',
  'jobber': 'https://getjobber.com',
  'housecall-pro': 'https://www.housecallpro.com',
  'mindbody': 'https://www.mindbodyonline.com',
  'vagaro': 'https://www.vagaro.com',
  'pike13': 'https://www.pike13.com',
  'zen-planner': 'https://www.zenplanner.com',
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
