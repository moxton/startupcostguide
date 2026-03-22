#!/usr/bin/env node
/**
 * tighten-prose.mjs
 * Removes filler words, hedge phrases, and weak constructions from
 * the `content` HTML of the 108 base guide JSON files.
 *
 * Usage:  node scripts/tighten-prose.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const GUIDES_DIR = join(import.meta.dirname, '..', 'src', 'data', 'guides');

// ── helpers ──────────────────────────────────────────────────────────
/** Escape a literal string for use inside a RegExp */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build a case-insensitive regex from a literal phrase.
 * If `sentenceStart` is true the match must follow a sentence boundary
 * (start-of-string, after ". ", or right after <p>/<li>/<h\d> open tags).
 */
function phraseRe(phrase, { sentenceStart = false } = {}) {
  const pat = esc(phrase);
  if (sentenceStart) {
    // lookbehind: start of string | after ". " | after opening tag
    return new RegExp(`(?<=^|(?:\\. )|(?:<p>)|(?:<li>)|(?:<h[2-6]>))${pat}`, 'gi');
  }
  return new RegExp(pat, 'gi');
}

// ── replacement tables ───────────────────────────────────────────────
// Each entry: [regex, replacement string]
const REPLACEMENTS = [
  // ─── filler / hedge phrases (delete or shorten) ───
  [phraseRe("it's worth noting that "),           ''],
  [phraseRe("it's important to note that "),      ''],
  [phraseRe("it's worth mentioning that "),       ''],
  [phraseRe("keep in mind that ", { sentenceStart: true }), ''],
  [phraseRe("as a general rule, "),               ''],
  [phraseRe("in most cases, "),                   ''],
  [phraseRe("for the most part, "),               ''],
  [phraseRe("at the end of the day, "),           ''],
  [phraseRe("when all is said and done, "),       ''],
  [phraseRe("the reality is that "),              ''],
  [phraseRe("the truth is that "),                ''],
  [phraseRe("the fact of the matter is "),        ''],
  [phraseRe("it should be noted that "),          ''],
  [phraseRe("it goes without saying that "),      ''],
  [phraseRe("needless to say, "),                 ''],
  [phraseRe("as you may know, "),                 ''],
  [phraseRe("as we mentioned earlier, "),         ''],
  [phraseRe("as previously mentioned, "),         ''],
  [phraseRe("generally speaking, "),              ''],
  [phraseRe("broadly speaking, "),                ''],
  [phraseRe("in order to "),                      'to '],
  [phraseRe("due to the fact that "),             'because '],
  [phraseRe("in the event that "),                'if '],
  [phraseRe("at this point in time"),             'now'],
  [phraseRe("a large number of"),                 'many'],
  [phraseRe("a significant amount of"),           'much'],
  [phraseRe("in the near future"),                'soon'],
  [phraseRe("on a daily basis"),                  'daily'],
  [phraseRe("on a regular basis"),                'regularly'],
  [phraseRe("in terms of "),                      ''],
  [phraseRe("with regard to "),                   'about '],
  [phraseRe("with respect to "),                  'about '],
  [phraseRe("is able to "),                       'can '],
  [phraseRe("are able to "),                      'can '],
  [phraseRe("was able to "),                      'could '],
  [phraseRe("has the ability to "),               'can '],
  [phraseRe("have the ability to "),              'can '],
  [phraseRe("there is a possibility that "),      'possibly '],
  [phraseRe("it is possible that "),              'possibly '],
  [phraseRe("in spite of the fact that "),        'despite '],
  [phraseRe("regardless of the fact that "),      'even though '],

  // ─── weak constructions ───
  [phraseRe("you're going to want to "),          'you should '],
  [phraseRe("you're going to need to "),          "you'll need to "],
  [phraseRe("you will want to "),                 'you should '],
  [phraseRe("you will need to "),                 'you need to '],
  [phraseRe("you are going to "),                 "you'll "],
  [phraseRe("you might want to consider "),       'consider '],
  [phraseRe("you may want to consider "),         'consider '],
  // "you should consider " only when followed by a gerund (-ing word)
  [/you should consider (?=[a-z]+ing\b)/gi,       'consider '],
  [phraseRe("make sure that you "),               'make sure you '],
  [phraseRe("make sure to "),                     ''],
  [phraseRe("be sure to "),                       ''],
  [phraseRe("don't forget to "),                  ''],
  [phraseRe("remember to ", { sentenceStart: true }), ''],
  [phraseRe("it is important to "),               ''],
  [phraseRe("it is essential to "),               ''],
  [phraseRe("it is crucial to "),                 ''],
  [phraseRe("it is necessary to "),               ''],
  [phraseRe("it is recommended that you "),       ''],
  [phraseRe("we recommend that you "),            ''],
  [phraseRe("we suggest that you "),              ''],
  // "you can also " at sentence start → "also "
  [/(?<=^|(?:\. )|(?:<p>)|(?:<li>)|(?:<h[2-6]>))you can also /gi, 'also '],
  [phraseRe("there are a number of "),            'several '],
  // "there are many " at sentence start → "many "
  [/(?<=^|(?:\. )|(?:<p>)|(?:<li>)|(?:<h[2-6]>))there are many /gi, 'many '],
  // "this is because " at sentence start → "because "
  [/(?<=^|(?:\. )|(?:<p>)|(?:<li>)|(?:<h[2-6]>))this is because /gi, 'because '],
];

