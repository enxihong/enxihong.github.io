// Hash router: #/ (home), #/test (terminal quiz), #/type/<id>, #/result/<id>/<t1-t2-t3-t4>

const app = document.getElementById('app');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let run = 0;          // bumped on every route change; cancels running quiz animations
let onKey = null;     // keyboard handler of the active view

addEventListener('keydown', e => onKey && onKey(e));
addEventListener('hashchange', route);
route();

function route() {
  run++;
  onKey = null;
  const [view, id, traits] = location.hash.replace(/^#\/?/, '').split('/');
  scrollTo(0, 0);
  if (view === 'test') return quiz();
  if ((view === 'type' || view === 'result') && TYPES[id]) {
    const t = view === 'result' && traits ? traits.split('-').map(Number) : null;
    return typePage(id, t && t.length === 4 && t.every(n => n >= 0 && n <= 100) ? t : null);
  }
  home();
}

// ---------- Home ----------

function home() {
  document.title = 'What kind of vibe coder are you?';
  const groups = Object.entries(GROUPS).map(([g, info]) => `
    <section class="group ${info.color}">
      <h2>${info.name}</h2>
      <p class="group-blurb">${info.blurb}</p>
      <div class="cards">
        ${Object.entries(TYPES).filter(([, t]) => t.group === g).map(([id, t]) => `
          <a class="card" href="#/type/${id}">
            <span class="avatar">${t.emoji}</span>
            <strong>${t.name}</strong>
            <span>${esc(t.tagline)}</span>
          </a>`).join('')}
      </div>
    </section>`).join('');

  app.innerHTML = `
    <header class="hero">
      <div class="hero-emojis" aria-hidden="true">${Object.values(TYPES).map(t => `<span>${t.emoji}</span>`).join('')}</div>
      <h1>What kind of<br>vibe coder are you?</h1>
      <p>12 questions. Zero mercy. Your AI already knows the answer.</p>
      <a class="btn" href="#/test">Take the test →</a>
      <small>Takes about 3 minutes. Feelings may be hurt.</small>
    </header>
    <main class="wrap">
      <h2 class="section-title">The 15 types</h2>
      ${groups}
    </main>
    ${footer()}`;
}

function footer() {
  return `<footer>Made by <a href="https://github.com/enxihong">Enxi Hong</a>, vibe coded, obviously. · <a href="v1/">Old site</a></footer>`;
}

// ---------- Quiz ----------

async function quiz() {
  document.title = 'Taking the test… · Vibe Coder Test';
  const id = run;
  const scores = {};
  let fast = reduceMotion;

  app.innerHTML = `
    <main class="wrap quiz">
      <div class="term">
        <div class="term-bar"><i></i><i></i><i></i><span id="term-title">whoami-vibe</span></div>
        <div class="term-progress"><div id="progress"></div></div>
        <div class="term-body" id="out"></div>
      </div>
      <p class="hint">Tap or press 1–4 to answer. Tap the terminal to skip the typing.</p>
    </main>`;
  const out = document.getElementById('out');
  out.addEventListener('click', () => { fast = true; });

  const sleep = ms => new Promise(r => setTimeout(r, fast ? 0 : ms));
  const alive = () => { if (id !== run) throw 'cancelled'; };
  const scroll = () => { out.scrollTop = out.scrollHeight; };

  async function say(text, cls = '') {
    alive();
    const line = document.createElement('div');
    line.className = 'line ' + cls;
    out.appendChild(line);
    for (const ch of text) {
      if (fast) { line.textContent = text; break; }
      line.textContent += ch;
      scroll();
      await sleep(14);
      alive();
    }
    scroll();
  }

  function choose(q) {
    const box = document.createElement('div');
    box.className = 'options';
    box.innerHTML = q.options.map((o, i) => `<button><b>[${i + 1}]</b> ${esc(o.text)}</button>`).join('');
    out.appendChild(box);
    scroll();
    const buttons = [...box.children];
    return new Promise(resolve => {
      const pick = i => {
        onKey = null;
        buttons.forEach((b, j) => { b.disabled = true; b.classList.toggle('picked', i === j); });
        resolve(i);
      };
      buttons.forEach((b, i) => b.addEventListener('click', e => { e.stopPropagation(); pick(i); }));
      onKey = e => { const n = +e.key; if (n >= 1 && n <= q.options.length) pick(n - 1); };
    });
  }

  try {
    await say('$ npx whoami-vibe', 'cmd');
    await say('scanning your vibes...', 'dim');
    await say(`${QUESTIONS.length} questions. no wrong answers. only embarrassing ones.`, 'dim');
    await sleep(400);

    for (const [i, q] of QUESTIONS.entries()) {
      document.getElementById('term-title').textContent = `whoami-vibe — ${i + 1}/${QUESTIONS.length}`;
      document.getElementById('progress').style.width = (i / QUESTIONS.length * 100) + '%';
      out.appendChild(document.createElement('br'));
      await say('$ ' + q.cmd, 'cmd');
      await say(`[${i + 1}/${QUESTIONS.length}] ${q.q}`, 'q');
      const o = q.options[await choose(q)];
      alive();
      fast = reduceMotion;
      for (const [k, v] of Object.entries(o.t)) scores[k] = (scores[k] || 0) + v;
      await say('→ ' + o.r, 'reply');
      await sleep(350);
    }

    document.getElementById('progress').style.width = '100%';
    const { winner, traits } = evaluate(scores);
    out.appendChild(document.createElement('br'));
    for (const l of ['$ analyze --brutal', 'reading commit history... found "pls work" (x14)', 'counting tests... 0', 'measuring token usage... concerning', 'asking the AI about you... it sighed']) {
      await say(l, l.startsWith('$') ? 'cmd' : 'dim');
      await sleep(250);
    }
    await say(`match found: ${TYPES[winner].name} ${TYPES[winner].emoji}`, 'result');

    const go = () => { location.hash = `#/result/${winner}/${traits.join('-')}`; };
    const btn = document.createElement('button');
    btn.className = 'open-report';
    btn.textContent = '[enter] open full report →';
    btn.addEventListener('click', go);
    out.appendChild(btn);
    scroll();
    btn.focus({ preventScroll: true });
    onKey = e => { if (e.key === 'Enter') go(); };
  } catch (e) {
    if (e !== 'cancelled') throw e;
  }
}

// Normalize by the max points each type can get, so types that appear in fewer answers aren't disadvantaged.
function evaluate(scores) {
  const max = {};
  for (const q of QUESTIONS) {
    const best = {};
    for (const o of q.options) for (const [k, v] of Object.entries(o.t)) best[k] = Math.max(best[k] || 0, v);
    for (const [k, v] of Object.entries(best)) max[k] = (max[k] || 0) + v;
  }
  const norm = {};
  for (const k in TYPES) norm[k] = (scores[k] || 0) / max[k];
  const winner = Object.keys(TYPES).sort((a, b) => norm[b] - norm[a] || (scores[b] || 0) - (scores[a] || 0))[0];

  // Personal trait bars: type profiles weighted by how strongly each type matched.
  let total = 0;
  const sum = [0, 0, 0, 0];
  for (const k in TYPES) {
    const w = norm[k] ** 2;
    total += w;
    TYPES[k].traits.forEach((v, i) => { sum[i] += w * v; });
  }
  return { winner, traits: sum.map(s => Math.round(total ? s / total : 50)) };
}

// ---------- Type / result page ----------

function typePage(id, you) {
  const t = TYPES[id];
  const g = GROUPS[t.group];
  const enemy = TYPES[t.enemy];
  const traits = you || t.traits;
  document.title = `${t.name} · Vibe Coder Test`;

  const bars = AXES.map(([l, r], i) => {
    const v = traits[i];
    const left = v >= 50;
    return `
      <div class="axis">
        <div class="axis-label"><b>${left ? v : 100 - v}%</b> ${left ? l : r}</div>
        <div class="bar" style="--v:${v}%"><i></i></div>
        <div class="axis-poles"><span class="${left ? 'on' : ''}">${l}</span><span class="${left ? '' : 'on'}">${r}</span></div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <header class="type-hero ${g.color}">
      <a class="back" href="#/">← All types</a>
      <div class="figure" aria-hidden="true">${t.emoji}</div>
      <p class="eyebrow">${you ? 'You are' : g.name}</p>
      <h1>${t.name}</h1>
      <p class="tagline">${esc(t.tagline)}</p>
    </header>
    <main class="wrap type-page ${g.color}">
      <section class="panel">
        <h2>${you ? 'Your vibe profile' : 'Vibe profile'}</h2>
        ${bars}
      </section>
      <section class="panel">
        <h2>The roast</h2>
        <p class="roast">${esc(t.roast)}</p>
      </section>
      <div class="two">
        <section class="panel">
          <h2>Strengths (allegedly)</h2>
          <ul>${t.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        </section>
        <section class="panel">
          <h2>Weaknesses</h2>
          <ul>${t.weaknesses.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        </section>
      </div>
      <section class="panel quote">
        <h2>What your AI really thinks</h2>
        <blockquote>${esc(t.aiSays)}</blockquote>
      </section>
      <div class="two">
        <section class="panel">
          <h2>Famous last words</h2>
          <p class="mono">"${esc(t.lastWords)}"</p>
        </section>
        <a class="panel enemy ${GROUPS[enemy.group].color}" href="#/type/${t.enemy}">
          <h2>Natural enemy</h2>
          <p><span class="avatar">${enemy.emoji}</span><strong>${enemy.name}</strong></p>
          <p>${esc(t.enemyWhy)}</p>
        </a>
      </div>
      <div class="actions">
        ${you ? `<button class="btn" id="share">Copy link to my result</button><a class="btn ghost" href="#/test">Retake test</a>`
              : `<a class="btn" href="#/test">Take the test →</a>`}
        <a class="btn ghost" href="#/">See all 15 types</a>
      </div>
    </main>
    ${footer()}`;

  const share = document.getElementById('share');
  if (share) share.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: `I'm ${t.name}`, text: `I'm ${t.name}. ${t.tagline}`, url: location.href });
      else { await navigator.clipboard.writeText(location.href); share.textContent = 'Copied!'; }
    } catch (e) { /* share sheet dismissed */ }
  });
}
