// app.js — Einstiegspunkt: Datei entgegennehmen, Module verdrahten, Zustand halten.
//
// (Nicht in der Spec-Struktur aufgeführt; index.html darf wegen der CSP kein
// Inline-Skript enthalten, also braucht die Verdrahtung eine eigene Datei.
// parse/analyze/lookup/render behalten ihre Rollen aus Abschnitt 8.)

import { parseReport, reportVersion, SUPPORTED_VERSION } from './parse.js';
import { analyze } from './analyze.js';
import { loadLookups } from './lookup.js';
import { renderReport, renderParseNote } from './render.js';

const $ = (id) => document.getElementById(id);

const dom = {
  start: $('view-start'),
  report: $('view-report'),
  banner: $('report-banner'),
  range: $('report-range'),
  statApps: $('stat-apps'),
  statAccesses: $('stat-accesses'),
  statDomains: $('stat-domains'),
  summary: $('report-summary'),
  list: $('app-list'),
  note: $('parse-note'),
  status: $('status'),
  dropzone: $('dropzone'),
  fileInput: $('file-input'),
  demoBtn: $('demo-btn'),
  resetBtn: $('reset-btn'),
};

const DEMO_FILE = 'examples/demo.ndjson';

// Die Tabellen einmal laden, bevor irgendwas passiert. Danach geht kein
// Request mehr raus - auch keiner mit den Daten aus dem Bericht.
let lookupPromise = loadLookups('.');

/* ------------------------------------------------------------- Eingaben */

dom.fileInput.addEventListener('change', () => {
  const file = dom.fileInput.files && dom.fileInput.files[0];
  if (file) handleFile(file);
});

dom.demoBtn.addEventListener('click', loadDemo);
dom.resetBtn.addEventListener('click', reset);

for (const type of ['dragenter', 'dragover']) {
  dom.dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    dom.dropzone.classList.add('over');
  });
}
for (const type of ['dragleave', 'dragend']) {
  dom.dropzone.addEventListener(type, () => dom.dropzone.classList.remove('over'));
}
dom.dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dom.dropzone.classList.remove('over');
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// Ein Fallenlassen daneben soll nicht die Datei im Browser öffnen.
for (const type of ['dragover', 'drop']) {
  window.addEventListener(type, (e) => {
    if (!dom.dropzone.contains(e.target)) e.preventDefault();
  });
}

/* ------------------------------------------------------------- Ablauf */

async function handleFile(file) {
  status(`„${file.name}“ wird gelesen …`);
  try {
    const text = await file.text();
    await show(text, { fileName: file.name });
  } catch (err) {
    status(`Die Datei konnte nicht gelesen werden: ${err.message}`, true);
  }
}

async function loadDemo() {
  status('Beispielbericht wird geladen …');
  try {
    const res = await fetch(DEMO_FILE, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await show(await res.text(), { demo: true });
  } catch (err) {
    status(`Der Beispielbericht ist nicht erreichbar: ${err.message}`, true);
  }
}

async function show(text, { fileName = '', demo = false } = {}) {
  const { events, badLines, ignored, dataLines } = parseReport(text);

  if (!events.length) {
    status(
      dataLines
        ? 'In dieser Datei stehen keine auswertbaren Ereignisse. Ist es wirklich der App-Datenschutzbericht?'
        : 'Die Datei ist leer.',
      true,
    );
    return;
  }

  const lookup = await lookupPromise;
  const model = analyze(events, lookup);

  renderReport(model, dom);
  dom.note.textContent = renderParseNote({
    badLines,
    ignored,
    dataLines,
    openIntervals: model.totals.openIntervals,
    lookupMissing: lookup.missing,
  });

  setBanner(bannerText({ fileName, demo }));

  clearStatus();
  dom.start.hidden = true;
  dom.report.hidden = false;
  window.scrollTo(0, 0);
}

function bannerText({ fileName, demo }) {
  if (demo) {
    return 'Beispielbericht: erfundene Apps, echte Trackerdomains. Nur zum Zeigen, wie der Bericht aussieht.';
  }
  // Die Datei heisst _v4_, es gab also schon drei Versionen davor: bei
  // Unbekanntem warnen statt still Falsches anzuzeigen.
  const { version, supported } = reportVersion(fileName);
  if (supported) return '';
  if (version === null) {
    return `Der Dateiname nennt keine Berichtsversion. Dieser Viewer ist auf Version ${SUPPORTED_VERSION} ausgelegt - was hier steht, kann unvollständig sein.`;
  }
  return `Diese Datei ist Version ${version}, dieser Viewer kennt Version ${SUPPORTED_VERSION}. Die Auswertung kann unvollständig oder falsch sein.`;
}

function setBanner(text) {
  dom.banner.textContent = text;
  dom.banner.hidden = !text;
}

function reset() {
  dom.fileInput.value = '';
  dom.list.replaceChildren();
  dom.report.hidden = true;
  dom.start.hidden = false;
  clearStatus();
  window.scrollTo(0, 0);
}

function status(text, isError = false) {
  dom.status.textContent = text;
  dom.status.classList.toggle('error', isError);
  dom.status.hidden = false;
}

function clearStatus() {
  dom.status.textContent = '';
  dom.status.hidden = true;
}
