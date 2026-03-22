#!/usr/bin/env node
/**
 * Generates state-specific guide pages for the top 10 business types
 * across the initial 10 target states (100 pages total).
 *
 * Run with: node scripts/build-state-pages.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');
const GUIDES_DIR = join(DATA_DIR, 'guides');

if (!existsSync(GUIDES_DIR)) mkdirSync(GUIDES_DIR, { recursive: true });

// Load source data
const guidesIndex = JSON.parse(readFileSync(join(DATA_DIR, 'guides-index.json'), 'utf-8'));
const stateData = JSON.parse(readFileSync(join(DATA_DIR, 'state-data.json'), 'utf-8'));

// Top 10 business types by popularity (slugs from guides-index.json)
const TARGET_SLUGS = [
  'cost-to-start-a-restaurant',
  'cost-to-start-a-food-truck',
  'cost-to-start-a-cleaning-business',
  'cost-to-start-a-coffee-shop',
  'cost-to-start-a-gym',
  'cost-to-start-a-landscaping-business',
  'cost-to-start-a-personal-training-studio',
  'cost-to-start-a-dog-grooming-business',
  'cost-to-start-a-bakery',
  'cost-to-start-a-pressure-washing-business',
];

// Initial 10 states (keys from state-data.json)
const TARGET_STATES = [
  'california',
  'texas',
  'florida',
  'new-york',
  'illinois',
  'pennsylvania',
  'ohio',
  'georgia',
  'north-carolina',
  'michigan',
];

// ---------------------------------------------------------------------------
// Cost adjustment logic
// ---------------------------------------------------------------------------
function adjustCost(baseCost, state) {
  const mult = state.costOfLiving * 0.4 + state.laborMult * 0.35 + state.rentMult * 0.25;
  let adjusted = Math.round(baseCost * mult);
  if (adjusted > 5000) {
    adjusted = Math.round(adjusted / 500) * 500;
  } else {
    adjusted = Math.round(adjusted / 100) * 100;
  }
  return adjusted;
}

function fmt(n) {
  return '$' + n.toLocaleString('en-US');
}

function fmtPct(n) {
  return (n * 100).toFixed(1).replace(/\.0$/, '') + '%';
}

function fmtRange(low, high) {
  return fmt(low) + '-' + fmt(high);
}

// ---------------------------------------------------------------------------
// State-specific content generators
// Each function returns content that varies meaningfully by state + business
// ---------------------------------------------------------------------------

/**
 * Returns state-specific regulatory notes for a given business type.
 */
function getStateRegNotes(businessType, state) {
  const bt = businessType.toLowerCase();
  const s = state.name;
  const isFoodBiz = ['restaurant', 'food truck', 'coffee shop', 'bakery'].some(t => bt.includes(t));
  const isServiceBiz = ['cleaning', 'landscaping', 'pressure washing', 'dog grooming', 'personal training'].some(t => bt.includes(t));

  const notes = [];

  // Tax-related notes
  if (!state.hasStateTax) {
    notes.push(`${s} has no state income tax, which means more of your business profits stay in your pocket compared to the national average.`);
  } else if (state.stateTaxRate > 0.08) {
    notes.push(`${s}'s top income tax rate of ${fmtPct(state.stateTaxRate)} is among the highest in the nation, which will take a meaningful bite out of profits as your business grows.`);
  } else if (state.stateTaxRate > 0.05) {
    notes.push(`${s} levies a moderate state income tax of up to ${fmtPct(state.stateTaxRate)}, which is a factor in your long-term profitability planning.`);
  } else {
    notes.push(`${s}'s state income tax tops out at ${fmtPct(state.stateTaxRate)}, which is relatively low and keeps more of your earnings working for you.`);
  }

  // Minimum wage notes
  if (state.minWage > 14) {
    notes.push(`The state minimum wage of ${fmt(state.minWage)}/hour is well above the federal level, which pushes labor costs higher for businesses that rely on hourly employees.`);
  } else if (state.minWage > 10) {
    notes.push(`${s}'s minimum wage of ${fmt(state.minWage)}/hour is above the federal minimum, adding moderate labor cost pressure.`);
  } else if (state.minWage <= 7.25) {
    notes.push(`${s} follows the federal minimum wage of $7.25/hour, though market rates for skilled workers are typically much higher.`);
  }

  // Food business specific
  if (isFoodBiz && state.salesTax > 0.06) {
    notes.push(`The state sales tax of ${fmtPct(state.salesTax)} (before local additions) applies to prepared food, which affects your menu pricing strategy.`);
  } else if (isFoodBiz && state.salesTax === 0) {
    notes.push(`${s} has no state sales tax, giving your food business a pricing advantage - customers pay exactly what is on the menu.`);
  }

  // Service business specific
  if (isServiceBiz && state.salesTax > 0) {
    notes.push(`Check whether ${s} applies its ${fmtPct(state.salesTax)} sales tax to your specific service category - some states tax services differently than goods.`);
  }

  return notes;
}

