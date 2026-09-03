// analyze.js — Ereignisse → Kennzahlen pro App.
//
// Keine DOM-Abhängigkeit und keine Netzwerk-Abhängigkeit: die Auflösung von
// Bundle-IDs und Tracker-Domains wird als `resolve` hereingereicht. Damit ist
// dieses Modul ohne Testframework prüfbar und später in einer nativen App
// wiederverwendbar.

/** Kategorien, die in der Zusammenfassung erwähnt werden dürfen - heikelste zuerst. */
const SENSITIVE_ORDER = ['microphone', 'camera', 'location', 'contacts', 'photos', 'mediaLibrary', 'calendars'];

/** Kurzform für Chips und Zeitleiste. Unbekannte Kategorien bleiben roh. */
export const CATEGORY_LABELS = {
  camera: 'Kamera',
  microphone: 'Mikrofon',
  photos: 'Fotos',
  contacts: 'Kontakte',
  location: 'Standort',
  calendars: 'Kalender',
  mediaLibrary: 'Mediathek',
  reminders: 'Erinnerungen',
  screenRecording: 'Bildschirm',
  unbekannt: 'unbekannt',
};

/** Akkusativ-Form für den Zusammenfassungssatz. */
const CATEGORY_PHRASES = {
  camera: 'deine Kamera',
  microphone: 'dein Mikrofon',
  photos: 'deine Fotos',
  contacts: 'deine Kontakte',
  location: 'deinen Standort',
  calendars: 'deinen Kalender',
  mediaLibrary: 'deine Mediathek',
};

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

const DAY_MS = 86400000;
const NIGHT_FROM = 0;
const NIGHT_TO = 6; // Sensorzugriffe zwischen 0 und 6 Uhr gesondert ausweisen.

/**
 * @param {object[]} events    aus parse.js
 * @param {object}   resolve   { appName(bundleID), trackerFor(domain) }
 */
