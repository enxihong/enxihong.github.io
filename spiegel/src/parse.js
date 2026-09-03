// parse.js — Zeilen → Ereignisse.
//
// Es gibt kein offizielles Schema von Apple, also defensiv parsen: nie davon
// ausgehen, dass ein Feld existiert, unbekannte Typen ignorieren statt einen
// Fehler zu werfen, kaputte Zeilen zählen statt abzubrechen. Der Bericht kann
// am Ende abgeschnitten sein.
//
// Keine DOM-Abhängigkeit — dieses Modul ist ohne Browser prüfbar.

/** Version, die dieser Viewer kennt (Dateiname: App_Privacy_Report_v4_…). */
export const SUPPORTED_VERSION = 4;

const FILENAME_RE = /App_Privacy_Report_v(\d+)/i;

/**
 * Liest die Versionsnummer aus dem Dateinamen.
 * @returns {{version: number|null, supported: boolean}}
 */
export function reportVersion(fileName = '') {
  const m = FILENAME_RE.exec(String(fileName));
  if (!m) return { version: null, supported: false };
  const version = Number(m[1]);
  return { version, supported: version === SUPPORTED_VERSION };
}

/**
 * @param {string} text  Inhalt der .ndjson-Datei
 * @returns {{events: object[], badLines: number, ignored: number, dataLines: number}}
 */
export function parseReport(text) {
  const events = [];
  let badLines = 0;
  let ignored = 0;
  let dataLines = 0;

  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    dataLines++;

    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      badLines++;
      continue;
    }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      badLines++;
      continue;
    }

    const ev = normalize(obj);
    if (ev) events.push(ev);
    else ignored++;
  }

  return { events, badLines, ignored, dataLines };
}

/**
 * Eine rohe Zeile in ein Ereignis übersetzen, oder null für alles, was v0
 * bewusst nicht auswertet (z.B. der tcc-Stream).
 */
function normalize(obj) {
  switch (str(obj.type)) {
    case 'access':          return normalizeAccess(obj);
    case 'networkActivity': return normalizeNetwork(obj);
    default:                return null;
  }
}

function normalizeAccess(obj) {
  const accessor = obj.accessor && typeof obj.accessor === 'object' ? obj.accessor : {};
  const bundleID = str(accessor.identifier) || str(obj.bundleID);
  const at = time(obj.timeStamp);
  if (!bundleID || at.ms === null) return null;

  const kind = str(obj.kind) || 'event';
  return {
    type: 'access',
    bundleID,
    identifierType: str(accessor.identifierType) || 'bundleID',
    // Unbekannte Kategorien durchreichen und roh anzeigen statt verschlucken.
    category: str(obj.category) || 'unbekannt',
    kind: kind === 'intervalBegin' || kind === 'intervalEnd' ? kind : 'event',
    // Begin und End teilen sich dieselbe UUID; fehlt sie, bleibt es ein Punkt.
    pairID: str(obj.identifier) || null,
    at: at.ms,
    atLocal: at.local,
  };
}

function normalizeNetwork(obj) {
  const bundleID = str(obj.bundleID);
  const domain = str(obj.domain).toLowerCase().replace(/\.$/, '');
  if (!bundleID || !domain) return null;

  const first = time(obj.firstTimeStamp);
  const last = time(obj.lastTimeStamp);
  const initiatedType = str(obj.initiatedType) || 'unbekannt';

  return {
    type: 'network',
    bundleID,
    domain,
    // Oft leer. Darauf nicht verlassen — die eigene Zuordnung gewinnt.
    domainOwner: str(obj.domainOwner),
    initiatedType,
    appInitiated: initiatedType === 'AppInitiated',
    hits: count(obj.hits),
    first: first.ms,
    firstLocal: first.local,
    last: last.ms,
    lastLocal: last.local,
  };
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function count(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 1;
}

const OFFSET_RE = /(?:Z|([+-])(\d{2}):?(\d{2}))$/;

/**
 * ISO-8601 mit Zeitzonenoffset → { ms, local }.
 *
 * `ms` ist der echte Zeitpunkt, `local` derselbe Zeitpunkt in der Zeitzone, in
 * der er aufgezeichnet wurde. Ausgewertet wird `local`: „3 Uhr nachts“ soll
 * 3 Uhr nachts bleiben, auch wenn der Bericht anderswo geöffnet wird.
 */
function time(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return { ms: v, local: v };
  if (typeof v !== 'string' || !v) return { ms: null, local: null };
  const ms = Date.parse(v);
  if (!Number.isFinite(ms)) return { ms: null, local: null };

  const m = OFFSET_RE.exec(v.trim());
  let offsetMin = 0;
  if (m && m[1]) offsetMin = (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
  else if (!m) offsetMin = -new Date(ms).getTimezoneOffset(); // ohne Offset: als Ortszeit lesen

  return { ms, local: ms + offsetMin * 60000 };
}
