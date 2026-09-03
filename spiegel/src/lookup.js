// lookup.js — Bundle-IDs und Domains auflösen.
//
// Beide Tabellen sind statische Dateien im Repo. Kein Fallback auf eine
// Live-Abfrage: das würde Prinzip 2 brechen. Fällt eine ID durch, wird die rohe
// Bundle-ID angezeigt.

const EMPTY = { appName: () => '', trackerFor: () => null, ready: false };

/**
 * Lädt die Nachschlagetabellen von der eigenen Herkunft (same-origin, von der
 * CSP auf 'self' begrenzt). Schlägt das fehl, arbeitet der Viewer ohne sie
 * weiter - roh statt gar nicht.
 */
export async function loadLookups(base = '.') {
  const [bundles, trackers] = await Promise.all([
    loadJson(`${base}/data/bundles.json`),
    loadJson(`${base}/data/trackers.json`),
  ]);
  const lookup = makeLookup(bundles, trackers);
  lookup.ready = Boolean(bundles || trackers);
  lookup.missing = [!bundles && 'bundles.json', !trackers && 'trackers.json'].filter(Boolean);
  return lookup;
}

/** Reine Fabrik ohne Netzwerk - so ist die Auflösung ohne Browser prüfbar. */
export function makeLookup(bundles, trackers) {
  const names = bundles && typeof bundles === 'object' ? bundles : {};
  const table = normalizeTrackers(trackers);

  return {
    ...EMPTY,
    appName(bundleID) {
      const name = names[bundleID];
      return typeof name === 'string' ? name : '';
    },
    /**
     * Exakte Domain zuerst, dann Label für Label von links abschneiden:
     * graph.facebook.com -> facebook.com. So greift ein Eintrag auch für
     * Subdomains, die niemand einzeln pflegen will.
     */
    trackerFor(domain) {
      if (typeof domain !== 'string' || !domain) return null;
      let d = domain.toLowerCase().replace(/\.$/, '');
      while (d.includes('.')) {
        const hit = table.get(d);
        if (hit) return hit;
        d = d.slice(d.indexOf('.') + 1);
      }
      return table.get(d) || null;
    },
  };
}

function normalizeTrackers(trackers) {
  const table = new Map();
  if (!trackers || typeof trackers !== 'object') return table;
  for (const [domain, value] of Object.entries(trackers)) {
    if (!domain) continue;
    const entry = typeof value === 'string' ? { owner: value } : (value || {});
    const owner = typeof entry.owner === 'string' ? entry.owner : '';
    table.set(domain.toLowerCase(), {
      owner,
      // Firmen sollen als Entität geführt werden, nicht als Freitext (Spec 11).
      ownerId: typeof entry.ownerId === 'string' && entry.ownerId ? entry.ownerId : slug(owner || domain),
      category: typeof entry.category === 'string' ? entry.category : '',
    });
  }
  return table;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function loadJson(url) {
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
