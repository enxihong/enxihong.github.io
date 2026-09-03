# Spiegel

Ein statischer Web-Viewer für den iOS-App-Datenschutzbericht. Man zieht die
`.ndjson`-Datei ins Browserfenster und bekommt eine lesbare Wochenbilanz:
welche App auf welchen Sensor zugegriffen hat und mit wem sie im Hintergrund
gesprochen hat.

Live: <https://enxihong.github.io/spiegel/>

## Prinzipien

1. **Kein Backend.** Alles läuft im Browser.
2. **Kein Netzwerk-Call zur Laufzeit.** Nach dem Laden der Seite geht kein
   Request mehr raus, der irgendetwas aus dem Bericht enthält. Die einzigen
   Anfragen sind die eigenen statischen Dateien (`style.css`, `src/*.js`,
   `data/*.json`, und nur auf Knopfdruck `examples/demo.ndjson`) — alle
   same-origin, alle im Repo nachlesbar.
3. **Open Source.** Das Versprechen aus 1 und 2 ist nur so viel wert wie das
   Repo, in dem man es nachlesen kann.

Erzwungen wird das per Content-Security-Policy im Meta-Tag:
`default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'`.
Kein Analytics, keine externen Schriften, kein CDN, keine Fehler-Telemetrie.
Nachprüfbar im Network-Tab.

Zwei Einschränkungen der Meta-Variante, damit sie niemand überschätzt:
`frame-ancestors` wirkt dort nicht (dagegen hilft nur ein HTTP-Header, den
GitHub Pages nicht setzen lässt), und `style-src 'self'` verbietet nur
Style-Attribute im Markup, nicht das CSSOM. `render.js` setzt Positionen
deshalb bewusst über `element.style.left`, nie über `setAttribute('style')`.

## Aufbau

```
spiegel/
├── index.html
├── style.css
├── src/
│   ├── parse.js       Zeilen → Ereignisse, defensiv
│   ├── analyze.js     Ereignisse → Kennzahlen pro App
│   ├── lookup.js      Bundle-IDs und Domains auflösen
│   ├── render.js      Kennzahlen → DOM
│   └── app.js         Verdrahtung (Einstiegspunkt)
├── data/
│   ├── bundles.json   Bundle-ID → App-Name
│   └── trackers.json  Domain → { owner, ownerId, category }
├── examples/
│   └── demo.ndjson    erfundener Beispielbericht
└── tools/
    ├── build-bundles.js
    └── make-demo.js
```

`parse.js` und `analyze.js` haben keine DOM-Abhängigkeit und kennen weder
`fetch` noch die Nachschlagetabellen — die werden `analyze()` als
`{ appName, trackerFor }` hereingereicht. Damit sind beide ohne Testframework
prüfbar und später in einer nativen App wiederverwendbar.

`app.js` steht nicht in der Spec: `index.html` darf wegen der CSP kein
Inline-Skript enthalten, also braucht die Verdrahtung eine eigene Datei.

## Was berechnet wird

- **Zugriffsdauern.** `intervalBegin` und `intervalEnd` werden über die
  gemeinsame `identifier`-UUID gepaart. Fehlt das Ende, ist das Intervall
  „offen“ und wird gestrichelt gezeichnet — geraten wird nicht. Ein Ende ohne
  Anfang (vorne abgeschnittener Bericht) bleibt ebenfalls als solches stehen.
- **Hintergrund-Kontakte.** Alle `networkActivity`-Einträge mit
  `initiatedType: "AppInitiated"`, pro App über `hits` summiert.
- **Tracker-Anteil.** Anteil der kontaktierten Domains pro App, die in
  `trackers.json` stehen. Die Zuordnung greift auch für Subdomains
  (`graph.facebook.com` → `facebook.com`).
- **Auffälligkeit.** Hintergrund-Hits × Tracker-Anteil. Danach ist die
  App-Liste sortiert, nicht alphabetisch.
- **Nachtzugriffe.** Sensorzugriffe zwischen 0 und 6 Uhr, gesondert
  ausgewiesen und in der Zeitleiste blau markiert.

Zeiten werden in der Zeitzone gerechnet, in der der Bericht aufgezeichnet
wurde (aus dem Offset im Zeitstempel), nicht in der des Betrachters. Sonst
verschiebt sich „3 Uhr nachts“, wenn jemand die Datei im Urlaub öffnet.

