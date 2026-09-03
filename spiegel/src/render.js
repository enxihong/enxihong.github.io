// render.js — Kennzahlen → DOM.
//
// Alles wird per createElement/textContent gebaut, nie per innerHTML: der
// Bericht ist fremde Eingabe. Inline-Styles per Attribut wären ohnehin von der
// CSP verboten, Positionen laufen deshalb über das CSSOM.

import { categoryLabel } from './analyze.js';

const nf = new Intl.NumberFormat('de-DE');

// analyze.js rechnet in der Zeitzone des Berichts; die Werte sind bereits
// verschoben, also hier ohne weitere Verschiebung formatieren.
const dayFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const shortDayFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
});

const HOUR_MS = 3600000;
const NIGHT_END_MS = 6 * HOUR_MS;
const DAY_MS = 86400000;

/** Baut den kompletten Bericht in die vorhandene Hülle. */
export function renderReport(model, dom) {
  dom.range.textContent = formatRange(model.range);
  dom.statApps.textContent = nf.format(model.totals.apps);
  dom.statAccesses.textContent = nf.format(model.totals.accesses);
  dom.statDomains.textContent = nf.format(model.totals.domains);
  dom.summary.textContent = model.summary;

  dom.list.replaceChildren(...model.apps.map((app) => renderApp(app, model.range)));
}

export function renderParseNote({ badLines, dataLines, ignored, openIntervals, lookupMissing }) {
  const bits = [`${nf.format(dataLines)} Zeilen gelesen`];
  if (ignored) bits.push(`${nf.format(ignored)} nicht ausgewertet (andere Ereignistypen)`);
  if (badLines) bits.push(`${nf.format(badLines)} unlesbar und übersprungen`);
  if (openIntervals) {
    bits.push(openIntervals === 1
      ? '1 Zugriff ohne Ende im Bericht'
      : `${nf.format(openIntervals)} Zugriffe ohne Ende im Bericht`);
  }
  if (lookupMissing && lookupMissing.length) {
    bits.push(`Nachschlagetabelle fehlt: ${lookupMissing.join(', ')}`);
  }
  return `${bits.join(' · ')}.`;
}

function renderApp(app, range) {
  const details = el('details', 'app');
  const summary = el('summary');

  const main = el('div', 'app-main');
  const name = el('div', 'app-name', app.name);
  main.append(name);
  if (app.named) main.append(el('div', 'app-id', app.bundleID));
  main.append(renderMeta(app));

  const sensors = el('div', 'sensors');
  for (const c of app.categories.slice(0, 4)) {
    const chip = el('span', c.nightCount ? 'sensor night' : 'sensor',
      `${categoryLabel(c.category)} ${nf.format(c.count)}`);
    chip.title = chipTitle(c);
    sensors.append(chip);
  }

  summary.append(main, sensors, el('span', 'chev', '›'));
  details.append(summary, renderDetail(app, range));
  return details;
}

function renderMeta(app) {
  const meta = el('div', 'app-meta');
  meta.append(el('span', null, `${nf.format(app.accessCount)} ${app.accessCount === 1 ? 'Zugriff' : 'Zugriffe'}`));
  meta.append(el('span', null, `${nf.format(app.domainCount)} ${app.domainCount === 1 ? 'Domain' : 'Domains'}`));

  if (app.domainCount) {
    const pct = Math.round(app.trackerShare * 100);
    meta.append(el('span', pct ? 'tracker-share' : 'tracker-share none', `${pct} % Tracker`));
  }
  if (app.backgroundHits) {
    meta.append(el('span', null, `${nf.format(app.backgroundHits)} Hintergrund-Kontakte`));
  }
  if (app.nightAccesses) {
    meta.append(el('span', null, `${nf.format(app.nightAccesses)} nachts`));
  }
  return meta;
}

function renderDetail(app, range) {
  const box = el('div', 'detail');

  box.append(el('h3', null, 'Sensorzugriffe im Zeitraum'));
  box.append(app.accesses.length ? renderTimeline(app, range) : el('p', 'empty', 'Keine Sensorzugriffe im Bericht.'));

  box.append(el('h3', null, 'Kontaktierte Domains'));
  box.append(app.domains.length ? renderDomains(app) : el('p', 'empty', 'Keine Verbindungen im Bericht.'));

  return box;
}