/**
 * Build unique state-specific tips for a business type.
 */
function getStateTips(businessType, stateKey, state) {
  const bt = businessType.toLowerCase();
  const tips = [];

  // Universal tips that vary by state data
  if (state.costOfLiving < 0.92) {
    tips.push(`Take advantage of ${state.name}'s below-average cost of living by keeping your personal expenses low during the startup phase - lower personal burn rate means more runway for your business.`);
  }
  if (state.costOfLiving > 1.10) {
    tips.push(`In ${state.name}'s high-cost market, consider starting lean - test your concept at a smaller scale before signing long-term leases or making big equipment purchases.`);
  }

  // LLC tip
  if (state.llcFee <= 50) {
    tips.push(`${state.name}'s LLC filing fee of just ${fmt(state.llcFee)} is among the cheapest in the country - get your LLC set up before you do anything else.`);
  } else if (state.llcFee >= 300) {
    tips.push(`Budget ${fmt(state.llcFee)} for the LLC filing fee in ${state.name}, which is above the national average. Consider whether an LLC is necessary right away or if you can operate as a sole proprietorship initially.`);
  }

  if (state.annualReportFee > 200) {
    tips.push(`Don't forget ${state.name}'s ${fmt(state.annualReportFee)} annual report fee for LLCs - it's an ongoing cost that catches new business owners off guard.`);
  }

  // Business type specific tips
  if (bt.includes('restaurant') || bt.includes('bakery') || bt.includes('coffee')) {
    if (state.rentMult > 1.1) {
      tips.push(`Commercial kitchen space in ${state.name} runs above the national average. Look for second-generation restaurant space (previously a restaurant) to save on buildout costs - the plumbing, ventilation, and grease traps may already be in place.`);
    } else {
      tips.push(`Commercial rents in ${state.name} are below the national average, which means you can get more square footage for your money. Use that to your advantage with a layout that maximizes seating and kitchen efficiency.`);
    }
  }

  if (bt.includes('food truck')) {
    const cityNote = state.majorCities[0];
    tips.push(`Research ${cityNote}'s specific food truck permitting process early - requirements vary dramatically between ${state.name} cities, and permit wait times can delay your launch by months.`);
    if (!state.hasStateTax) {
      tips.push(`${state.name}'s lack of state income tax makes the food truck business model more attractive since margins are already tight - every percentage point you keep matters.`);
    }
  }

  if (bt.includes('cleaning') || bt.includes('pressure washing')) {
    tips.push(`Start by targeting ${state.majorCities[0]} and ${state.majorCities[1]} suburbs where homeowners have the income to hire cleaning services but are underserved compared to the city center.`);
    if (state.laborMult < 0.92) {
      tips.push(`${state.name}'s lower labor costs mean you can hire helpers sooner and scale faster than operators in high-cost states - consider bringing on your first employee within the first 90 days.`);
    }
  }

  if (bt.includes('gym') || bt.includes('personal training')) {
    tips.push(`Check ${state.name}'s specific requirements for personal trainer and gym facility licensing - some states require facility permits, AED equipment, and specific insurance minimums that vary from the national baseline.`);
    if (state.majorCities.length > 2) {
      tips.push(`Consider ${state.majorCities[2]} as an alternative to ${state.majorCities[0]} - smaller ${state.name} cities often have less gym competition per capita with surprisingly strong demand.`);
    }
  }

  if (bt.includes('landscaping')) {
    if (['florida', 'texas', 'georgia', 'north-carolina', 'south-carolina', 'louisiana', 'alabama', 'mississippi', 'arizona'].includes(stateKey)) {
      tips.push(`${state.name}'s warm climate means a longer operating season than northern states, which helps you recoup startup costs faster - but summer heat requires hydration planning and earlier start times for crews.`);
    } else if (['michigan', 'ohio', 'illinois', 'pennsylvania', 'new-york', 'minnesota', 'wisconsin'].includes(stateKey)) {
      tips.push(`Plan for ${state.name}'s seasonal cycle - build snow removal into your service offering to maintain revenue through winter months when landscaping work drops off.`);
    }
  }

  if (bt.includes('dog grooming')) {
    tips.push(`${state.name} may require specific animal handling or grooming certifications depending on the city - check with your local ${state.majorCities[0]} business licensing office before investing in equipment.`);
  }

  return tips.slice(0, 4);
}