export function analyze(events, resolve = {}) {
  const appName = resolve.appName || (() => '');
  const trackerFor = resolve.trackerFor || (() => null);

  const apps = new Map();
  const companies = new Map();
  const allDomains = new Set();
  let minTime = Infinity;
  let maxTime = -Infinity;

  const app = (bundleID) => {
    let a = apps.get(bundleID);
    if (!a) {
      const name = appName(bundleID);
      a = {
        bundleID,
        name: name || bundleID,
        named: Boolean(name),
        accesses: [],
        categories: new Map(),
        domainMap: new Map(),
        accessCount: 0,
        nightAccesses: 0,
        openIntervals: 0,
        backgroundHits: 0,
        trackerBackgroundHits: 0,
      };
      apps.set(bundleID, a);
    }
    return a;
  };

  const touchTime = (t) => {
    if (t === null || t === undefined) return;
    if (t < minTime) minTime = t;
    if (t > maxTime) maxTime = t;
  };

  // --- Zugriffe: intervalBegin und intervalEnd über die gemeinsame UUID paaren ---
  const pending = new Map();

  for (const ev of events) {
    if (ev.type !== 'access') continue;
    const a = app(ev.bundleID);
    const at = ev.atLocal ?? ev.at;
    touchTime(at);

    if (ev.kind === 'intervalBegin') {
      const key = pairKey(ev);
      // Zwei Begins ohne End dazwischen: das erste bleibt offen stehen.
      const stale = pending.get(key);
      if (stale) pushAccess(stale.app, stale.access);
      pending.set(key, {
        app: a,
        access: { category: ev.category, start: at, end: null, state: 'open' },
      });
      continue;
    }

    if (ev.kind === 'intervalEnd') {
      const key = pairKey(ev);
      const open = pending.get(key);
      if (open) {
        pending.delete(key);
        open.access.end = at;
        open.access.state = 'complete';
        pushAccess(open.app, open.access);
      } else {
        // Der Bericht ist vorne abgeschnitten: Ende ohne Anfang. Nicht raten.
        pushAccess(a, { category: ev.category, start: at, end: at, state: 'orphanEnd' });
      }
      continue;
    }

    pushAccess(a, { category: ev.category, start: at, end: at, state: 'point' });
  }

  // Was übrig bleibt, hat kein Ende: als offen markieren statt zu raten.
  for (const open of pending.values()) pushAccess(open.app, open.access);

  // --- Netzwerk ---
  for (const ev of events) {
    if (ev.type !== 'network') continue;
    const a = app(ev.bundleID);
    const first = ev.firstLocal ?? ev.first;
    const last = ev.lastLocal ?? ev.last;
    touchTime(first);
    touchTime(last);
    allDomains.add(ev.domain);

    let d = a.domainMap.get(ev.domain);
    if (!d) {
      const t = trackerFor(ev.domain);
      d = {
        domain: ev.domain,
        hits: 0,
        appInitiated: false,
        userInitiated: false,
        tracker: Boolean(t),
        // domainOwner ist oft leer, die eigene Zuordnung geht vor.
        owner: (t && t.owner) || ev.domainOwner || '',
        ownerId: (t && t.ownerId) || '',
        trackerCategory: (t && t.category) || '',
        first: null,
        last: null,
      };
      a.domainMap.set(ev.domain, d);
    }
    d.hits += ev.hits;
    if (ev.appInitiated) d.appInitiated = true;
    else if (ev.initiatedType === 'UserInitiated') d.userInitiated = true;
    d.first = minOf(d.first, first);
    d.last = maxOf(d.last, last);

    if (ev.appInitiated) {
      a.backgroundHits += ev.hits;
      if (d.tracker) a.trackerBackgroundHits += ev.hits;
    }

    // Firmen als Entitäten führen, nicht nur als Strings in einer Tabelle (Spec 11).
    if (d.tracker) {
      const id = d.ownerId || d.owner || d.domain;
      let c = companies.get(id);
      if (!c) {
        c = { id, name: d.owner || d.domain, domains: new Set(), apps: new Set(), hits: 0, backgroundHits: 0 };
        companies.set(id, c);
      }
      c.domains.add(d.domain);
      c.apps.add(ev.bundleID);
      c.hits += ev.hits;
      if (ev.appInitiated) c.backgroundHits += ev.hits;
    }
  }

  // --- Ableitungen pro App ---
  const appList = [...apps.values()].map(finishApp).sort(byConspicuousness);

  const totals = {
    apps: appList.length,
    accesses: appList.reduce((n, a) => n + a.accessCount, 0),
    domains: allDomains.size,
    backgroundHits: appList.reduce((n, a) => n + a.backgroundHits, 0),
    trackerBackgroundHits: appList.reduce((n, a) => n + a.trackerBackgroundHits, 0),
    nightAccesses: appList.reduce((n, a) => n + a.nightAccesses, 0),
    trackerDomains: countTrackerDomains(appList),
    openIntervals: appList.reduce((n, a) => n + a.openIntervals, 0),
  };

  const range = buildRange(minTime, maxTime);

  const companyList = [...companies.values()]
    .map((c) => ({ ...c, domains: [...c.domains], apps: [...c.apps] }))
    .sort((x, y) => y.hits - x.hits);

  return {
    range,
    totals,
    apps: appList,
    companies: companyList,
    summary: summarize({ range, totals, apps: appList }),
  };

  function pairKey(ev) {
    return ev.pairID
      ? `${ev.bundleID} ${ev.pairID}`
      : `${ev.bundleID} ${ev.category} ${ev.atLocal ?? ev.at}`;
  }

  function pushAccess(a, access) {
    access.night = isNight(access.start);
    access.duration = access.state === 'complete' ? Math.max(0, access.end - access.start) : null;
    a.accesses.push(access);
    a.accessCount++;
    if (access.night) a.nightAccesses++;
    if (access.state === 'open') a.openIntervals++;

    let c = a.categories.get(access.category);
    if (!c) {
      c = { category: access.category, count: 0, nightCount: 0, totalMs: 0, open: 0 };
      a.categories.set(access.category, c);
    }
    c.count++;
    if (access.night) c.nightCount++;
    if (access.duration !== null) c.totalMs += access.duration;
    if (access.state === 'open') c.open++;
  }
}

function finishApp(a) {
  const domains = [...a.domainMap.values()].sort((x, y) => y.hits - x.hits);
  const trackerDomainCount = domains.filter((d) => d.tracker).length;
  const trackerShare = domains.length ? trackerDomainCount / domains.length : 0;

  return {
    bundleID: a.bundleID,
    name: a.name,
    named: a.named,
    accesses: a.accesses.sort((x, y) => x.start - y.start),
    accessCount: a.accessCount,
    nightAccesses: a.nightAccesses,
    openIntervals: a.openIntervals,
    categories: [...a.categories.values()].sort((x, y) => y.count - x.count),
    domains,
    domainCount: domains.length,
    trackerDomainCount,
    trackerShare,
    backgroundHits: a.backgroundHits,
    trackerBackgroundHits: a.trackerBackgroundHits,
    // Auffälligkeit: Hintergrund-Hits mal Tracker-Anteil (Spec 6).
    score: a.backgroundHits * trackerShare,
  };
}