function renderTimeline(app, range) {
  const wrap = el('div', 'timeline');
  const from = range.dayFrom;
  const span = Math.max(1, range.dayTo - range.dayFrom);
  const days = range.dayCount;

  // Leeres Label als Platzhalter, damit die Tage über der Spur stehen.
  const header = el('div', 'tl-days');
  header.append(el('span', 'tl-label'));
  const dayList = el('span', 'tl-daylist');
  for (let i = 0; i < days; i++) {
    const d = new Date(from + i * DAY_MS);
    const cell = el('span', 'tl-day');
    // Auf schmalen Displays bleibt nur der Wochentag stehen (siehe style.css).
    if (days <= 8) cell.append(el('span', 'tl-dow', shortDayFmt.format(d)));
    cell.append(el('span', 'tl-date', dayFmt.format(d)));
    dayList.append(cell);
  }
  header.append(dayList);
  wrap.append(header);

  for (const c of app.categories) {
    const row = el('div', 'tl-row');
    row.append(el('span', 'tl-label', categoryLabel(c.category)));

    const track = el('div', 'tl-track');
    // Nachtstreifen und Tagesraster liegen hinter den Marken.
    for (let i = 0; i < days; i++) {
      const dayStart = from + i * DAY_MS;
      const night = el('div', 'tl-night');
      night.style.left = pct(dayStart - from, span);
      night.style.width = pct(NIGHT_END_MS, span);
      track.append(night);
      if (i > 0) {
        const grid = el('div', 'tl-grid');
        grid.style.left = pct(dayStart - from, span);
        track.append(grid);
      }
    }

    for (const a of app.accesses) {
      if (a.category !== c.category) continue;
      const start = clamp(a.start, range.dayFrom, range.dayTo);
      const end = a.state === 'open' ? range.dayTo : clamp(a.end ?? a.start, start, range.dayTo);
      const mark = el('div', `tl-mark${a.night ? ' night' : ''}${a.state === 'open' ? ' open' : ''}`);
      mark.style.left = pct(start - from, span);
      mark.style.width = pct(Math.max(end - start, span / 400), span);
      mark.title = markTitle(a);
      track.append(mark);
    }

    row.append(track);
    wrap.append(row);
  }

  const legend = ['Blau: zwischen 0 und 6 Uhr.'];
  if (app.openIntervals) legend.push('Gestrichelt: Ende fehlt im Bericht, Dauer unbekannt.');
  wrap.append(el('p', 'tl-legend', legend.join(' ')));
  return wrap;
}

function renderDomains(app) {
  const wrap = el('div', 'table-wrap');
  const table = el('table');

  const thead = el('thead');
  const hrow = el('tr');
  hrow.append(el('th', null, 'Domain'), el('th', null, 'Zuordnung'), el('th', 'num', 'Kontakte'));
  thead.append(hrow);

  const tbody = el('tbody');
  for (const d of app.domains) {
    const tr = el('tr');

    const dom = el('td', 'dom');
    dom.append(document.createTextNode(d.domain));
    if (d.appInitiated) {
      dom.append(document.createTextNode(' '), el('span', 'tag bg', 'Hintergrund'));
    }
    tr.append(dom);

    const who = el('td');
    if (d.tracker) {
      who.append(el('span', 'tag', d.trackerCategory ? `Tracker · ${d.trackerCategory}` : 'Tracker'));
      if (d.owner) who.append(document.createTextNode(' '), el('span', 'owner', d.owner));
    } else if (d.owner) {
      who.append(el('span', 'owner', d.owner));
    } else {
      who.append(el('span', 'owner', '—'));
    }
    tr.append(who);

    const hits = el('td', 'num', nf.format(d.hits));
    if (d.first) hits.title = `${dateTimeFmt.format(d.first)} bis ${dateTimeFmt.format(d.last ?? d.first)}`;
    tr.append(hits);

    tbody.append(tr);
  }

  table.append(thead, tbody);
  wrap.append(table);
  return wrap;
}

/* ---------------------------------------------------------------- Helfer */

function formatRange(range) {
  if (!range.from) return 'Zeitraum unbekannt';
  const days = range.dayCount || range.days;
  return `${dayFmt.format(range.from)} – ${dayFmt.format(range.to)} · ${days} ${days === 1 ? 'Tag' : 'Tage'}`;
}

function markTitle(a) {
  const when = dateTimeFmt.format(a.start);
  if (a.state === 'open') return `${when} · Ende fehlt im Bericht`;
  if (a.state === 'orphanEnd') return `${when} · Anfang fehlt im Bericht`;
  if (a.duration) return `${when} · ${formatDuration(a.duration)}`;
  return when;
}

function chipTitle(c) {
  const bits = [`${nf.format(c.count)} Zugriffe`];
  if (c.totalMs) bits.push(`zusammen ${formatDuration(c.totalMs)}`);
  if (c.nightCount) bits.push(`${nf.format(c.nightCount)} zwischen 0 und 6 Uhr`);
  if (c.open) bits.push(`${nf.format(c.open)} ohne Ende`);
  return bits.join(', ');
}

export function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

function pct(value, span) {
  return `${((value / span) * 100).toFixed(4)}%`;
}

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