/**
 * Build state-specific FAQs.
 */
function getStateFAQs(businessType, state, adjustedLow, adjustedHigh) {
  const faqs = [];

  faqs.push({
    q: `How much does it cost to start a ${businessType.toLowerCase()} in ${state.name}?`,
    a: `Starting a ${businessType.toLowerCase()} in ${state.name} typically costs between ${fmt(adjustedLow)} and ${fmt(adjustedHigh)}, depending on your location within the state, your business model, and how lean you launch. Costs in ${state.majorCities[0]} tend to run higher than in smaller ${state.name} cities like ${state.majorCities[state.majorCities.length - 1]}.`,
  });

  faqs.push({
    q: `Do I need a special license to operate a ${businessType.toLowerCase()} in ${state.name}?`,
    a: `Yes. At minimum, you need a ${state.name} business license and any industry-specific permits required by your city or county. LLC formation costs ${fmt(state.llcFee)} in ${state.name}${state.annualReportFee > 0 ? `, plus a ${fmt(state.annualReportFee)} annual report fee` : ''}. Check with your local ${state.majorCities[0]} or ${state.majorCities[1]} city hall for specific requirements.`,
  });

  if (state.hasStateTax) {
    faqs.push({
      q: `How does ${state.name}'s state income tax affect my ${businessType.toLowerCase()}?`,
      a: `${state.name}'s top state income tax rate is ${fmtPct(state.stateTaxRate)}. As a business owner, you will typically pay this on your business profits through your personal return (if you are an LLC or sole proprietorship). Factor this into your pricing and profitability projections from the start.`,
    });
  } else {
    faqs.push({
      q: `Does ${state.name} have a state income tax?`,
      a: `No. ${state.name} has no state income tax, which is a significant advantage for business owners. Your business profits are only subject to federal income tax and self-employment tax, which means more of your revenue stays in your business compared to states with income taxes of 5-10%.`,
    });
  }

  faqs.push({
    q: `Is ${state.name} a good state to start a ${businessType.toLowerCase()}?`,
    a: `${state.name} ${state.costOfLiving < 1.0 ? 'offers below-average costs that help new businesses reach profitability faster' : 'has above-average costs but also a large consumer market'}. ${state.businessClimate.split('.')[0]}.`,
  });

  return faqs;
}

