#!/usr/bin/env node
// make-demo.js — erzeugt examples/demo.ndjson.
//
// Läuft auf deinem Rechner, nie im Browser des Nutzers. Die Datei ist
// vollständig erfunden: erfundene Bundle-IDs (Präfix `demo.`), echte
// Trackerdomains, damit die Zuordnung sichtbar wird. Sie enthält absichtlich
// auch kaputte Zeilen, einen tcc-Eintrag, ein Intervall ohne Ende und ein Ende
// ohne Anfang — der Parser soll daran gemessen werden.
//
//   node tools/make-demo.js > examples/demo.ndjson

const TZ = '+02:00';
const TZ_OFFSET_MS = 2 * 3600000;
const DAY_MS = 86400000;
const DAYS = 7;
// Fester Endzeitpunkt, damit die Datei reproduzierbar ist.
const END = Date.UTC(2026, 4, 1, 0, 0, 0) - TZ_OFFSET_MS; // 01.05.2026, 00:00 Ortszeit
const START = END - DAYS * DAY_MS;

let seed = 20260501;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => a + rnd() * (b - a);

function iso(ms) {
  const d = new Date(ms + TZ_OFFSET_MS);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}.${p(d.getUTCMilliseconds(), 3)}${TZ}`
  );
}

let uuidCounter = 0;
function uuid() {
  const hex = (n, len) => n.toString(16).toUpperCase().padStart(len, '0');
  uuidCounter++;
  const tail = `${hex(Math.floor(rnd() * 0xffffff), 6)}${hex(Math.floor(rnd() * 0xffffff), 6)}`;
  return `${hex(uuidCounter, 8)}-D536-4B16-94D6-${tail}`;
}

/** hour: [von, bis] in Ortszeit; night: Anteil der Zugriffe zwischen 0 und 6 Uhr. */
const APPS = [
  {
    id: 'demo.wetter.heute',
    sensors: [{ category: 'location', perDay: 9, seconds: [4, 40], night: 0.25 }],
    domains: [
      ['wetter-heute.example', 'AppInitiated', 210],
      ['doubleclick.net', 'AppInitiated', 486],
      ['app-measurement.com', 'AppInitiated', 312],
      ['appsflyer.com', 'AppInitiated', 197],
      ['adsrvr.org', 'AppInitiated', 154],
      ['criteo.com', 'AppInitiated', 88],
      ['pubmatic.com', 'AppInitiated', 71],
      ['graph.facebook.com', 'AppInitiated', 63],
    ],
  },
  {
    id: 'demo.puzzle.blocks',
    sensors: [],
    domains: [
      ['puzzle-blocks.example', 'UserInitiated', 96],
      ['unity3d.com', 'AppInitiated', 402],
      ['applovin.com', 'AppInitiated', 355],
      ['ironsrc.com', 'AppInitiated', 288],
      ['vungle.com', 'AppInitiated', 174],
      ['chartboost.com', 'AppInitiated', 121],
      ['app-measurement.com', 'AppInitiated', 96],
    ],
  },
  {
    id: 'demo.social.pinboard',
    sensors: [
      { category: 'camera', perDay: 2, seconds: [5, 90], night: 0.05 },
      { category: 'photos', perDay: 4, seconds: [2, 20], night: 0.05 },
      { category: 'contacts', perDay: 0.6, seconds: [1, 4], night: 0 },
      { category: 'microphone', perDay: 0.8, seconds: [3, 45], night: 0.1 },
    ],
    domains: [
      ['pinboard-social.example', 'UserInitiated', 640],
      ['graph.facebook.com', 'AppInitiated', 233],
      ['branch.io', 'AppInitiated', 118],
      ['amplitude.com', 'AppInitiated', 96],
      ['sentry.io', 'AppInitiated', 44],
      ['cdn.pinboard-social.example', 'UserInitiated', 512],
    ],
  },
  {
    id: 'demo.news.daily',
    sensors: [{ category: 'location', perDay: 1.4, seconds: [2, 12], night: 0.1 }],
    domains: [
      ['tagesnachrichten.example', 'UserInitiated', 280],
      ['scorecardresearch.com', 'AppInitiated', 166],
      ['taboola.com', 'AppInitiated', 143],
      ['outbrain.com', 'AppInitiated', 91],
      ['google-analytics.com', 'AppInitiated', 88],
      ['adnxs.com', 'AppInitiated', 77],
    ],
  },
  {
    id: 'demo.shopping.deals',
    sensors: [{ category: 'location', perDay: 2.2, seconds: [2, 15], night: 0.05 }],
    domains: [
      ['schnaeppchen.example', 'UserInitiated', 190],
      ['criteo.com', 'AppInitiated', 204],
      ['amazon-adsystem.com', 'AppInitiated', 133],
      ['adjust.com', 'AppInitiated', 87],
      ['braze.com', 'AppInitiated', 52],
    ],
  },
  {
    id: 'demo.fitness.tracker',
    sensors: [
      { category: 'location', perDay: 3.5, seconds: [120, 3200], night: 0.02 },
      { category: 'mediaLibrary', perDay: 0.7, seconds: [30, 400], night: 0 },
    ],
    domains: [
      ['schrittzaehler.example', 'AppInitiated', 168],
      ['app-measurement.com', 'AppInitiated', 74],
      ['sentry.io', 'AppInitiated', 21],
    ],
  },
  {
    id: 'demo.taxi.ride',
    sensors: [{ category: 'location', perDay: 2.0, seconds: [200, 1800], night: 0.3 }],
    domains: [
      ['stadtfahrt.example', 'UserInitiated', 122],
      ['branch.io', 'AppInitiated', 64],
      ['adjust.com', 'AppInitiated', 41],
      ['maps.stadtfahrt.example', 'UserInitiated', 96],
    ],
  },
  {
    id: 'demo.scanner.docs',
    sensors: [
      { category: 'camera', perDay: 1.1, seconds: [4, 60], night: 0 },
      { category: 'photos', perDay: 1.4, seconds: [1, 10], night: 0 },
    ],
    domains: [
      ['dokumentenscanner.example', 'UserInitiated', 44],
      ['bugsnag.com', 'AppInitiated', 18],
    ],
  },
  {
    id: 'demo.radio.stream',
    sensors: [{ category: 'mediaLibrary', perDay: 2.4, seconds: [300, 5400], night: 0.15 }],
    domains: [
      ['radio-stream.example', 'UserInitiated', 302],
      ['adswizz.example', 'AppInitiated', 58],
      ['google-analytics.com', 'AppInitiated', 63],
    ],
  },
  {
    id: 'demo.recipes.kitchen',
    sensors: [{ category: 'photos', perDay: 1.0, seconds: [2, 14], night: 0 }],
    domains: [
      ['rezeptbuch.example', 'UserInitiated', 76],
      ['doubleclick.net', 'AppInitiated', 59],
    ],
  },
  {
    id: 'demo.kids.paint',
    sensors: [{ category: 'photos', perDay: 0.8, seconds: [1, 8], night: 0 }],
    domains: [['malbuch.example', 'UserInitiated', 12]],
  },
  {
    id: 'demo.notes.simple',
    sensors: [],
    domains: [['notizblock.example', 'UserInitiated', 31]],
  },
];

const lines = [];

function access(bundleID, category, startMs, durationMs) {
  const id = uuid();
  lines.push({
    t: startMs,
    obj: {
      type: 'access',
      accessor: { identifier: bundleID, identifierType: 'bundleID' },
      category,
      identifier: id,
      kind: 'intervalBegin',
      timeStamp: iso(startMs),
    },
  });
  lines.push({
    t: startMs + durationMs,
    obj: {
      type: 'access',
      accessor: { identifier: bundleID, identifierType: 'bundleID' },
      category,
      identifier: id,
      kind: 'intervalEnd',
      timeStamp: iso(startMs + durationMs),
    },
  });
}

/** Ortszeit-Stunde eines Zeitpunkts. */
function localHour(ms) {
  return new Date(ms + TZ_OFFSET_MS).getUTCHours();
}

for (const app of APPS) {
  for (const s of app.sensors) {
    for (let day = 0; day < DAYS; day++) {
      const dayStart = START + day * DAY_MS;
      const n = Math.round(between(s.perDay * 0.5, s.perDay * 1.5));
      for (let i = 0; i < n; i++) {
        const night = rnd() < s.night;
        const hour = night ? between(0, 6) : between(7, 23.5);
        const startMs = dayStart + hour * 3600000;
        if (startMs >= END) continue;
        const duration = between(s.seconds[0], s.seconds[1]) * 1000;
        access(app.id, s.category, startMs, Math.min(duration, END - startMs));
      }
    }
  }

  for (const [domain, initiatedType, hits] of app.domains) {
    const first = between(START, START + 2 * DAY_MS);
    const last = between(END - 2 * DAY_MS, END);
    lines.push({
      t: last,
      obj: {
        type: 'networkActivity',
        bundleID: app.id,
        domain,
        domainOwner: '',
        initiatedType,
        hits,
        firstTimeStamp: iso(first),
        lastTimeStamp: iso(last),
      },
    });
  }
}

lines.sort((a, b) => a.t - b.t);
const out = lines.map((l) => JSON.stringify(l.obj));

// Ein Ende ohne Anfang ganz vorne: so sieht ein am Anfang abgeschnittener
// Bericht aus.
out.unshift(
  JSON.stringify({
    type: 'access',
    accessor: { identifier: 'demo.radio.stream', identifierType: 'bundleID' },
    category: 'mediaLibrary',
    identifier: uuid(),
    kind: 'intervalEnd',
    timeStamp: iso(START + 900000),
  }),
);

// Zeilen, die v0 bewusst ignoriert.
out.splice(4, 0, JSON.stringify({
  stream: 'com.apple.privacy.accounting.stream.tcc',
  tccService: 'kTCCServiceAddressBook',
  timeStamp: iso(START + 3600000),
}));
out.splice(40, 0, JSON.stringify({
  stream: 'com.apple.privacy.accounting.stream.tcc',
  tccService: 'kTCCServicePhotos',
  timeStamp: iso(START + 2 * 3600000),
}));

// Ein Intervall ohne Ende am Schluss: der Bericht ist beim Export abgeschnitten.
out.push(
  JSON.stringify({
    type: 'access',
    accessor: { identifier: 'demo.taxi.ride', identifierType: 'bundleID' },
    category: 'location',
    identifier: uuid(),
    kind: 'intervalBegin',
    timeStamp: iso(END - 240000),
  }),
);
// ... und eine halbe Zeile dahinter, wie sie bei einem Abbruch entsteht.
out.push('{"type":"access","accessor":{"identifier":"demo.taxi.ri');

process.stdout.write(`${out.join('\n')}\n`);

// Ein Hinweis für den Menschen, nicht für den Parser.
process.stderr.write(
  `${out.length} Zeilen, ${APPS.length} Apps, Zeitraum ${iso(START)} bis ${iso(END)}\n` +
  `Nachtzugriffe: ${lines.filter((l) => l.obj.kind === 'intervalBegin' && localHour(l.t) < 6).length}\n`,
);