Zeilen mit `stream: "com.apple.privacy.accounting.stream.tcc"` werden in v0
ignoriert und nur gezählt. Unbekannte Kategorien werden roh durchgereicht.

## Redlichkeit

Das Tool zeigt Verbindungen, keine Inhalte. Der Datenverkehr ist
verschlüsselt — dass eine App mit einem Werbenetzwerk spricht, beweist nicht,
*was* sie überträgt. Dieser Satz steht in der Oberfläche, nicht im Impressum.

## Nachschlagedaten

**`data/bundles.json`** ist derzeit eine handgepflegte Startliste, keine
1000 Apps. Die volle Liste erzeugt

```bash
node tools/build-bundles.js        # braucht Netz, läuft auf deinem Rechner
```

aus den App-Store-Topcharts pro Kategorie (Länder `de` und `us`). Vorhandene
Einträge bleiben erhalten. Was durchfällt, wird als rohe Bundle-ID angezeigt —
einen Live-Fallback gibt es bewusst nicht.

**`data/trackers.json`** ist ebenfalls handgeschrieben: die bekannten Werbe-,
Attributions- und Analysenetzwerke, `domain → { owner, ownerId, category }`.

> **Offen: Lizenz.** Die naheliegende Erweiterung ist der DuckDuckGo Tracker
> Radar oder die Exodus-Privacy-Liste. Der Tracker Radar steht unter einer
> CC-BY-NC-Lizenz — für ein freies Tool unproblematisch, für ein späteres
> Geschäftsmodell nicht. Solange das nicht geklärt ist, liegt hier nichts
> Übernommenes. Exodus hat andere Bedingungen; das jetzt zu klären ist
> billiger als später.

`ownerId` ist da, weil der zweite Teil (Auskunft nach Art. 15 DSGVO) Firmen
als Entitäten braucht und nicht als Strings in einer Tabelle. `analyze()`
liefert sie schon heute unter `model.companies`.

## Beispielbericht

`examples/demo.ndjson` ist vollständig erfunden: erfundene Apps mit dem
Präfix `demo.`, aber echte Trackerdomains, damit die Zuordnung sichtbar wird.
Die Oberfläche sagt das an, solange der Beispielbericht angezeigt wird — eine
geteilte Zahl soll niemandem als echte Messung einer realen App untergeschoben
werden. Neu erzeugen:

```bash
node tools/make-demo.js > examples/demo.ndjson
```

Die Datei enthält absichtlich eine kaputte Zeile, zwei ignorierte
tcc-Einträge, ein Intervall ohne Ende und ein Ende ohne Anfang.

## Lokal testen

```bash
python3 -m http.server 8080
# http://localhost:8080/spiegel/
```

ES-Module brauchen einen Server; ein Doppelklick auf `index.html` reicht nicht.

Parser und Auswertung laufen auch ohne Browser:

```bash
node --input-type=module -e "
  import fs from 'node:fs';
  const { parseReport } = await import('./src/parse.js');
  const { analyze } = await import('./src/analyze.js');
  const { makeLookup } = await import('./src/lookup.js');
  const p = parseReport(fs.readFileSync('examples/demo.ndjson', 'utf8'));
  const l = makeLookup(
    JSON.parse(fs.readFileSync('data/bundles.json', 'utf8')),
    JSON.parse(fs.readFileSync('data/trackers.json', 'utf8')));
  console.log(analyze(p.events, l).summary);
"
```

## Stand

v0.3 aus der Spec: Datei rein, drei Zahlen, Zusammenfassungszeile, App-Liste
nach Auffälligkeit, Zeitleiste, Nachtzugriffe, Domain-Tabelle mit
Tracker-Markierung, Beispielbericht, Anleitung.

Offen: die vollen 1000 Bundle-IDs, die Lizenzfrage bei den Trackerdaten und
v1 (Bilanz als Bild teilbar).

## Risiken

- **Apple ändert das Format.** Die Datei heißt `_v4_`. Der Viewer liest die
  Version aus dem Dateinamen und warnt bei allem anderen, statt still Falsches
  anzuzeigen.
- **Der Kaltstart.** Sieben Tage zwischen Interesse und Ergebnis. Der
  Beispielbericht ist die einzige Gegenmaßnahme in v0.
- **Vorhandene Lösungen.** *App Privacy Insights* und der Viewer von
  johnspurlock können das Meiste davon. Der Vorteil hier ist ausschließlich:
  null Installation, deutsch, nachweisbar ohne Backend.