// ---------------------------------------------------------------------------
// Build FAQ Schema JSON
// ---------------------------------------------------------------------------
function buildFAQSchema(faqs) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Cost difference explanation per state
// ---------------------------------------------------------------------------
function getCostDiffExplanation(state) {
  const parts = [];

  if (state.costOfLiving > 1.05) {
    parts.push(`${state.name}'s cost of living is ${Math.round((state.costOfLiving - 1) * 100)}% above the national average, which affects everything from supplies to services you need to purchase.`);
  } else if (state.costOfLiving < 0.95) {
    parts.push(`${state.name}'s cost of living is ${Math.round((1 - state.costOfLiving) * 100)}% below the national average, which reduces the cost of supplies, services, and day-to-day expenses.`);
  } else {
    parts.push(`${state.name}'s cost of living is close to the national average, so most supply and service costs will be in line with national estimates.`);
  }

  if (state.laborMult > 1.05) {
    parts.push(`Labor costs run about ${Math.round((state.laborMult - 1) * 100)}% above average, driven by ${state.minWage > 12 ? `a $${state.minWage}/hour minimum wage and` : ''} market competition for workers in ${state.majorCities[0]} and surrounding areas.`);
  } else if (state.laborMult < 0.92) {
    parts.push(`Labor costs are roughly ${Math.round((1 - state.laborMult) * 100)}% below the national average, giving you an advantage when hiring staff. ${state.minWage <= 7.25 ? 'The state follows the federal minimum wage, though competitive hiring typically requires paying above that.' : ''}`);
  } else {
    parts.push(`Labor costs in ${state.name} are near the national average${state.minWage > 12 ? `, though the $${state.minWage}/hour minimum wage sets a higher floor for entry-level positions` : ''}.`);
  }

  if (state.rentMult > 1.10) {
    parts.push(`Commercial rent is the biggest cost driver in ${state.name} - expect to pay ${Math.round((state.rentMult - 1) * 100)}% more than the national average for retail or commercial space, particularly in ${state.majorCities[0]}.`);
  } else if (state.rentMult < 0.80) {
    parts.push(`Commercial rents in ${state.name} are ${Math.round((1 - state.rentMult) * 100)}% below the national average, which is one of the biggest cost advantages for businesses that need physical space.`);
  } else {
    parts.push(`Commercial rents in ${state.name} are ${state.rentMult < 1 ? 'slightly below' : 'close to'} the national average, with significant variation between ${state.majorCities[0]} and smaller cities.`);
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Build state-specific opening paragraphs
// ---------------------------------------------------------------------------
function getOpeningParagraphs(businessType, state, adjustedLow, adjustedHigh, baseLow, baseHigh) {
  const costDirection = (adjustedLow + adjustedHigh) > (baseLow + baseHigh) ? 'higher' : 'lower';
  const diffPct = Math.abs(Math.round(((adjustedLow + adjustedHigh) / (baseLow + baseHigh) - 1) * 100));

  let p1 = `<p><strong>Starting a ${businessType} in ${state.name} typically costs between ${fmt(adjustedLow)} and ${fmt(adjustedHigh)}.</strong> `;
  if (diffPct > 3) {
    p1 += `That is about ${diffPct}% ${costDirection} than the national average of ${fmtRange(baseLow, baseHigh)}, driven primarily by ${state.name}'s ${costDirection === 'higher' ? 'above-average' : 'below-average'} cost of living, labor rates, and commercial rents.</p>`;
  } else {
    p1 += `That is roughly in line with the national average of ${fmtRange(baseLow, baseHigh)}, as ${state.name}'s costs track close to the national baseline.</p>`;
  }

  let p2 = `<p>${state.businessClimate}</p>`;

  const regNotes = getStateRegNotes(businessType, state);
  let p3 = `<p>From a regulatory standpoint, ${state.name} has specific requirements to plan for. `;
  p3 += regNotes.slice(0, 2).join(' ') + '</p>';

  return p1 + '\n\n' + p2 + '\n\n' + p3;
}

// ---------------------------------------------------------------------------
// Build cost breakdown table
// ---------------------------------------------------------------------------
function buildCostTable(businessType, state, adjustedLow, adjustedHigh) {
  // Generate reasonable line items based on business type
  const items = getCostLineItems(businessType, state);

  let table = '<figure class="wp-block-table">\n<table>\n<thead><tr><th>Cost Category</th><th>Estimated Range</th><th>Notes</th></tr></thead>\n<tbody>\n';

  for (const item of items) {
    table += `<tr><td>${item.name}</td><td>${fmtRange(item.low, item.high)}</td><td>${item.note}</td></tr>\n`;
  }

  table += `<tr style="font-weight:bold; background-color:#f0f7f0;"><td><strong>Total Estimated Startup Cost</strong></td><td><strong>${fmtRange(adjustedLow, adjustedHigh)}</strong></td><td></td></tr>\n`;
  table += '</tbody></table></figure>\n';
  table += `<p><em>Costs adjusted for ${state.name}'s cost of living, labor rates, and commercial rents.</em></p>`;

  return table;
}

/**
 * Generate cost line items based on business type, adjusted for state.
 */
function getCostLineItems(businessType, state) {
  const bt = businessType.toLowerCase();
  const mult = state.costOfLiving * 0.4 + state.laborMult * 0.35 + state.rentMult * 0.25;

  const adjustItem = (low, high) => ({
    low: adjustCost(low, state),
    high: adjustCost(high, state),
  });

  if (bt.includes('restaurant')) {
    return [
      { name: 'Lease & Security Deposit', ...adjustItem(10000, 50000), note: `${state.name} commercial rates apply` },
      { name: 'Kitchen Equipment', ...adjustItem(30000, 150000), note: 'Ovens, refrigeration, prep stations' },
      { name: 'Interior Buildout & Renovation', ...adjustItem(50000, 200000), note: `${state.name} contractor rates` },
      { name: 'Licenses, Permits & Inspections', ...adjustItem(5000, 20000), note: `${state.name}-specific requirements` },
      { name: 'Initial Inventory & Supplies', ...adjustItem(5000, 15000), note: 'Food, beverages, smallwares' },
      { name: 'POS System & Technology', ...adjustItem(2000, 8000), note: 'Hardware and software' },
      { name: 'Furniture & Fixtures', ...adjustItem(10000, 50000), note: 'Tables, chairs, decor' },
      { name: 'Marketing & Grand Opening', ...adjustItem(3000, 10000), note: 'Signage, ads, launch event' },
      { name: 'Insurance', ...adjustItem(3000, 10000), note: 'General liability, workers comp' },
      { name: 'Working Capital (3 months)', ...adjustItem(15000, 75000), note: 'Payroll, rent, supplies buffer' },
    ];
  }

  if (bt.includes('food truck')) {
    return [
      { name: 'Vehicle Purchase & Customization', ...adjustItem(5000, 80000), note: 'Used or custom-built truck' },
      { name: 'Kitchen Equipment', ...adjustItem(5000, 15000), note: 'Griddles, fryers, refrigeration' },
      { name: 'Licenses & Permits', ...adjustItem(2000, 7000), note: `${state.name} mobile vendor permits` },
      { name: 'Commissary Kitchen', ...adjustItem(400, 1500), note: `Monthly - required in most ${state.name} cities` },
      { name: 'Insurance', ...adjustItem(2000, 5000), note: 'Commercial auto + general liability' },
      { name: 'Initial Inventory', ...adjustItem(1000, 3000), note: 'First food order and supplies' },
      { name: 'Branding & Wrap', ...adjustItem(2000, 5000), note: 'Vehicle wrap and menu design' },
      { name: 'Generator & Propane', ...adjustItem(3000, 8000), note: 'Power and fuel setup' },
      { name: 'POS System', ...adjustItem(500, 1500), note: 'Card reader and software' },
    ];
  }

  if (bt.includes('cleaning')) {
    return [
      { name: 'Cleaning Equipment & Supplies', ...adjustItem(200, 3000), note: 'Vacuum, mop, chemicals' },
      { name: 'Business Formation & Insurance', ...adjustItem(300, 2000), note: `${state.name} LLC + liability` },
      { name: 'Marketing & Website', ...adjustItem(300, 3000), note: 'Google ads, website, flyers' },
      { name: 'Vehicle Expenses', ...adjustItem(0, 3000), note: 'Gas, signage, or lease' },
      { name: 'Uniforms & Branding', ...adjustItem(100, 500), note: 'Shirts, business cards' },
      { name: 'Software & Booking System', ...adjustItem(100, 500), note: 'Scheduling and invoicing' },
      { name: 'Bonding & Background Checks', ...adjustItem(100, 1000), note: 'Client trust requirements' },
    ];
  }

  if (bt.includes('coffee')) {
    return [
      { name: 'Lease & Security Deposit', ...adjustItem(5000, 30000), note: `${state.name} commercial rates` },
      { name: 'Espresso Machine & Grinders', ...adjustItem(5000, 25000), note: 'La Marzocca, Breville, etc.' },
      { name: 'Interior Buildout', ...adjustItem(10000, 100000), note: `${state.name} contractor rates` },
      { name: 'Licenses & Permits', ...adjustItem(1000, 5000), note: `${state.name} food service permits` },
      { name: 'Furniture & Fixtures', ...adjustItem(3000, 20000), note: 'Tables, chairs, counter' },
      { name: 'Initial Inventory', ...adjustItem(1000, 5000), note: 'Beans, milk, cups, syrups' },
      { name: 'POS System', ...adjustItem(500, 3000), note: 'Square, Toast, or Clover' },
      { name: 'Marketing & Signage', ...adjustItem(1000, 5000), note: 'Exterior sign, social media' },
      { name: 'Insurance', ...adjustItem(1000, 3000), note: 'General liability, property' },
    ];
  }

  if (bt.includes('gym')) {
    return [
      { name: 'Lease & Buildout', ...adjustItem(15000, 150000), note: `${state.name} commercial rates` },
      { name: 'Fitness Equipment', ...adjustItem(15000, 200000), note: 'Cardio, weights, machines' },
      { name: 'Flooring & Mirrors', ...adjustItem(3000, 30000), note: 'Rubber flooring, wall mirrors' },
      { name: 'Insurance', ...adjustItem(2000, 10000), note: 'Liability, property, workers comp' },
      { name: 'Licenses & Permits', ...adjustItem(1000, 5000), note: `${state.name} facility permits` },
      { name: 'POS & Management Software', ...adjustItem(1000, 5000), note: 'Membership billing system' },
      { name: 'Marketing & Grand Opening', ...adjustItem(2000, 10000), note: 'Pre-sale campaign, signage' },
      { name: 'Working Capital', ...adjustItem(10000, 50000), note: 'First 3 months operating' },
    ];
  }

  if (bt.includes('landscaping')) {
    return [
      { name: 'Equipment (mower, trimmer, blower)', ...adjustItem(2000, 20000), note: 'Commercial-grade' },
      { name: 'Truck or Trailer', ...adjustItem(0, 15000), note: 'Used truck or trailer' },
      { name: 'Business Formation & Insurance', ...adjustItem(500, 3000), note: `${state.name} LLC + liability` },
      { name: 'Marketing & Website', ...adjustItem(300, 3000), note: 'Door hangers, Google, website' },
      { name: 'Hand Tools & Supplies', ...adjustItem(200, 2000), note: 'Rakes, shovels, wheelbarrow' },
      { name: 'Safety Gear & Uniforms', ...adjustItem(100, 500), note: 'Boots, gloves, ear protection' },
      { name: 'Software', ...adjustItem(100, 500), note: 'Invoicing and scheduling' },
    ];
  }

  if (bt.includes('personal training')) {
    return [
      { name: 'Lease & Space Buildout', ...adjustItem(5000, 40000), note: `${state.name} commercial rates` },
      { name: 'Equipment', ...adjustItem(5000, 30000), note: 'Weights, benches, machines' },
      { name: 'Certifications', ...adjustItem(500, 3000), note: 'NASM, ACE, or NSCA' },
      { name: 'Insurance', ...adjustItem(500, 3000), note: 'Professional liability' },
      { name: 'Business Formation & Licenses', ...adjustItem(200, 1000), note: `${state.name} LLC + permits` },
      { name: 'Marketing & Website', ...adjustItem(500, 3000), note: 'Social media, local ads' },
      { name: 'Software & Booking', ...adjustItem(200, 1500), note: 'Scheduling, payments, tracking' },
      { name: 'Working Capital', ...adjustItem(3000, 15000), note: '3 months operating buffer' },
    ];
  }

  if (bt.includes('dog grooming')) {
    return [
      { name: 'Grooming Equipment', ...adjustItem(1000, 10000), note: 'Tables, clippers, tubs, dryers' },
      { name: 'Lease or Mobile Unit', ...adjustItem(0, 50000), note: `${state.name} commercial or van` },
      { name: 'Business Formation & Insurance', ...adjustItem(300, 3000), note: `${state.name} LLC + liability` },
      { name: 'Supplies (shampoo, tools)', ...adjustItem(200, 2000), note: 'Initial inventory' },
      { name: 'Marketing & Website', ...adjustItem(300, 3000), note: 'Google, Yelp, social media' },
      { name: 'Training & Certification', ...adjustItem(500, 5000), note: 'Grooming school or apprentice' },
      { name: 'Software', ...adjustItem(100, 500), note: 'Booking and CRM' },
    ];
  }

  if (bt.includes('bakery')) {
    return [
      { name: 'Lease & Security Deposit', ...adjustItem(3000, 25000), note: `${state.name} commercial rates` },
      { name: 'Ovens & Baking Equipment', ...adjustItem(3000, 50000), note: 'Deck ovens, mixers, proofers' },
      { name: 'Interior Buildout', ...adjustItem(5000, 80000), note: `${state.name} contractor rates` },
      { name: 'Licenses & Permits', ...adjustItem(500, 5000), note: `${state.name} food service permits` },
      { name: 'Initial Ingredients & Packaging', ...adjustItem(500, 3000), note: 'Flour, sugar, butter, boxes' },
      { name: 'Display Cases & Fixtures', ...adjustItem(1000, 10000), note: 'Refrigerated and dry cases' },
      { name: 'POS System', ...adjustItem(500, 2000), note: 'Square or Toast' },
      { name: 'Marketing & Signage', ...adjustItem(500, 3000), note: 'Exterior sign, social media' },
      { name: 'Insurance', ...adjustItem(1000, 3000), note: 'General liability, property' },
    ];
  }

  if (bt.includes('pressure washing')) {
    return [
      { name: 'Pressure Washer', ...adjustItem(1000, 8000), note: 'Commercial-grade unit' },
      { name: 'Surface Cleaner & Accessories', ...adjustItem(200, 2000), note: 'Nozzles, hoses, surface cleaner' },
      { name: 'Business Formation & Insurance', ...adjustItem(300, 2000), note: `${state.name} LLC + liability` },
      { name: 'Marketing & Website', ...adjustItem(200, 2000), note: 'Door hangers, Google, website' },
      { name: 'Chemical Supplies', ...adjustItem(100, 1000), note: 'Degreasers, surfactants, SH' },
      { name: 'Trailer or Truck Setup', ...adjustItem(0, 3000), note: 'Water tank, trailer, hose reel' },
      { name: 'Safety Equipment', ...adjustItem(100, 500), note: 'Boots, goggles, gloves' },
    ];
  }

  // Fallback
  return [
    { name: 'Business Formation', ...adjustItem(200, 1000), note: `${state.name} LLC filing` },
    { name: 'Equipment & Supplies', ...adjustItem(1000, 20000), note: 'Industry-specific' },
    { name: 'Marketing', ...adjustItem(500, 5000), note: 'Website, ads, signage' },
    { name: 'Insurance', ...adjustItem(500, 3000), note: 'General liability' },
  ];
}

// ---------------------------------------------------------------------------
// Build cross-links to the same business in other states
// ---------------------------------------------------------------------------
function buildCrossLinks(businessSlugBase, currentStateKey, businessType) {
  const links = [];
  for (const sk of TARGET_STATES) {
    if (sk === currentStateKey) continue;
    const s = stateData[sk];
    if (!s) continue;
    const slug = `${businessSlugBase}-in-${sk}`;
    links.push(`<a href="/${slug}">${s.name}</a>`);
  }
  return links;
}

// ---------------------------------------------------------------------------
// Main generation loop
// ---------------------------------------------------------------------------
let generated = 0;

for (const baseSlug of TARGET_SLUGS) {
  const baseGuide = guidesIndex.find(g => g.slug === baseSlug);
  if (!baseGuide) {
    console.warn(`  Warning: base guide not found for ${baseSlug}`);
    continue;
  }

  const businessType = baseGuide.businessType;
  const category = baseGuide.category;
  const baseLow = baseGuide.costLow;
  const baseHigh = baseGuide.costHigh;

  // Extract the slug portion after "cost-to-start-a-" or "cost-to-start-an-"
  const slugBase = baseSlug; // e.g. "cost-to-start-a-food-truck"

  for (const stateKey of TARGET_STATES) {
    const state = stateData[stateKey];
    if (!state) {
      console.warn(`  Warning: state data not found for ${stateKey}`);
      continue;
    }

    const adjustedLow = adjustCost(baseLow, state);
    const adjustedHigh = adjustCost(baseHigh, state);
    const stateSlug = `${slugBase}-in-${stateKey}`;

    const title = `How Much Does It Cost to Start a ${businessType} in ${state.name}?`;
    const focusKeyword = `cost to start a ${businessType.toLowerCase()} in ${state.name.toLowerCase()}`;

    // Build content
    const opening = getOpeningParagraphs(businessType, state, adjustedLow, adjustedHigh, baseLow, baseHigh);
    const costTable = buildCostTable(businessType, state, adjustedLow, adjustedHigh);
    const costDiff = getCostDiffExplanation(state);
    const tips = getStateTips(businessType, stateKey, state);
    const faqs = getStateFAQs(businessType, state, adjustedLow, adjustedHigh);
    const crossLinks = buildCrossLinks(slugBase, stateKey, businessType);

    let content = opening;

    content += `\n\n<h2>Cost Breakdown for ${state.name}</h2>\n`;
    content += costTable;

    content += `\n\n<h2>${state.name} Business Requirements</h2>\n`;
    content += `<p>To legally operate a ${businessType.toLowerCase()} in ${state.name}, you will need to:</p>\n`;
    content += '<ul>\n';
    content += `<li><strong>Form an LLC or business entity</strong> - The filing fee in ${state.name} is ${fmt(state.llcFee)}${state.annualReportFee > 0 ? `, with a ${fmt(state.annualReportFee)} annual report fee` : ' (no annual report fee)'}.</li>\n`;
    content += `<li><strong>Obtain a business license</strong> - Requirements and fees vary by city. Contact your local ${state.majorCities[0]} or ${state.majorCities[1]} clerk's office for specifics.</li>\n`;
    if (state.salesTax > 0) {
      content += `<li><strong>Register for sales tax</strong> - ${state.name}'s state sales tax rate is ${fmtPct(state.salesTax)}. Local additions can push the effective rate higher. You will need a sales tax permit if you sell taxable goods or services.</li>\n`;
    } else {
      content += `<li><strong>No state sales tax registration needed</strong> - ${state.name} does not levy a state sales tax, simplifying your compliance.</li>\n`;
    }
    if (state.hasStateTax) {
      content += `<li><strong>Plan for state income tax</strong> - ${state.name}'s top rate is ${fmtPct(state.stateTaxRate)}. Set aside a portion of profits for quarterly estimated payments.</li>\n`;
    } else {
      content += `<li><strong>No state income tax</strong> - ${state.name} does not levy a state income tax on business profits, which is a meaningful advantage for profitability.</li>\n`;
    }
    content += `<li><strong>Get business insurance</strong> - General liability insurance is essential in ${state.name}. Most landlords and clients require at least $1 million in coverage.</li>\n`;
    content += '</ul>\n';

    content += `\n<h2>Why ${state.name} Costs Differ</h2>\n`;
    content += `<p>${costDiff}</p>\n`;

    content += `\n<h2>${state.name}-Specific Tips</h2>\n`;
    content += '<ul>\n';
    for (const tip of tips) {
      content += `<li>${tip}</li>\n`;
    }
    content += '</ul>\n';

    content += '\n<h2>Frequently Asked Questions</h2>\n';
    for (const faq of faqs) {
      content += `<h3>${faq.q}</h3>\n<p>${faq.a}</p>\n`;
    }

    // Link back to base guide
    content += `\n<hr>\n<p>See our full national <a href="/${baseSlug}">${businessType} cost guide</a> for detailed breakdowns, hidden costs, and money-saving strategies that apply everywhere.</p>\n`;

    // Cross-links to other states
    if (crossLinks.length > 0) {
      content += `\n<p><strong>Compare ${businessType.toLowerCase()} costs in other states:</strong> ${crossLinks.join(' | ')}</p>\n`;
    }

    // Build meta description
    const metaDescription = `How much does it cost to start a ${businessType.toLowerCase()} in ${state.name}? Expect ${fmtRange(adjustedLow, adjustedHigh)}. ${state.name}-specific costs, licensing, and requirements.`;

    // Build Facebook fields
    const facebookTitle = `Cost to Start a ${businessType} in ${state.name}: ${fmtRange(adjustedLow, adjustedHigh)}`;
    const facebookDescription = metaDescription;

    const guideData = {
      title,
      slug: stateSlug,
      category,
      businessType,
      costLow: adjustedLow,
      costHigh: adjustedHigh,
      content,
      metaDescription,
      focusKeyword,
      faqSchema: buildFAQSchema(faqs),
      facebookTitle,
      facebookDescription,
    };

    writeFileSync(join(GUIDES_DIR, `${stateSlug}.json`), JSON.stringify(guideData));
    generated++;
  }
}

console.log(`\nState pages generated: ${generated}`);
console.log('Run "node scripts/build-data.mjs" to merge into guides-index.json');
