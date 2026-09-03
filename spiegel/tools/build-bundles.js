#!/usr/bin/env node
// build-bundles.js — erzeugt data/bundles.json (Bundle-ID → App-Name).
//
// Läuft auf deinem Rechner, nie im Browser des Nutzers: der Viewer selbst
// fragt nichts nach (Prinzip 2). Das Ergebnis wird committet.
//
//   node tools/build-bundles.js            # schreibt data/bundles.json
//   node tools/build-bundles.js --dry-run  # nur zählen, nichts schreiben
//
// Quelle sind die App-Store-Topcharts pro Kategorie in mehreren Ländern. Der
// Legacy-RSS-Feed liefert die Bundle-ID gleich mit; fehlt sie, wird über
// itunes.apple.com/lookup nachgeschlagen. Vorhandene Einträge in
// data/bundles.json bleiben erhalten - Handgepflegtes gewinnt.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'data', 'bundles.json');

const COUNTRIES = ['de', 'us'];
const CHARTS = ['topfreeapplications', 'toppaidapplications'];
const PER_CHART = 100;
const TARGET = 1000;
const PAUSE_MS = 250;

// App-Store-Genres. Die Liste deckt das ab, was in einem typischen Bericht auftaucht.
const GENRES = {
  6002: 'Wetter', 6005: 'Soziale Netze', 6007: 'Produktivität', 6008: 'Foto & Video',
  6009: 'Nachrichten', 6010: 'Navigation', 6011: 'Musik', 6012: 'Lifestyle',
  6013: 'Gesundheit', 6014: 'Spiele', 6015: 'Finanzen', 6016: 'Reisen',
  6017: 'Bildung', 6018: 'Bücher', 6020: 'Medizin', 6021: 'Nachschlagewerke',
  6023: 'Essen & Trinken', 6024: 'Shopping', 6000: 'Wirtschaft', 6001: 'Wetter/Utilities',
};

const dryRun = process.argv.includes('--dry-run');

const seen = new Map();   // bundleID -> { name, hits }
const needLookup = new Map(); // numerische Track-ID -> Name

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'spiegel-build-bundles' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function remember(bundleID, name) {
  if (!bundleID || !name) return;
  const entry = seen.get(bundleID);
  if (entry) entry.hits++;
  else seen.set(bundleID, { name, hits: 1 });
}

async function collectChart(country, chart, genre) {
  const url = `https://itunes.apple.com/${country}/rss/${chart}/limit=${PER_CHART}/genre=${genre}/json`;
  const data = await getJson(url);
  const entries = data?.feed?.entry;
  if (!Array.isArray(entries)) return 0;

  for (const e of entries) {
    const name = e?.['im:name']?.label;
    const attrs = e?.id?.attributes || {};
    const bundleID = attrs['im:bundleId'];
    if (bundleID) remember(bundleID, name);
    else if (attrs['im:id']) needLookup.set(attrs['im:id'], name);
  }
  return entries.length;
}

/** Bis zu 200 IDs pro Anfrage - so bleibt es bei einer Handvoll Requests. */
async function resolveMissing() {
  const ids = [...needLookup.keys()];
  for (let i = 0; i < ids.length; i += 200) {
    const batch = ids.slice(i, i + 200);
    const url = `https://itunes.apple.com/lookup?id=${batch.join(',')}&entity=software`;
    try {
      const data = await getJson(url);
      for (const r of data?.results || []) remember(r.bundleId, r.trackName);
    } catch (err) {
      console.error(`  Lookup fehlgeschlagen: ${err.message}`);
    }
    await sleep(PAUSE_MS);
  }
}

async function main() {
  let existing = {};
  try {
    existing = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    console.error('Keine vorhandene data/bundles.json - fange bei null an.');
  }

  for (const country of COUNTRIES) {
    for (const chart of CHARTS) {
      for (const genre of Object.keys(GENRES)) {
        try {
          const n = await collectChart(country, chart, genre);
          console.error(`${country}/${chart}/${GENRES[genre]}: ${n}`);
        } catch (err) {
          console.error(`${country}/${chart}/${GENRES[genre]}: ${err.message}`);
        }
        await sleep(PAUSE_MS);
      }
    }
  }

  if (needLookup.size) {
    console.error(`${needLookup.size} Einträge ohne Bundle-ID, schlage nach ...`);
    await resolveMissing();
  }

  // Häufigste zuerst: was in mehreren Ländern und Charts auftaucht, ist am
  // ehesten das, was auch in einem echten Bericht steht.
  const ranked = [...seen.entries()]
    .sort((a, b) => b[1].hits - a[1].hits || a[0].localeCompare(b[0]))
    .slice(0, TARGET);

  const merged = { ...Object.fromEntries(ranked.map(([id, v]) => [id, v.name])), ...existing };
  const sorted = Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]));

  console.error(
    `${seen.size} gefunden, ${ranked.length} übernommen, ` +
    `${Object.keys(existing).length} bestehende behalten, ${Object.keys(sorted).length} gesamt.`,
  );

  if (dryRun) return;
  await writeFile(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
  console.error(`geschrieben: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