// ── protected-zone logic ─────────────────────────────────────────────
/**
 * Replace only in "safe" text zones of the HTML content string.
 * Protected zones: <table>…</table>, <a …>…</a>, and the faqSchema field
 * (which lives outside `content`, so we don't touch it anyway).
 *
 * Strategy: split content into segments that are either protected or editable,
 * apply replacements only to editable segments, then rejoin.
 */
function splitProtected(html) {
  // Match <table>…</table> (greedy-ish, tables don't nest),
  // and <a …>…</a> (shortest match).
  const protectedRe = /<table[\s\S]*?<\/table>|<a\s[^>]*>[\s\S]*?<\/a>/gi;
  const segments = [];
  let last = 0;
  let m;
  while ((m = protectedRe.exec(html)) !== null) {
    if (m.index > last) {
      segments.push({ text: html.slice(last, m.index), editable: true });
    }
    segments.push({ text: m[0], editable: false });
    last = m.index + m[0].length;
  }
  if (last < html.length) {
    segments.push({ text: html.slice(last), editable: true });
  }
  return segments;
}

// ── capitalisation fix ───────────────────────────────────────────────
/**
 * After a deletion the next character may need capitalising if it is
 * now at the start of a sentence (after ". " or after <p>/<li>/<h\d>).
 */
function fixCapitalisation(text) {
  // After ". " or opening block tags, ensure next letter is uppercase
  return text.replace(
    /(\. |<p>|<li>|<h[2-6]>)([a-z])/g,
    (_, pre, ch) => pre + ch.toUpperCase()
  );
}

// ── main ─────────────────────────────────────────────────────────────
const files = readdirSync(GUIDES_DIR).filter((f) => {
  if (!f.endsWith('.json')) return false;
  const slug = f.replace('.json', '');
  // Exclude state pages (contain "-in-") and comparison pages (contain "-vs-")
  if (/-in-/.test(slug) || /-vs-/.test(slug)) return false;
  return true;
});

console.log(`Found ${files.length} base guides.\n`);

let totalReplacements = 0;
let guidesModified = 0;

for (const file of files) {
  const filePath = join(GUIDES_DIR, file);
  const raw = readFileSync(filePath, 'utf-8');
  const guide = JSON.parse(raw);

  if (!guide.content) continue;

  const segments = splitProtected(guide.content);
  let guideCount = 0;

  for (const seg of segments) {
    if (!seg.editable) continue;
    let text = seg.text;
    for (const [re, replacement] of REPLACEMENTS) {
      // Reset regex lastIndex for each segment
      re.lastIndex = 0;
      const before = text;
      text = text.replace(re, replacement);
      if (text !== before) {
        // Count how many replacements were made
        // (compare lengths — quick proxy; for exact count re-run with matchAll)
        re.lastIndex = 0;
        const matches = before.match(re);
        const count = matches ? matches.length : 0;
        // But that re-matches the original, not the diff. Simpler: use matchAll on before.
        guideCount += count;
      }
    }
    text = fixCapitalisation(text);
    seg.text = text;
  }

  if (guideCount > 0) {
    const newContent = segments.map((s) => s.text).join('');
    guide.content = newContent;
    writeFileSync(filePath, JSON.stringify(guide), 'utf-8');
    console.log(`  ${file}: ${guideCount} replacements`);
    totalReplacements += guideCount;
    guidesModified++;
  }
}

console.log(`\n✓ Done. ${totalReplacements} total replacements across ${guidesModified} guides.`);