/** Primär die Auffälligkeit; ohne Tiebreaker fällt alles ohne Tracker zu einem Klumpen zusammen. */
function byConspicuousness(x, y) {
  return (
    y.score - x.score ||
    y.backgroundHits - x.backgroundHits ||
    y.accessCount - x.accessCount ||
    x.name.localeCompare(y.name, 'de')
  );
}

function countTrackerDomains(apps) {
  const set = new Set();
  for (const a of apps) for (const d of a.domains) if (d.tracker) set.add(d.domain);
  return set.size;
}

function buildRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { from: null, to: null, days: 0, dayFrom: null, dayTo: null, dayCount: 0 };
  }
  const dayFrom = startOfDay(min);
  const dayTo = startOfDay(max) + DAY_MS;
  const dayCount = Math.max(1, Math.round((dayTo - dayFrom) / DAY_MS));
  return {
    from: min,
    to: max,
    days: Math.max(1, Math.ceil((max - min) / DAY_MS)),
    dayFrom,
    dayTo,
    dayCount,
  };
}

/**
 * Eine Zeile aus einer Handvoll Regeln. Sie darf nie mehr behaupten, als in den
 * Daten steht - ein Privacy-Tool, das übertreibt, verliert sein Publikum.
 */
function summarize({ range, totals, apps }) {
  if (!apps.length) return 'Der Bericht enthält keine auswertbaren Ereignisse.';

  const n = (v) => new Intl.NumberFormat('de-DE').format(v);
  const days = range.dayCount || range.days || 0;
  const zeitraum = days ? `In ${days === 1 ? 'einem Tag' : `${n(days)} Tagen`} ` : '';
  const one = totals.apps === 1;
  const subject = `${one ? 'hat' : 'haben'} ${n(totals.apps)} ${one ? 'App' : 'Apps'}`;

  const top = topSensor(apps);
  const parts = [];

  if (top) {
    const phrase = CATEGORY_PHRASES[top.category] || `die Kategorie ${categoryLabel(top.category)}`;
    parts.push(`${subject} ${n(top.count)} Mal auf ${phrase} zugegriffen`);
  } else {
    parts.push(`${subject} Verbindungen aufgebaut`);
  }

  if (totals.trackerBackgroundHits > 0) {
    parts.push(`${n(totals.trackerBackgroundHits)} Verbindungen zu Werbe- und Trackingnetzwerken aufgebaut, ohne dass du sie geöffnet hast`);
  } else if (totals.backgroundHits > 0) {
    parts.push(`${n(totals.backgroundHits)} Verbindungen von sich aus aufgebaut`);
  }

  let text = `${zeitraum}${parts.join(' und ')}.`;
  if (totals.nightAccesses > 0) {
    const nightWord = totals.nightAccesses === 1 ? 'Zugriff fiel' : 'Zugriffe fielen';
    text += ` ${n(totals.nightAccesses)} ${nightWord} in die Zeit zwischen 0 und 6 Uhr.`;
  }
  return text;
}

function topSensor(apps) {
  const counts = new Map();
  for (const a of apps) {
    for (const c of a.categories) counts.set(c.category, (counts.get(c.category) || 0) + c.count);
  }
  let best = null;
  for (const category of SENSITIVE_ORDER) {
    const count = counts.get(category);
    if (count && (!best || count > best.count)) best = { category, count };
  }
  if (best) return best;
  // Keine der bekannten Kategorien: die häufigste rohe nehmen.
  let raw = null;
  for (const [category, count] of counts) if (!raw || count > raw.count) raw = { category, count };
  return raw;
}

/** Stunde in der Zeitzone des Berichts (parse.js liefert sie bereits verschoben). */
export function isNight(t) {
  if (t === null || t === undefined) return false;
  const h = new Date(t).getUTCHours();
  return h >= NIGHT_FROM && h < NIGHT_TO;
}

function startOfDay(t) {
  return Math.floor(t / DAY_MS) * DAY_MS;
}

function minOf(a, b) {
  if (a === null || a === undefined) return b ?? null;
  if (b === null || b === undefined) return a;
  return Math.min(a, b);
}

function maxOf(a, b) {
  if (a === null || a === undefined) return b ?? null;
  if (b === null || b === undefined) return a;
  return Math.max(a, b);
}
