#!/usr/bin/env node
/**
 * Generates state-specific guide pages for the top 10 business types
 * across all 50 US states (500 pages total).
 *
 * v2 — Deep, varied, authentic content per state-business combination.
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

// Load overrides with graceful fallback
let overrides = {};
const overridesPath = join(DATA_DIR, 'state-business-overrides.json');
try {
  if (existsSync(overridesPath)) {
    overrides = JSON.parse(readFileSync(overridesPath, 'utf-8'));
  }
} catch (e) {
  console.warn('  Note: state-business-overrides.json not found or invalid, using fallback content.');
}

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

// All 50 US states (keys from state-data.json)
const TARGET_STATES = Object.keys(stateData);

// ---------------------------------------------------------------------------
// State neighbor map for cross-links
// ---------------------------------------------------------------------------
const STATE_NEIGHBORS = {
  'alabama': ['georgia', 'tennessee', 'mississippi', 'florida', 'louisiana'],
  'alaska': ['washington', 'hawaii'],
  'arizona': ['california', 'nevada', 'utah', 'new-mexico', 'colorado'],
  'arkansas': ['texas', 'oklahoma', 'tennessee', 'mississippi', 'louisiana', 'missouri'],
  'california': ['oregon', 'washington', 'nevada', 'arizona'],
  'colorado': ['utah', 'wyoming', 'nebraska', 'kansas', 'new-mexico', 'arizona'],
  'connecticut': ['new-york', 'massachusetts', 'rhode-island', 'new-jersey'],
  'delaware': ['maryland', 'pennsylvania', 'new-jersey', 'virginia'],
  'florida': ['georgia', 'alabama', 'south-carolina', 'tennessee'],
  'georgia': ['florida', 'south-carolina', 'north-carolina', 'tennessee', 'alabama'],
  'hawaii': ['california', 'alaska'],
  'idaho': ['washington', 'oregon', 'montana', 'wyoming', 'utah', 'nevada'],
  'illinois': ['indiana', 'wisconsin', 'iowa', 'missouri', 'michigan'],
  'indiana': ['illinois', 'ohio', 'kentucky', 'michigan'],
  'iowa': ['minnesota', 'wisconsin', 'illinois', 'missouri', 'nebraska', 'south-dakota'],
  'kansas': ['missouri', 'nebraska', 'colorado', 'oklahoma'],
  'kentucky': ['tennessee', 'virginia', 'west-virginia', 'ohio', 'indiana', 'illinois'],
  'louisiana': ['texas', 'mississippi', 'arkansas', 'alabama'],
  'maine': ['new-hampshire', 'massachusetts', 'vermont'],
  'maryland': ['virginia', 'pennsylvania', 'delaware', 'west-virginia'],
  'massachusetts': ['connecticut', 'rhode-island', 'new-hampshire', 'new-york', 'vermont'],
  'michigan': ['ohio', 'indiana', 'wisconsin', 'illinois'],
  'minnesota': ['wisconsin', 'iowa', 'north-dakota', 'south-dakota'],
  'mississippi': ['alabama', 'louisiana', 'tennessee', 'arkansas'],
  'missouri': ['illinois', 'kansas', 'arkansas', 'tennessee', 'kentucky', 'iowa'],
  'montana': ['idaho', 'wyoming', 'north-dakota', 'south-dakota'],
  'nebraska': ['iowa', 'kansas', 'south-dakota', 'colorado', 'wyoming', 'missouri'],
  'nevada': ['california', 'oregon', 'idaho', 'utah', 'arizona'],
  'new-hampshire': ['maine', 'massachusetts', 'vermont', 'connecticut'],
  'new-jersey': ['new-york', 'pennsylvania', 'delaware', 'connecticut'],
  'new-mexico': ['texas', 'arizona', 'colorado', 'utah', 'oklahoma'],
  'new-york': ['new-jersey', 'connecticut', 'pennsylvania', 'massachusetts', 'vermont'],
  'north-carolina': ['south-carolina', 'virginia', 'tennessee', 'georgia'],
  'north-dakota': ['south-dakota', 'minnesota', 'montana'],
  'ohio': ['michigan', 'indiana', 'kentucky', 'west-virginia', 'pennsylvania'],
  'oklahoma': ['texas', 'kansas', 'arkansas', 'missouri', 'colorado', 'new-mexico'],
  'oregon': ['washington', 'california', 'idaho', 'nevada'],
  'pennsylvania': ['new-york', 'new-jersey', 'ohio', 'west-virginia', 'maryland', 'delaware'],
  'rhode-island': ['massachusetts', 'connecticut', 'new-york'],
  'south-carolina': ['north-carolina', 'georgia', 'tennessee'],
  'south-dakota': ['north-dakota', 'minnesota', 'iowa', 'nebraska', 'wyoming', 'montana'],
  'tennessee': ['kentucky', 'virginia', 'north-carolina', 'georgia', 'alabama', 'mississippi', 'arkansas', 'missouri'],
  'texas': ['oklahoma', 'louisiana', 'new-mexico', 'arkansas'],
  'utah': ['colorado', 'nevada', 'idaho', 'wyoming', 'arizona', 'new-mexico'],
  'vermont': ['new-hampshire', 'massachusetts', 'new-york', 'maine'],
  'virginia': ['maryland', 'north-carolina', 'west-virginia', 'kentucky', 'tennessee'],
  'washington': ['oregon', 'idaho', 'california'],
  'west-virginia': ['virginia', 'ohio', 'pennsylvania', 'kentucky', 'maryland'],
  'wisconsin': ['minnesota', 'iowa', 'illinois', 'michigan'],
  'wyoming': ['montana', 'south-dakota', 'nebraska', 'colorado', 'utah', 'idaho'],
};

// ---------------------------------------------------------------------------
// Related business type map — what other guides pair well
// ---------------------------------------------------------------------------
const RELATED_BUSINESSES = {
  'restaurant': ['coffee-shop', 'bakery', 'food-truck'],
  'food-truck': ['restaurant', 'bakery', 'coffee-shop'],
  'cleaning-business': ['pressure-washing-business', 'landscaping-business'],
  'coffee-shop': ['bakery', 'restaurant', 'food-truck'],
  'gym': ['personal-training-studio'],
  'landscaping-business': ['pressure-washing-business', 'cleaning-business'],
  'personal-training-studio': ['gym'],
  'dog-grooming-business': ['cleaning-business'],
  'bakery': ['coffee-shop', 'restaurant', 'food-truck'],
  'pressure-washing-business': ['cleaning-business', 'landscaping-business'],
};

// ---------------------------------------------------------------------------
// Deterministic hash function for template selection
// ---------------------------------------------------------------------------
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick(arr, seed) {
  return arr[hashStr(seed) % arr.length];
}

function pickN(arr, n, seed) {
  const shuffled = [...arr];
  let h = hashStr(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = Math.abs(h) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

// ---------------------------------------------------------------------------
// Cost adjustment logic (preserved from v1)
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
// Get override data for a state-business combo
// ---------------------------------------------------------------------------
function getOverride(stateKey, businessType) {
  const btKey = businessType.toLowerCase().replace(/\s+/g, '-');
  // Try several key formats
  const keys = [
    `${stateKey}:${btKey}`,
    `${stateKey}_${btKey}`,
    `${stateKey}/${btKey}`,
  ];
  for (const k of keys) {
    if (overrides[k]) return overrides[k];
  }
  // Try nested format
  if (overrides[stateKey] && overrides[stateKey][btKey]) {
    return overrides[stateKey][btKey];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Classify state characteristics
// ---------------------------------------------------------------------------
function classifyState(state) {
  const costLevel = state.costOfLiving >= 1.15 ? 'high' :
    state.costOfLiving >= 1.03 ? 'moderate' :
    state.costOfLiving >= 0.93 ? 'average' : 'low';
  const taxFriendly = !state.hasStateTax || state.stateTaxRate < 0.04;
  const highWage = state.minWage >= 14;
  const expensiveRent = state.rentMult >= 1.10;
  const cheapRent = state.rentMult < 0.80;
  return { costLevel, taxFriendly, highWage, expensiveRent, cheapRent };
}

function isFoodBiz(bt) {
  return ['restaurant', 'food truck', 'coffee shop', 'bakery'].some(t => bt.toLowerCase().includes(t));
}

function isServiceBiz(bt) {
  return ['cleaning', 'landscaping', 'pressure washing', 'dog grooming', 'personal training'].some(t => bt.toLowerCase().includes(t));
}

function isPhysicalSpaceBiz(bt) {
  return ['restaurant', 'coffee shop', 'bakery', 'gym', 'hair salon', 'personal training'].some(t => bt.toLowerCase().includes(t));
}

// ---------------------------------------------------------------------------
// Climate and season data
// ---------------------------------------------------------------------------
const CLIMATE_ZONES = {
  'hot-year-round': ['florida', 'hawaii', 'louisiana', 'texas', 'arizona'],
  'warm-long-season': ['georgia', 'south-carolina', 'north-carolina', 'alabama', 'mississippi', 'arkansas', 'tennessee', 'nevada', 'new-mexico', 'oklahoma'],
  'four-season-moderate': ['california', 'virginia', 'maryland', 'delaware', 'kentucky', 'missouri', 'oregon', 'washington', 'utah', 'colorado', 'kansas', 'nebraska', 'indiana', 'illinois', 'ohio'],
  'cold-winter': ['new-york', 'new-jersey', 'connecticut', 'massachusetts', 'rhode-island', 'new-hampshire', 'vermont', 'maine', 'pennsylvania', 'michigan', 'wisconsin', 'minnesota', 'iowa', 'north-dakota', 'south-dakota', 'montana', 'wyoming', 'idaho', 'west-virginia', 'alaska'],
};

function getClimateZone(stateKey) {
  for (const [zone, states] of Object.entries(CLIMATE_ZONES)) {
    if (states.includes(stateKey)) return zone;
  }
  return 'four-season-moderate';
}

// ---------------------------------------------------------------------------
// Varied opening paragraph generators
// ---------------------------------------------------------------------------
function buildOpening(businessType, stateKey, state, adjustedLow, adjustedHigh, baseLow, baseHigh, override) {
  const bt = businessType.toLowerCase();
  const costDirection = (adjustedLow + adjustedHigh) > (baseLow + baseHigh) ? 'higher' : 'lower';
  const diffPct = Math.abs(Math.round(((adjustedLow + adjustedHigh) / (baseLow + baseHigh) - 1) * 100));
  const range = fmtRange(adjustedLow, adjustedHigh);
  const natRange = fmtRange(baseLow, baseHigh);
  const seed = stateKey + ':' + bt;
  const profile = classifyState(state);
  const zone = getClimateZone(stateKey);

  // Select opening style deterministically
  const styleIndex = hashStr(seed) % 5;

  let p1;
  switch (styleIndex) {
    case 0: // Direct cost lead
      p1 = pick([
        `<p><strong>A ${bt} in ${state.name} will run you ${range} to get off the ground.</strong> `,
        `<p><strong>Plan on investing ${range} to launch a ${bt} in ${state.name}.</strong> `,
        `<p><strong>Opening a ${bt} in ${state.name} requires between ${range} in startup capital.</strong> `,
      ], seed + 'p1v');
      if (diffPct > 3) {
        p1 += `That puts ${state.name} about ${diffPct}% ${costDirection} than the national average of ${natRange}${costDirection === 'higher' ? ', a premium driven by ' + (profile.expensiveRent ? 'above-average commercial rents' : 'elevated labor and supply costs') : ', thanks in part to ' + (profile.cheapRent ? 'affordable commercial space' : 'reasonable labor and operating costs')}.`;
      } else {
        p1 += `That lines up closely with the national average of ${natRange}, putting ${state.name} squarely in the middle of the pack for ${bt} startup costs.`;
      }
      p1 += '</p>';
      break;

    case 1: { // State-first lead
      const climateAdj = profile.costLevel === 'high' ? 'one of the more expensive' :
        profile.costLevel === 'low' ? 'one of the most affordable' :
        profile.taxFriendly ? 'a tax-friendly' : 'a moderately priced';
      p1 = `<p><strong>${state.name}'s ${state.businessClimate.split('.')[0].toLowerCase().replace(state.name.toLowerCase(), '').trim().replace(/^(has|is|offers|combines|benefits|charges|draws|consistently)/, (m) => m)} makes it ${climateAdj} state for launching a ${bt}.</strong> `;
      p1 += `Expect to invest ${range} total, compared to the national baseline of ${natRange}.`;
      p1 += '</p>';
      break;
    }
    case 2: // Comparison lead
      if (diffPct > 3) {
        p1 = `<p><strong>Compared to the national average, ${state.name} ${costDirection === 'lower' ? 'saves' : 'costs'} you about ${diffPct}% on startup costs for a ${bt}.</strong> `;
        p1 += `Where the typical ${bt} nationally runs ${natRange}, you are looking at ${range} in ${state.name}.`;
      } else {
        p1 = `<p><strong>Starting a ${bt} in ${state.name} costs almost exactly what it does at the national level: ${range} versus the ${natRange} average.</strong> `;
        p1 += `The state does not dramatically shift the equation in either direction.`;
      }
      p1 += '</p>';
      break;

    case 3: { // Market-first lead
      const marketTrait = state.topIndustries[0] && state.topIndustries[0].toLowerCase() !== bt
        ? `${state.topIndustries[0].toLowerCase()}-driven economy`
        : `growing ${state.majorCities[0]} metro area`;
      const opportunityWord = profile.costLevel === 'low' ? 'a cost advantage' :
        profile.costLevel === 'high' ? 'a challenge on overhead' : 'a mixed picture on costs';
      p1 = `<p><strong>${state.name}'s ${marketTrait} creates ${opportunityWord} for ${bt} operators.</strong> `;
      p1 += `Total startup costs range from ${range}, ${diffPct > 3 ? `about ${diffPct}% ${costDirection} than the national figure of ${natRange}` : `closely tracking the national average of ${natRange}`}.`;
      p1 += '</p>';
      break;
    }
    case 4: { // Question lead
      p1 = `<p><strong>How much does it actually cost to open a ${bt} in ${state.name}?</strong> `;
      p1 += `The realistic answer is ${range}. `;
      if (diffPct > 3) {
        p1 += `That is ${diffPct}% ${costDirection} than the ${natRange} national average, `;
        p1 += costDirection === 'higher'
          ? `largely because ${state.name}'s ${profile.expensiveRent ? 'commercial rents' : 'labor rates'} run above the national baseline.`
          : `reflecting ${state.name}'s ${profile.cheapRent ? 'affordable real estate' : 'lower cost of living'}.`;
      } else {
        p1 += `That is roughly in line with the national average of ${natRange}.`;
      }
      p1 += '</p>';
      break;
    }
  }

  // Second paragraph — business climate, varied framing
  const climateFrames = [
    `<p>${state.businessClimate}</p>`,
    `<p>Here is the landscape you are working with: ${state.businessClimate.charAt(0).toLowerCase() + state.businessClimate.slice(1)}</p>`,
    `<p>The broader business environment matters for your bottom line. ${state.businessClimate}</p>`,
  ];
  const p2 = pick(climateFrames, seed + 'p2');

  // Third paragraph — regulatory context
  const regNotes = getStateRegNotes(businessType, state);
  const regFrames = [
    `<p>On the regulatory side, there are a few ${state.name}-specific factors that will directly affect your startup budget. ${regNotes.slice(0, 2).join(' ')}</p>`,
    `<p>Before you sign a lease or order equipment, understand what ${state.name} requires. ${regNotes.slice(0, 2).join(' ')}</p>`,
    `<p>${state.name}'s regulatory environment shapes your costs from day one. ${regNotes.slice(0, 2).join(' ')}</p>`,
  ];
  const p3 = pick(regFrames, seed + 'p3');

  // Fourth paragraph — market positioning or opportunity
  const p4Lines = [];
  if (isFoodBiz(businessType)) {
    if (profile.costLevel === 'low') {
      p4Lines.push(`Lower overhead in ${state.name} means you can undercut competitors on price or invest more in quality ingredients and presentation. For a ${bt}, that margin flexibility is significant.`);
    } else if (profile.costLevel === 'high') {
      p4Lines.push(`Higher costs in ${state.name} mean you will need to position your ${bt} at a price point that supports premium rents and wages. The good news is that ${state.name} consumers are accustomed to paying more, especially in ${state.majorCities[0]}.`);
    } else {
      p4Lines.push(`${state.name}'s moderate cost structure means your ${bt} can compete on both price and quality without the extreme overhead pressure of coastal markets.`);
    }
  } else if (isServiceBiz(businessType)) {
    if (profile.costLevel === 'low') {
      p4Lines.push(`The low barrier to entry in ${state.name} is a double-edged sword for ${bt} operators. Your startup costs stay manageable, but competition from other low-overhead operators can be fierce. Differentiation through professionalism, reliability, and marketing is how you win.`);
    } else {
      p4Lines.push(`${state.name}'s market supports premium pricing for ${bt} services, particularly in ${state.majorCities[0]} and ${state.majorCities.length > 1 ? state.majorCities[1] : 'surrounding suburbs'}. Homeowners and businesses with higher incomes are willing to pay more for reliable, professional service.`);
    }
  } else {
    if (state.majorCities.length >= 2) {
      p4Lines.push(`Your location within ${state.name} will dramatically affect both your costs and your revenue potential. ${state.majorCities[0]} offers the largest customer base but the highest rents, while ${state.majorCities[state.majorCities.length - 1]} could give you a foothold at a fraction of the cost.`);
    }
  }
  const p4 = p4Lines.length > 0 ? `<p>${p4Lines[0]}</p>` : '';

  return [p1, p2, p3, p4].filter(Boolean).join('\n\n');
}

// ---------------------------------------------------------------------------
// State-specific regulatory notes (preserved and expanded)
// ---------------------------------------------------------------------------
function getStateRegNotes(businessType, state) {
  const bt = businessType.toLowerCase();
  const s = state.name;
  const notes = [];

  if (!state.hasStateTax) {
    notes.push(`${s} has no state income tax, which means more of your business profits stay in your pocket compared to the national average.`);
  } else if (state.stateTaxRate > 0.08) {
    notes.push(`${s}'s top income tax rate of ${fmtPct(state.stateTaxRate)} is among the highest in the nation, which will take a meaningful bite out of profits as your business grows.`);
  } else if (state.stateTaxRate > 0.05) {
    notes.push(`${s} levies a moderate state income tax of up to ${fmtPct(state.stateTaxRate)}, which is a factor in your long-term profitability planning.`);
  } else {
    notes.push(`${s}'s state income tax tops out at ${fmtPct(state.stateTaxRate)}, which is relatively low and keeps more of your earnings working for you.`);
  }

  if (state.minWage > 14) {
    notes.push(`The state minimum wage of ${fmt(state.minWage)}/hour is well above the federal level, which pushes labor costs higher for businesses that rely on hourly employees.`);
  } else if (state.minWage > 10) {
    notes.push(`${s}'s minimum wage of ${fmt(state.minWage)}/hour is above the federal minimum, adding moderate labor cost pressure.`);
  } else if (state.minWage <= 7.25) {
    notes.push(`${s} follows the federal minimum wage of $7.25/hour, though market rates for skilled workers are typically much higher.`);
  }

  if (isFoodBiz(bt) && state.salesTax > 0.06) {
    notes.push(`The state sales tax of ${fmtPct(state.salesTax)} (before local additions) applies to prepared food, which affects your menu pricing strategy.`);
  } else if (isFoodBiz(bt) && state.salesTax === 0) {
    notes.push(`${s} has no state sales tax, giving your food business a pricing advantage - customers pay exactly what is on the menu.`);
  }

  if (isServiceBiz(bt) && state.salesTax > 0) {
    notes.push(`Check whether ${s} applies its ${fmtPct(state.salesTax)} sales tax to your specific service category - some states tax services differently than goods.`);
  }

  return notes;
}

// ---------------------------------------------------------------------------
// Cost line items (preserved from v1)
// ---------------------------------------------------------------------------
function getCostLineItems(businessType, state) {
  const bt = businessType.toLowerCase();

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
// Build cost breakdown table
// ---------------------------------------------------------------------------
function buildCostTable(businessType, state, adjustedLow, adjustedHigh) {
  const items = getCostLineItems(businessType, state);

  let table = '<figure class="wp-block-table">\n<table>\n<thead><tr><th>Cost Category</th><th>Estimated Range</th><th>Notes</th></tr></thead>\n<tbody>\n';

  for (const item of items) {
    table += `<tr><td>${item.name}</td><td>${fmtRange(item.low, item.high)}</td><td>${item.note}</td></tr>\n`;
  }

  table += `<tr style="font-weight:bold; background-color:#f0f7f0;"><td><strong>Total Estimated Startup Cost</strong></td><td><strong>${fmtRange(adjustedLow, adjustedHigh)}</strong></td><td></td></tr>\n`;
  table += '</tbody></table></figure>\n';

  const tableNotes = [
    `<p><em>Costs adjusted for ${state.name}'s cost of living (${state.costOfLiving > 1 ? '+' : ''}${Math.round((state.costOfLiving - 1) * 100)}%), labor rates, and commercial rents. Your actual costs will depend on your location within ${state.name} and how lean you launch.</em></p>`,
    `<p><em>These figures reflect ${state.name}-adjusted pricing. Costs in ${state.majorCities[0]} will typically run higher than in ${state.majorCities[state.majorCities.length - 1]} or rural areas.</em></p>`,
    `<p><em>All figures adjusted for ${state.name} market conditions. The low end assumes a lean launch; the high end reflects a fully equipped, prime-location setup in ${state.majorCities[0]}.</em></p>`,
  ];
  table += pick(tableNotes, stateKey + businessType + 'tn');

  return table;
}

// ---------------------------------------------------------------------------
// NEW SECTION: "What [State] [Business] Owners Actually Deal With"
// ---------------------------------------------------------------------------
function buildMarketRealitySection(businessType, stateKey, state, override) {
  const bt = businessType.toLowerCase();
  const seed = stateKey + ':' + bt + ':reality';
  const profile = classifyState(state);
  const zone = getClimateZone(stateKey);

  let paragraphs = [];

  // Use override marketContext if available
  if (override && override.marketContext) {
    paragraphs.push(override.marketContext);
  }

  // Generate authentic-feeling market context
  if (isFoodBiz(bt)) {
    if (zone === 'hot-year-round') {
      paragraphs.push(`Running a ${bt} in ${state.name} means dealing with heat - both in terms of weather and competition. Summer months push A/C costs through the roof, and if you are operating a food truck, you will notice foot traffic drops when temperatures hit triple digits. On the other hand, ${state.name} does not have the dead-of-winter slowdown that crushes food businesses in northern states. Your revenue curve is more consistent year-round.`);
    } else if (zone === 'cold-winter') {
      paragraphs.push(`${state.name}'s winters are the single biggest variable that ${bt} owners underestimate. November through March, foot traffic drops noticeably unless you are in a high-density urban area like ${state.majorCities[0]}. Smart operators build their financial model around 8-9 strong months and 3-4 slower ones. Delivery and catering revenue become critical lifelines during the slow season.`);
    } else {
      paragraphs.push(`${state.name}'s four-season climate gives ${bt} owners a relatively balanced revenue cycle, though spring and fall tend to be peak months. The key challenge is not weather but competition - ${state.majorCities[0]} has a mature food scene, and standing out requires either a genuinely unique concept or relentless execution on the basics.`);
    }

    if (profile.costLevel === 'high') {
      paragraphs.push(`The cost pressure in ${state.name} is real and ongoing. Food costs track national averages, but labor and rent are where ${state.name} hits harder. Expect to pay ${state.minWage > 12 ? `$${state.minWage}/hour minimum` : 'competitive market wages'} for line cooks and servers, and commercial kitchen space in ${state.majorCities[0]} that makes you question your life choices. The operators who survive here have either found undervalued locations or built enough volume to justify the overhead.`);
    } else if (profile.costLevel === 'low') {
      paragraphs.push(`The cost advantage in ${state.name} is substantial. You can find commercial kitchen space in ${state.majorCities[0]} for a fraction of what you would pay in cities like New York or San Francisco. That lower overhead gives you more breathing room during the first year, which is when most food businesses fail. Use that advantage to invest in quality ingredients and marketing rather than just pocketing the savings.`);
    }
  } else if (isServiceBiz(bt)) {
    if (bt.includes('cleaning') || bt.includes('pressure washing')) {
      paragraphs.push(`The ${bt} market in ${state.name} is straightforward to enter, which is both the opportunity and the challenge. Low startup costs mean you will have plenty of competitors, many of them running informal operations out of their personal vehicles. The operators who build real businesses in ${state.name} differentiate through reliability, insurance, professional presentation, and - most importantly - consistent marketing that keeps the phone ringing.`);
      if (state.majorCities.length >= 2) {
        paragraphs.push(`Geography matters more than you might think. ${state.majorCities[0]} and ${state.majorCities[1]} have the largest pools of potential customers, but also the most established competitors. Suburban areas just outside these cities often represent the sweet spot: homeowners who value professional service and are underserved by the big players who focus on commercial contracts.`);
      }
    } else if (bt.includes('landscaping')) {
      if (zone === 'hot-year-round' || zone === 'warm-long-season') {
        paragraphs.push(`${state.name}'s warm climate means grass grows most of the year, giving you more billing weeks than landscapers in northern states. But it also means your crews work in serious heat for months on end. Hydration, early start times, and crew rotation are not optional - they are how you keep employees and avoid liability. The upside is a nearly year-round revenue stream that northern competitors can only dream about.`);
      } else if (zone === 'cold-winter') {
        paragraphs.push(`Landscaping in ${state.name} is a seasonal business, full stop. You have roughly April through November for core landscaping work, and then you either pivot to snow removal, do holiday lighting, or sit on your hands. The most successful ${state.name} landscaping operators treat winter services as a core part of their model, not an afterthought. Snow plowing contracts with commercial properties can actually be more profitable per hour than summer mowing.`);
      }
      paragraphs.push(`Customer acquisition in ${state.name}'s landscaping market typically starts with door-to-door canvassing and yard signs in ${state.majorCities[0]} neighborhoods. Digital marketing helps, but this is still a business where a well-maintained truck, a clean uniform, and a neighbor's recommendation carry more weight than a Google ad.`);
    } else if (bt.includes('dog grooming')) {
      paragraphs.push(`Dog grooming in ${state.name} has grown steadily alongside the national trend of pet owners spending more per animal. ${state.majorCities[0]} has the densest concentration of potential clients, but also the most established shops. The mobile grooming model has gained significant traction in ${state.name}'s suburban areas - you go to the dog rather than the dog coming to you, and you can charge a premium for the convenience.`);
      paragraphs.push(`Repeat business is the entire model. A single grooming client comes back every 4-8 weeks, so acquiring 100-150 regular clients in ${state.name} can support a solid income. Getting those first 50 clients is the hard part. Yelp reviews, a Google Business profile, and partnerships with local vets and pet stores in ${state.majorCities[0]} and ${state.majorCities.length > 1 ? state.majorCities[1] : 'surrounding areas'} are your most reliable client acquisition channels.`);
    } else if (bt.includes('personal training')) {
      paragraphs.push(`The personal training market in ${state.name} varies dramatically by location. ${state.majorCities[0]} supports premium pricing - clients will pay $75-$150 per session for an experienced trainer with a clean, private studio. In smaller ${state.name} cities, $40-$80 per session is more realistic. The key variable is whether you lease your own space or train clients at an existing gym, which can cut your startup costs by 60% or more.`);
      paragraphs.push(`What separates thriving personal training studios from ones that close within two years in ${state.name} is usually not the training quality - it is the business side. Building a waitlist, maintaining a 90%+ retention rate, and eventually hiring other trainers to work under your brand. The trainers who treat it like a business from day one are the ones still operating three years in.`);
    }
  } else {
    // Gym or other physical space business
    if (bt.includes('gym')) {
      paragraphs.push(`Opening a gym in ${state.name} means competing for a finite pool of fitness-minded consumers. ${state.majorCities[0]} has the highest concentration of potential members, but also the most established competition from national chains like Planet Fitness, LA Fitness, and Anytime Fitness. The gyms that succeed as independent operations in ${state.name} almost always carve out a niche: CrossFit, powerlifting, martial arts, yoga, or a specific community that chains cannot replicate.`);
      if (profile.expensiveRent) {
        paragraphs.push(`Lease costs in ${state.name} are where gym economics get brutal. You need 3,000-10,000 square feet minimum, and at ${state.name}'s commercial rates, that monthly rent check can make or break you. Many successful ${state.name} gym owners have found space in industrial parks, strip mall end-caps, or second-floor retail - locations where rent is 30-50% less than prime ground-floor retail but still accessible enough to attract members.`);
      } else {
        paragraphs.push(`The good news for gym owners in ${state.name} is that commercial space is relatively affordable. You can find 5,000-8,000 square foot spaces in ${state.majorCities[0]} at rates that would be impossible in coastal markets. That means you can invest more of your startup capital into equipment and marketing rather than sinking it into rent and security deposits.`);
      }
    }
  }

  // Limit to 3 paragraphs max
  paragraphs = paragraphs.slice(0, 3);

  if (paragraphs.length === 0) return '';

  let section = `\n<h2>What ${state.name} ${businessType} Owners Actually Deal With</h2>\n`;
  section += paragraphs.map(p => `<p>${p}</p>`).join('\n\n');

  return section;
}

// ---------------------------------------------------------------------------
// NEW SECTION: City-by-City Cost Comparison
// ---------------------------------------------------------------------------
function buildCityComparisonSection(businessType, stateKey, state, adjustedLow, adjustedHigh, override) {
  const bt = businessType.toLowerCase();
  const cities = state.majorCities;
  if (!cities || cities.length < 2) return '';

  let section = `\n<h2>City-by-City Cost Comparison in ${state.name}</h2>\n`;

  // If override has city comparisons, use them
  if (override && override.cityComparisons) {
    if (Array.isArray(override.cityComparisons)) {
      section += '<ul>\n';
      for (const comp of override.cityComparisons) {
        section += `<li>${comp}</li>\n`;
      }
      section += '</ul>\n';
    } else if (typeof override.cityComparisons === 'string') {
      section += `<p>${override.cityComparisons}</p>\n`;
    }
    return section;
  }

  // Generate city comparison from state data
  const bigCity = cities[0];
  const midCity = cities.length > 2 ? cities[1] : null;
  const smallCity = cities[cities.length - 1];

  // Estimate city-level cost variation
  const bigCityPremium = Math.round(state.rentMult >= 1.1 ? 20 : state.rentMult >= 0.95 ? 15 : 10);
  const smallCityDiscount = Math.round(state.rentMult >= 1.1 ? 25 : state.rentMult >= 0.95 ? 18 : 12);

  const bigCityLow = Math.round(adjustedLow * (1 + bigCityPremium / 100) / 500) * 500 || adjustedLow;
  const bigCityHigh = Math.round(adjustedHigh * (1 + bigCityPremium / 100) / 500) * 500 || adjustedHigh;
  const smallCityLow = Math.round(adjustedLow * (1 - smallCityDiscount / 100) / 500) * 500 || adjustedLow;
  const smallCityHigh = Math.round(adjustedHigh * (1 - smallCityDiscount / 100) / 500) * 500 || adjustedHigh;

  section += `<p>Costs within ${state.name} are not uniform. Where you set up shop matters almost as much as what state you are in.</p>\n`;

  section += '<figure class="wp-block-table">\n<table>\n<thead><tr><th>City</th><th>Estimated Startup Range</th><th>Key Factor</th></tr></thead>\n<tbody>\n';
  section += `<tr><td>${bigCity}</td><td>${fmtRange(bigCityLow, bigCityHigh)}</td><td>Highest rents, largest customer base</td></tr>\n`;
  if (midCity) {
    section += `<tr><td>${midCity}</td><td>${fmtRange(adjustedLow, adjustedHigh)}</td><td>Moderate costs, growing market</td></tr>\n`;
  }
  section += `<tr><td>${smallCity}</td><td>${fmtRange(smallCityLow, smallCityHigh)}</td><td>Lower overhead, smaller customer pool</td></tr>\n`;
  section += '</tbody></table></figure>\n';

  // Add context paragraph
  if (isPhysicalSpaceBiz(bt)) {
    section += `<p>The biggest cost swing between ${bigCity} and ${smallCity} comes down to commercial lease rates. A ${bt} in ${bigCity} might pay ${bigCityPremium}% or more above the state average for comparable square footage. If your concept does not require heavy foot traffic, setting up in a growing suburb or secondary city can save you tens of thousands in the first year alone.</p>\n`;
  } else {
    section += `<p>For a ${bt}, the cost difference between ${bigCity} and ${smallCity} is less dramatic than for businesses that need retail space. Your biggest variable is likely marketing costs - it takes more ad spend to stand out in ${bigCity}'s competitive market, but the larger customer pool justifies it if you can handle the volume.</p>\n`;
  }

  return section;
}

// ---------------------------------------------------------------------------
// NEW SECTION: Hidden Costs
// ---------------------------------------------------------------------------
function buildHiddenCostsSection(businessType, stateKey, state, override) {
  const bt = businessType.toLowerCase();
  const seed = stateKey + ':' + bt + ':hidden';
  const zone = getClimateZone(stateKey);

  let section = `\n<h2>Hidden Costs ${state.name} ${businessType} Owners Don't Expect</h2>\n`;

  // Use override hidden costs if available
  if (override && override.hiddenCosts && override.hiddenCosts.length > 0) {
    section += '<ul>\n';
    for (const cost of override.hiddenCosts) {
      section += `<li><strong>${cost.name || cost.split(':')[0] || 'Unexpected cost'}</strong> - ${cost.detail || cost.split(':').slice(1).join(':') || cost}</li>\n`;
    }
    section += '</ul>\n';
    return section;
  }

  // Generate hidden costs from state data
  const hiddenCosts = [];

  // LLC/annual costs
  if (state.annualReportFee > 100) {
    hiddenCosts.push(`<strong>Annual LLC report fee (${fmt(state.annualReportFee)}/year)</strong> - Many new owners budget for the ${fmt(state.llcFee)} LLC filing fee but forget about ${state.name}'s ${fmt(state.annualReportFee)} annual report fee that hits every single year. Over five years, that is ${fmt(state.annualReportFee * 5)} just to keep your LLC in good standing.`);
  }

  // Sales tax complexity
  if (state.salesTax > 0.06) {
    hiddenCosts.push(`<strong>Combined sales tax burden</strong> - ${state.name}'s ${fmtPct(state.salesTax)} state rate is just the starting point. Most ${state.majorCities[0]} area businesses deal with local additions that can push the effective rate above ${fmtPct(state.salesTax + 0.02)}. If you are in food service, this directly affects your menu pricing and customer perception.`);
  }

  // State income tax on business profits
  if (state.hasStateTax && state.stateTaxRate > 0.07) {
    hiddenCosts.push(`<strong>State income tax on profits (${fmtPct(state.stateTaxRate)})</strong> - As an LLC or sole proprietor in ${state.name}, your business profits flow through to your personal return and get taxed at the state level. At ${state.name}'s top rate of ${fmtPct(state.stateTaxRate)}, a profitable year can result in a surprising tax bill. Set aside 25-35% of net profits for combined federal and state taxes.`);
  }

  // High minimum wage impact
  if (state.minWage >= 15) {
    hiddenCosts.push(`<strong>True cost of a $${state.minWage}/hour minimum wage</strong> - The wage itself is just the start. Add employer-side payroll taxes (7.65%), workers' comp insurance (varies by industry), and the fact that you often need to pay above minimum to attract reliable people. A "$${state.minWage}/hour employee" actually costs you $${(state.minWage * 1.25).toFixed(2)}-$${(state.minWage * 1.35).toFixed(2)}/hour fully loaded.`);
  }

  // Climate-specific hidden costs
  if (zone === 'hot-year-round' || stateKey === 'arizona') {
    if (isFoodBiz(bt) || isPhysicalSpaceBiz(bt)) {
      hiddenCosts.push(`<strong>Summer cooling costs</strong> - Running A/C for 6-8 months in ${state.name} adds $300-$800/month to utility bills for a small commercial space. Kitchen equipment generates additional heat that your HVAC system has to fight against. Budget 40-60% more for utilities than you would in a temperate climate.`);
    }
  } else if (zone === 'cold-winter') {
    if (isPhysicalSpaceBiz(bt)) {
      hiddenCosts.push(`<strong>Winter heating costs</strong> - Heating a commercial space through ${state.name}'s winter months adds $200-$600/month depending on your square footage and the age of the building. Older commercial spaces in ${state.majorCities[0]} with poor insulation can push that higher.`);
    }
    if (bt.includes('food truck')) {
      hiddenCosts.push(`<strong>Seasonal revenue gaps</strong> - Food truck revenue in ${state.name} typically drops 40-70% from December through February. You still have insurance, commissary fees, vehicle payments, and storage costs. Budget for 3-4 months of reduced or zero revenue.`);
    }
  }

  // Florida/coastal states - hurricane/flood insurance
  if (['florida', 'louisiana', 'texas', 'south-carolina', 'north-carolina'].includes(stateKey)) {
    hiddenCosts.push(`<strong>Hurricane and flood insurance</strong> - Standard business insurance in ${state.name} does not cover flood or hurricane damage. Separate policies add $1,000-$5,000/year depending on your location and flood zone. Many landlords require this coverage before you can sign a commercial lease.`);
  }

  // Credit card processing
  if (isFoodBiz(bt)) {
    hiddenCosts.push(`<strong>Credit card processing fees</strong> - With 80%+ of transactions now cashless, payment processing takes 2.5-3.5% off every sale. On $300,000 in annual revenue, that is $7,500-$10,500 disappearing into processing fees. This is not unique to ${state.name}, but new food business owners consistently underestimate it.`);
  }

  // Permits and inspections timeline
  if (isFoodBiz(bt) || bt.includes('gym') || bt.includes('daycare')) {
    hiddenCosts.push(`<strong>Permit wait times = dead rent</strong> - In ${state.majorCities[0]}, the time between signing your lease and getting all permits and inspections cleared can be 4-12 weeks. During that time, you are paying rent on a space you cannot operate in. Budget 1-3 months of rent as "dead rent" while you wait for ${state.name} bureaucracy.`);
  }

  // Insurance costs
  if (bt.includes('gym') || bt.includes('personal training')) {
    hiddenCosts.push(`<strong>Professional liability insurance costs more than you think</strong> - A gym or training studio in ${state.name} needs general liability, professional liability, property insurance, and possibly workers' comp even for part-time trainers. Combined premiums typically run $3,000-$8,000/year for a small facility.`);
  }

  // Bookkeeping and accounting
  hiddenCosts.push(`<strong>Bookkeeping and tax prep</strong> - You will need professional help, especially in ${state.name}${state.hasStateTax ? ' where you have both state and federal filing requirements' : ''}. Expect $150-$400/month for a bookkeeper and $500-$2,000 for annual tax preparation. Skipping this to save money is how businesses get blindsided by tax bills.`);

  // Show 5-7 hidden costs
  const selected = hiddenCosts.slice(0, 7);

  section += '<ul>\n';
  for (const cost of selected) {
    section += `<li>${cost}</li>\n`;
  }
  section += '</ul>\n';

  return section;
}

// ---------------------------------------------------------------------------
// NEW SECTION: When to Launch
// ---------------------------------------------------------------------------
function buildLaunchTimingSection(businessType, stateKey, state, override) {
  const bt = businessType.toLowerCase();
  const zone = getClimateZone(stateKey);

  let section = `\n<h2>When to Launch Your ${businessType} in ${state.name}</h2>\n`;

  // Use override if available
  if (override && override.bestTimeToLaunch) {
    section += `<p>${override.bestTimeToLaunch}</p>\n`;
    return section;
  }

  // Generate timing advice
  let timing = '';

  if (isFoodBiz(bt)) {
    if (zone === 'hot-year-round') {
      timing = `The best time to launch a ${bt} in ${state.name} is between October and February, when the weather is comfortable and residents are most active. This gives you time to work out operational kinks before the brutal summer months. Avoid launching in June through August when foot traffic drops due to heat and vacations. If you are opening near tourist areas, launching just before the winter tourist season (November-December) positions you to ride the wave of seasonal visitors.`;
    } else if (zone === 'cold-winter') {
      timing = `Aim to open your ${bt} in ${state.name} between March and May. You catch the spring energy when people are getting out more, and you have the full summer ahead of you to build a customer base before the winter slowdown. A September-October launch can also work if your concept appeals to the back-to-school and fall crowd. Whatever you do, avoid opening in December or January - low foot traffic and holiday distractions make it the worst time to try to build momentum.`;
    } else if (zone === 'warm-long-season') {
      timing = `${state.name}'s long warm season gives you flexibility on launch timing. Spring (March-April) is ideal - you get the benefit of warming weather and people looking for new dining options. Early fall (September-October) is your second-best window, as the summer heat breaks and people resume normal routines. Avoid launching during the peak of summer when established businesses already have the foot traffic locked up.`;
    } else {
      timing = `Spring and early fall are your best launch windows for a ${bt} in ${state.name}. April through May gives you the longest runway before any seasonal slowdown, while September catches the back-to-school energy. Summer can work too, particularly in ${state.majorCities[0]} where activity stays consistent. The one window to avoid is late November through January - holiday season is not when people are looking to become regulars at a new spot.`;
    }
  } else if (bt.includes('landscaping')) {
    if (zone === 'hot-year-round' || zone === 'warm-long-season') {
      timing = `Launch your ${bt} in ${state.name} between February and March. Grass starts growing, homeowners start noticing their overgrown yards, and you have the entire peak season ahead of you to build a route. Starting in summer means you are playing catch-up against operators who have been booking clients since spring. The winter months (December-January) are your time to plan, buy equipment, and build your marketing materials - not to launch.`;
    } else {
      timing = `Timing is critical for a ${state.name} ${bt}. Start your business formation and equipment purchasing in January-February, begin marketing in March, and plan to have your first paying customers by April. The April-through-October season is when you make your money, and if you also offer snow removal, November through March becomes a second revenue stream. Do not wait until May to start marketing - by then, homeowners have already committed to someone else for the season.`;
    }
  } else if (bt.includes('cleaning') || bt.includes('pressure washing')) {
    timing = `A ${bt} in ${state.name} can launch any time of year, but spring (March-April) is optimal. Homeowners are doing spring cleaning, the weather is improving for exterior work, and you have the longest runway ahead of you. January is your second-best option if you are targeting commercial clients, as many businesses sign new service contracts at the start of the fiscal year. Avoid launching in November-December when potential customers are focused on holidays, not hiring new service providers.`;
  } else if (bt.includes('gym') || bt.includes('personal training')) {
    timing = `The gym industry in ${state.name} follows a predictable pattern: January is the busiest month for new memberships and new client sign-ups, driven by New Year's resolutions. To capitalize on this, you want to be fully operational by mid-December at the latest, with a pre-sale campaign running 6-8 weeks before that. Work backwards from a January 1 opening and you should be signing your lease by August-September. The second-best launch window is right before summer (April-May), when people want to get in shape for beach season.`;
  } else if (bt.includes('dog grooming')) {
    timing = `Dog grooming demand in ${state.name} peaks in spring (shedding season) and before major holidays when owners want their pets looking good for gatherings. Launching in February-March positions you perfectly for the spring rush. Summer is steady, and there is another spike before Thanksgiving and Christmas. January tends to be the slowest month - people just spent money on holidays and are not thinking about grooming appointments.`;
  } else {
    timing = `The ideal launch window for a ${bt} in ${state.name} depends on your specific market, but spring (March-May) is generally the strongest. Consumer spending tends to pick up after the post-holiday slump, and you have the most runway ahead of you before any seasonal slowdown. If your business serves other businesses, January is also strong as companies allocate new budgets.`;
  }

  section += `<p>${timing}</p>\n`;

  return section;
}

// ---------------------------------------------------------------------------
// Business requirements section (expanded from v1)
// ---------------------------------------------------------------------------
function buildRequirementsSection(businessType, state, override) {
  const bt = businessType.toLowerCase();

  let section = `\n<h2>${state.name} Business Requirements</h2>\n`;
  section += `<p>To legally operate a ${bt} in ${state.name}, you will need to handle these items:</p>\n`;
  section += '<ul>\n';
  section += `<li><strong>Form an LLC or business entity</strong> - The filing fee in ${state.name} is ${fmt(state.llcFee)}${state.annualReportFee > 0 ? `, with a ${fmt(state.annualReportFee)} annual report fee` : ' (no annual report fee)'}.</li>\n`;
  section += `<li><strong>Obtain a business license</strong> - Requirements and fees vary by city. Contact your local ${state.majorCities[0]} or ${state.majorCities.length > 1 ? state.majorCities[1] : state.capitalCity} clerk's office for specifics.</li>\n`;

  // Use permit details from override if available
  if (override && override.permitDetails) {
    section += `<li><strong>Industry-specific permits</strong> - ${override.permitDetails}</li>\n`;
  } else if (isFoodBiz(bt)) {
    section += `<li><strong>Food service permits</strong> - ${state.name} requires a food handler's permit, health department inspection, and a food service establishment license. If you serve alcohol, add a liquor license to the list.</li>\n`;
  } else if (bt.includes('gym') || bt.includes('personal training')) {
    section += `<li><strong>Facility and trainer permits</strong> - Check ${state.name}'s requirements for fitness facility licensing, AED equipment, and any trainer certification requirements.</li>\n`;
  } else if (bt.includes('dog grooming')) {
    section += `<li><strong>Animal handling permits</strong> - Some ${state.name} cities require specific animal handling or grooming certifications. Check with your local licensing office.</li>\n`;
  }

  if (state.salesTax > 0) {
    section += `<li><strong>Register for sales tax</strong> - ${state.name}'s state sales tax rate is ${fmtPct(state.salesTax)}. Local additions can push the effective rate higher. You will need a sales tax permit if you sell taxable goods or services.</li>\n`;
  } else {
    section += `<li><strong>No state sales tax registration needed</strong> - ${state.name} does not levy a state sales tax, simplifying your compliance.</li>\n`;
  }

  if (state.hasStateTax) {
    section += `<li><strong>Plan for state income tax</strong> - ${state.name}'s top rate is ${fmtPct(state.stateTaxRate)}. Set aside a portion of profits for quarterly estimated payments.</li>\n`;
  } else {
    section += `<li><strong>No state income tax</strong> - ${state.name} does not levy a state income tax on business profits, which is a meaningful advantage for profitability.</li>\n`;
  }

  section += `<li><strong>Get business insurance</strong> - General liability insurance is essential in ${state.name}. Most landlords and clients require at least $1 million in coverage.</li>\n`;
  section += `<li><strong>Open a business bank account</strong> - Keep personal and business finances separate from day one. Most ${state.name} banks offer free or low-cost business checking.</li>\n`;
  section += '</ul>\n';

  return section;
}

// ---------------------------------------------------------------------------
// Cost diff explanation (expanded from v1)
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
    parts.push(`Labor costs run about ${Math.round((state.laborMult - 1) * 100)}% above average, driven by ${state.minWage > 12 ? `a $${state.minWage}/hour minimum wage and ` : ''}market competition for workers in ${state.majorCities[0]} and surrounding areas.`);
  } else if (state.laborMult < 0.92) {
    parts.push(`Labor costs are roughly ${Math.round((1 - state.laborMult) * 100)}% below the national average, giving you an advantage when hiring staff.${state.minWage <= 7.25 ? ' The state follows the federal minimum wage, though competitive hiring typically requires paying above that.' : ''}`);
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
// Tips section (expanded from v1)
// ---------------------------------------------------------------------------
function getStateTips(businessType, stateKey, state, override) {
  const bt = businessType.toLowerCase();
  const seed = stateKey + ':' + bt + ':tips';
  const tips = [];

  // Use override tips if available
  if (override && override.specificTips && override.specificTips.length > 0) {
    tips.push(...override.specificTips);
  }

  // Universal tips that vary by state data
  if (state.costOfLiving < 0.92) {
    tips.push(`Take advantage of ${state.name}'s below-average cost of living by keeping your personal expenses low during the startup phase. Lower personal burn rate means more runway for your business.`);
  }
  if (state.costOfLiving > 1.10) {
    tips.push(`In ${state.name}'s high-cost market, consider starting lean. Test your concept at a smaller scale before signing long-term leases or making big equipment purchases.`);
  }

  // LLC tip
  if (state.llcFee <= 50) {
    tips.push(`${state.name}'s LLC filing fee of just ${fmt(state.llcFee)} is among the cheapest in the country. Get your LLC set up before you do anything else - it protects your personal assets from day one.`);
  } else if (state.llcFee >= 300) {
    tips.push(`Budget ${fmt(state.llcFee)} for the LLC filing fee in ${state.name}, which is above the national average. If cash is extremely tight at launch, you can start as a sole proprietor and convert to an LLC once you have revenue, but understand the liability risks.`);
  }

  if (state.annualReportFee > 200) {
    tips.push(`Do not forget ${state.name}'s ${fmt(state.annualReportFee)} annual report fee for LLCs. It is an ongoing cost that catches new business owners off guard and can result in your LLC being dissolved if you miss it.`);
  }

  // Business type specific tips
  if (bt.includes('restaurant') || bt.includes('bakery') || bt.includes('coffee')) {
    if (state.rentMult > 1.1) {
      tips.push(`Commercial kitchen space in ${state.name} runs above the national average. Look for second-generation restaurant space (previously a restaurant) to save on buildout costs - the plumbing, ventilation, and grease traps may already be in place.`);
    } else {
      tips.push(`Commercial rents in ${state.name} are below the national average, which means you can get more square footage for your money. Use that to your advantage with a layout that maximizes seating and kitchen efficiency.`);
    }
    tips.push(`Negotiate your lease aggressively. In ${state.name}, many landlords will offer 2-3 months of free rent (a "build-out period") if you commit to a longer lease term. That free rent period is when you do your renovation and permitting without paying to occupy space you cannot use yet.`);
  }

  if (bt.includes('food truck')) {
    const cityNote = state.majorCities[0];
    tips.push(`Research ${cityNote}'s specific food truck permitting process early. Requirements vary dramatically between ${state.name} cities, and permit wait times can delay your launch by months.`);
    if (!state.hasStateTax) {
      tips.push(`${state.name}'s lack of state income tax makes the food truck business model more attractive since margins are already tight. Every percentage point you keep matters when you are working on 15-25% net margins.`);
    }
    tips.push(`Buy a used truck and invest the savings in a professional kitchen buildout inside it. The truck itself is just a vehicle - the cooking setup is what determines your efficiency, menu flexibility, and daily output.`);
  }

  if (bt.includes('cleaning') || bt.includes('pressure washing')) {
    tips.push(`Start by targeting ${state.majorCities[0]} and ${state.majorCities.length > 1 ? state.majorCities[1] : state.capitalCity} suburbs where homeowners have the income to hire cleaning services but are underserved compared to the city center.`);
    if (state.laborMult < 0.92) {
      tips.push(`${state.name}'s lower labor costs mean you can hire helpers sooner and scale faster than operators in high-cost states. Consider bringing on your first employee within the first 90 days if you can fill your schedule.`);
    }
    tips.push(`Get your Google Business profile set up and optimized before you do anything else. In ${state.name}'s ${bt} market, 70%+ of new customer inquiries come from Google Maps and local search results.`);
  }

  if (bt.includes('gym') || bt.includes('personal training')) {
    tips.push(`Check ${state.name}'s specific requirements for personal trainer and gym facility licensing. Some states require facility permits, AED equipment, and specific insurance minimums that vary from the national baseline.`);
    if (state.majorCities.length > 2) {
      tips.push(`Consider ${state.majorCities[2]} as an alternative to ${state.majorCities[0]}. Smaller ${state.name} cities often have less gym competition per capita with surprisingly strong demand.`);
    }
    tips.push(`Run a pre-sale campaign 6-8 weeks before opening. Offer founding member rates (20-30% below your standard pricing) to build an initial membership base. Having 50-100 paying members on day one dramatically changes your cash flow trajectory.`);
  }

  if (bt.includes('landscaping')) {
    const warmStates = ['florida', 'texas', 'georgia', 'north-carolina', 'south-carolina', 'louisiana', 'alabama', 'mississippi', 'arizona'];
    const coldStates = ['michigan', 'ohio', 'illinois', 'pennsylvania', 'new-york', 'minnesota', 'wisconsin'];
    if (warmStates.includes(stateKey)) {
      tips.push(`${state.name}'s warm climate means a longer operating season than northern states, which helps you recoup startup costs faster. But summer heat requires hydration planning and earlier start times for crews.`);
    } else if (coldStates.includes(stateKey)) {
      tips.push(`Plan for ${state.name}'s seasonal cycle. Build snow removal into your service offering to maintain revenue through winter months when landscaping work drops off.`);
    }
    tips.push(`Invest in a professional truck wrap and uniform shirts before you start knocking on doors. In ${state.name}'s competitive market, the landscapers who look professional from day one win more bids at higher rates.`);
  }

  if (bt.includes('dog grooming')) {
    tips.push(`${state.name} may require specific animal handling or grooming certifications depending on the city. Check with your local ${state.majorCities[0]} business licensing office before investing in equipment.`);
    tips.push(`Consider the mobile grooming model in ${state.name}. A converted van costs $30,000-$60,000 but eliminates your lease payment, and you can charge a 15-25% premium for the convenience of going to the client's home.`);
  }

  // Deduplicate and limit
  const seen = new Set();
  const unique = tips.filter(t => {
    const key = t.slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 6);
}

// ---------------------------------------------------------------------------
// FAQs (expanded and varied from v1)
// ---------------------------------------------------------------------------
function getStateFAQs(businessType, stateKey, state, adjustedLow, adjustedHigh, baseLow, baseHigh, override) {
  const bt = businessType.toLowerCase();
  const seed = stateKey + ':' + bt + ':faq';
  const faqs = [];
  const neighbors = STATE_NEIGHBORS[stateKey] || [];
  const neighborState = neighbors.length > 0 ? stateData[neighbors[0]] : null;
  const profile = classifyState(state);

  // FAQ 1: Cost FAQ (always present, varied wording)
  const costQVariants = [
    `How much does it cost to start a ${bt} in ${state.name}?`,
    `What is the total startup cost for a ${bt} in ${state.name}?`,
    `How much money do I need to open a ${bt} in ${state.name}?`,
  ];
  const costAVariants = [
    `Starting a ${bt} in ${state.name} typically costs between ${fmtRange(adjustedLow, adjustedHigh)}, depending on your location within the state, your business model, and how lean you launch. Costs in ${state.majorCities[0]} tend to run higher than in smaller ${state.name} cities like ${state.majorCities[state.majorCities.length - 1]}.`,
    `Plan on ${fmtRange(adjustedLow, adjustedHigh)} to get a ${bt} up and running in ${state.name}. The low end assumes a lean, no-frills launch, while the high end reflects a fully equipped operation in a prime ${state.majorCities[0]} location. Most operators land somewhere in the middle.`,
    `Expect to invest ${fmtRange(adjustedLow, adjustedHigh)} for a ${bt} in ${state.name}. That includes everything from business formation and permits to equipment, initial inventory, and enough working capital to survive the first few months before revenue stabilizes.`,
  ];
  faqs.push({
    q: pick(costQVariants, seed + 'q1'),
    a: pick(costAVariants, seed + 'a1'),
  });

  // FAQ 2: License/permit FAQ
  let permitAnswer = `Yes. At minimum, you need a ${state.name} business license and any industry-specific permits required by your city or county. LLC formation costs ${fmt(state.llcFee)} in ${state.name}${state.annualReportFee > 0 ? `, plus a ${fmt(state.annualReportFee)} annual report fee` : ''}. Contact your local ${state.majorCities[0]} clerk's office for the full list.`;
  if (override && override.permitDetails) {
    permitAnswer += ` Specifically for a ${bt}: ${override.permitDetails}`;
  }
  faqs.push({
    q: `Do I need a special license to operate a ${bt} in ${state.name}?`,
    a: permitAnswer,
  });

  // FAQ 3: Tax FAQ
  if (state.hasStateTax) {
    faqs.push({
      q: `How does ${state.name}'s state income tax affect my ${bt}?`,
      a: `${state.name}'s top state income tax rate is ${fmtPct(state.stateTaxRate)}. As a ${bt} owner operating as an LLC or sole proprietorship, your business profits pass through to your personal return and are taxed at this rate. Combined with federal income tax and self-employment tax, you should plan to set aside 25-35% of net profits for taxes. Work with a ${state.name}-based CPA to optimize your deductions and quarterly estimated payments.`,
    });
  } else {
    faqs.push({
      q: `Does ${state.name} have a state income tax on business profits?`,
      a: `No. ${state.name} has no state income tax, which is a significant advantage for ${bt} owners. Your business profits are only subject to federal income tax and self-employment tax. Compared to high-tax states where you might lose 5-10% of profits to state taxes, this advantage compounds meaningfully over time.${state.salesTax > 0.06 ? ` However, be aware that ${state.name}'s sales tax rate of ${fmtPct(state.salesTax)} is relatively high, which can impact pricing for customer-facing businesses.` : ''}`,
    });
  }

  // FAQ 4: Market-specific FAQ (city-level)
  const topCity = state.majorCities[0];
  faqs.push({
    q: `Is ${topCity} a good city to start a ${bt}?`,
    a: `${topCity} is ${state.name}'s largest market for a ${bt}, offering the biggest customer base but also the highest operating costs and most competition. ${profile.costLevel === 'high' ? `Expect to pay a premium for commercial space in ${topCity}, but the higher foot traffic and consumer density can justify the cost if your concept is strong.` : `${topCity}'s relatively affordable operating costs give you room to compete on both price and quality.`} If ${topCity} feels too competitive or expensive, consider ${state.majorCities.length > 2 ? state.majorCities[2] : state.majorCities[state.majorCities.length - 1]} as an alternative with lower overhead and less saturation.`,
  });

  // FAQ 5: Profitability/timeline FAQ
  const breakEvenMonths = adjustedHigh > 100000 ? '12-24' :
    adjustedHigh > 50000 ? '8-18' :
    adjustedHigh > 20000 ? '6-12' : '3-6';
  faqs.push({
    q: `How long does it take for a ${bt} in ${state.name} to become profitable?`,
    a: `Most ${bt} owners in ${state.name} report reaching profitability within ${breakEvenMonths} months, though this varies widely based on startup costs, pricing, and how quickly you build a customer base. ${profile.costLevel === 'low' ? `${state.name}'s lower overhead helps you reach breakeven faster than operators in high-cost states.` : `${state.name}'s higher operating costs mean you need more revenue to cover overhead, but the larger consumer market supports that growth.`} The biggest factor is not the state - it is whether you have a marketing plan that consistently brings in new customers from week one.`,
  });

  // FAQ 6: Comparison FAQ (neighboring state)
  if (neighborState && neighbors[0]) {
    const neighborLow = adjustCost(baseLow, neighborState);
    const neighborHigh = adjustCost(baseHigh, neighborState);
    const cheaper = (adjustedLow + adjustedHigh) < (neighborLow + neighborHigh) ? state.name : neighborState.name;
    const diff = Math.abs(Math.round((((adjustedLow + adjustedHigh) / (neighborLow + neighborHigh)) - 1) * 100));

    faqs.push({
      q: `How do ${bt} startup costs in ${state.name} compare to ${neighborState.name}?`,
      a: `${state.name} ${bt} startup costs (${fmtRange(adjustedLow, adjustedHigh)}) are ${diff > 3 ? `about ${diff}% ${cheaper === state.name ? 'lower' : 'higher'} than ${neighborState.name} (${fmtRange(neighborLow, neighborHigh)})` : `roughly comparable to ${neighborState.name} (${fmtRange(neighborLow, neighborHigh)})`}. ${cheaper === state.name ? `${state.name}'s lower ${state.rentMult < neighborState.rentMult ? 'commercial rents' : 'overall cost of living'} is the primary driver of the difference.` : `${neighborState.name}'s ${neighborState.rentMult < state.rentMult ? 'lower commercial rents' : 'more affordable cost of living'} gives it the edge on startup costs.`}${!state.hasStateTax && neighborState.hasStateTax ? ` ${state.name}'s lack of state income tax is an additional long-term advantage.` : ''}`,
    });
  }

  // FAQ 7: Hidden cost FAQ
  faqs.push({
    q: `What hidden costs do ${bt} owners in ${state.name} miss?`,
    a: `The most commonly overlooked costs for ${bt} owners in ${state.name} include: ${state.annualReportFee > 0 ? `the ${fmt(state.annualReportFee)} annual LLC report fee, ` : ''}quarterly estimated tax payments (federal${state.hasStateTax ? ` and ${state.name} state` : ''}), insurance premiums that increase after your first year, and the gap between signing a lease and actually opening for business (you are paying rent during buildout and permitting). ${isFoodBiz(bt) ? 'Credit card processing fees (2.5-3.5% of every transaction) and food waste during the learning curve are also significant.' : isServiceBiz(bt) ? 'Vehicle wear and tear, fuel costs, and the marketing spend needed to maintain a steady flow of new clients add up quickly.' : 'Equipment maintenance, software subscriptions, and the marketing spend needed to maintain steady growth are easy to underestimate.'}`,
  });

  // FAQ 8: "Is it worth it" FAQ
  const worthItAnswer = profile.costLevel === 'high'
    ? `${state.name} is a challenging but rewarding state for a ${bt}. Higher costs mean higher barriers to entry, which actually reduces competition from undercapitalized operators. The consumer base in ${state.majorCities[0]} has higher incomes and is willing to pay premium prices. If you can clear the initial cost hurdle and operate efficiently, ${state.name}'s market can support a very profitable ${bt}.`
    : profile.costLevel === 'low'
    ? `${state.name} is one of the better states for launching a ${bt} on a budget. Low startup costs mean less financial risk, and you can reach profitability faster than operators in expensive coastal markets. The trade-off is typically a smaller consumer market, so growth may take longer. But for a first-time business owner, ${state.name}'s affordability gives you more room for mistakes without catastrophic financial consequences.`
    : `${state.name} offers a balanced environment for a ${bt}. Costs are manageable without being the absolute cheapest, and the consumer market in ${state.majorCities[0]} is large enough to support growth. The state is neither the easiest nor the hardest place to launch - it comes down to your specific concept, location within ${state.name}, and execution.`;

  faqs.push({
    q: `Is ${state.name} a good state to start a ${bt}?`,
    a: worthItAnswer,
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
// Build cross-links (new approach: neighbors + related businesses)
// ---------------------------------------------------------------------------
function buildCrossLinks(baseSlug, currentStateKey, businessType) {
  const bt = businessType.toLowerCase();
  const btSlug = bt.replace(/\s+/g, '-');
  const neighbors = STATE_NEIGHBORS[currentStateKey] || [];

  let links = '';

  // Neighboring state links (4-6 states)
  const neighborLinks = [];
  for (const nk of neighbors.slice(0, 6)) {
    const ns = stateData[nk];
    if (!ns) continue;
    const slug = `${baseSlug}-in-${nk}`;
    neighborLinks.push(`<a href="/${slug}">${ns.name}</a>`);
  }
  if (neighborLinks.length > 0) {
    links += `<p><strong>Compare ${bt} costs in nearby states:</strong> ${neighborLinks.join(' | ')}</p>\n`;
  }

  // Related business type links in same state
  const relatedSlugs = RELATED_BUSINESSES[btSlug] || [];
  const relatedLinks = [];
  for (const rs of relatedSlugs) {
    const relGuide = guidesIndex.find(g => g.slug === `cost-to-start-a-${rs}`);
    if (!relGuide) continue;
    const relSlug = `cost-to-start-a-${rs}-in-${currentStateKey}`;
    relatedLinks.push(`<a href="/${relSlug}">${relGuide.businessType} in ${stateData[currentStateKey].name}</a>`);
  }
  if (relatedLinks.length > 0) {
    links += `<p><strong>Related guides:</strong> ${relatedLinks.join(' | ')}</p>\n`;
  }

  // Link to national guide
  links += `<p>See our full national <a href="/${baseSlug}">${businessType} cost guide</a> for detailed breakdowns, hidden costs, and money-saving strategies that apply everywhere.</p>\n`;

  return links;
}

// ---------------------------------------------------------------------------
// Main generation loop
// ---------------------------------------------------------------------------
let generated = 0;
// We need stateKey in scope for the buildCostTable table note picker
let stateKey;

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
  const slugBase = baseSlug;

  for (const sk of TARGET_STATES) {
    stateKey = sk;
    const state = stateData[sk];
    if (!state) {
      console.warn(`  Warning: state data not found for ${sk}`);
      continue;
    }

    const adjustedLow = adjustCost(baseLow, state);
    const adjustedHigh = adjustCost(baseHigh, state);
    const stateSlug = `${slugBase}-in-${sk}`;
    const override = getOverride(sk, businessType);

    const title = `How Much Does It Cost to Start a ${businessType} in ${state.name}?`;
    const focusKeyword = `cost to start a ${businessType.toLowerCase()} in ${state.name.toLowerCase()}`;

    // Build content sections
    const opening = buildOpening(businessType, sk, state, adjustedLow, adjustedHigh, baseLow, baseHigh, override);
    const costTable = buildCostTable(businessType, state, adjustedLow, adjustedHigh);
    const costDiff = getCostDiffExplanation(state);
    const marketReality = buildMarketRealitySection(businessType, sk, state, override);
    const cityComparison = buildCityComparisonSection(businessType, sk, state, adjustedLow, adjustedHigh, override);
    const hiddenCosts = buildHiddenCostsSection(businessType, sk, state, override);
    const launchTiming = buildLaunchTimingSection(businessType, sk, state, override);
    const requirements = buildRequirementsSection(businessType, state, override);
    const tips = getStateTips(businessType, sk, state, override);
    const faqs = getStateFAQs(businessType, sk, state, adjustedLow, adjustedHigh, baseLow, baseHigh, override);
    const crossLinks = buildCrossLinks(slugBase, sk, businessType);

    // Assemble full content
    let content = opening;

    content += `\n\n<h2>${state.name} ${businessType} Cost Breakdown</h2>\n`;
    content += costTable;

    content += `\n\n<h2>Why ${state.name} Costs Differ from the National Average</h2>\n`;
    content += `<p>${costDiff}</p>\n`;

    content += marketReality;

    content += cityComparison;

    content += requirements;

    content += hiddenCosts;

    content += launchTiming;

    content += `\n<h2>Tips for Launching a ${businessType} in ${state.name}</h2>\n`;
    content += '<ul>\n';
    for (const tip of tips) {
      content += `<li>${tip}</li>\n`;
    }
    content += '</ul>\n';

    content += '\n<h2>Frequently Asked Questions</h2>\n';
    for (const faq of faqs) {
      content += `<h3>${faq.q}</h3>\n<p>${faq.a}</p>\n`;
    }

    content += '\n<hr>\n';
    content += crossLinks;

    // Build meta description (varied)
    const metaDescs = [
      `How much does it cost to start a ${businessType.toLowerCase()} in ${state.name}? Expect ${fmtRange(adjustedLow, adjustedHigh)}. ${state.name}-specific costs, licensing, permits, and hidden costs most owners miss.`,
      `Starting a ${businessType.toLowerCase()} in ${state.name} costs ${fmtRange(adjustedLow, adjustedHigh)}. Full ${state.name} cost breakdown with city comparisons, permits, and tips from local operators.`,
      `${state.name} ${businessType.toLowerCase()} startup costs: ${fmtRange(adjustedLow, adjustedHigh)}. Complete guide to ${state.name} licensing, hidden costs, best cities, and when to launch.`,
    ];
    const metaDescription = pick(metaDescs, sk + ':' + businessType + ':meta');

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
