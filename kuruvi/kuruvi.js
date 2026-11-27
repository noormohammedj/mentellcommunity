/* =====================================================================
   Kuruvi, the live sparrow companion (v1, 27 Nov 2026)
   A real house sparrow (cut out of Mentell's own trap clip) that lives on the page:
   it sits, looks around, chirps, hops, flies between things on screen, follows what
   you tap, and lives in a brass cage that holds one padlock per loan.

   Use on a page:
     <script src="/kuruvi/kuruvi.js?v=1" data-lang="ta|en|hi" defer></script>
   API (all optional, safe to call before the script loads: calls are no-ops):
     Kuruvi.screen(el)          new screen is showing; el = its heading or section
     Kuruvi.locks(n)            padlocks on the cage (one per loan)
     Kuruvi.cage(true|false)    put Kuruvi in the cage / let it out
     Kuruvi.freedom(0..1)       share of the loan paid: locks fall off, 1 = flies home
     Kuruvi.cheer()             a saving was logged: song + a lap of the screen
     Kuruvi.look(el)            hop over to something the person just touched
     Kuruvi.say(text)           short speech bubble
   No libraries. Sprites are WebP strips drawn on one canvas; sounds are short clips
   from the same footage plus Web Audio, muted until the first tap (browser rule).
   ===================================================================== */
(function () {
  'use strict';
  if (window.Kuruvi && window.Kuruvi.v) return;
  var me = document.currentScript;
  var BASE = (me && me.src) ? me.src.replace(/kuruvi\.js.*$/, '') : '/kuruvi/';
  var LANG = (me && me.getAttribute('data-lang')) || document.documentElement.lang.slice(0, 2) || 'ta';
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function track(ev, p) { try { if (typeof gtag === 'function') gtag('event', ev, p || {}); } catch (e) {} }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- sprite sheets (cell size, frame count, feet anchor in the cell) ---------- */
  var SETS = {
    perch:   { src: 'perch.webp',   w: 140, h: 225, n: 33, ax: 70,  ay: 210 },
    takeoff: { src: 'takeoff.webp', w: 300, h: 255, n: 15, ax: 170, ay: 240 },
    fly:     { src: 'fly.webp',     w: 230, h: 230, n: 18, ax: 115, ay: 170 }   // ay: where the feet hang
  };
  var SCALE = 0.34;  // cell px -> css px (bird ~72px tall when sitting)

  /* ---------- words ---------- */
  var W = {
    ta: { hi: ['Vanakkam! Naan Kuruvi.', 'Vaanga, sendhu veliya varalaam.'],
          tap: ['Hehe, kooch-am!', 'Naan inga dhaan irukken.', 'Chiv chiv!'],
          lock: 'Innoru poottu…', caged: ['Save pannunga, naan veliya varen.', 'Kadhavu thirakkanum…'],
          free: 'Inniku save pannineenga! Naan veliya!', home: 'Ellaa loanum mudinjudhu! Naan veettukku!',
          snd: 'Sound', mute: 'Mute' },
    en: { hi: ['Hi! I\'m Kuruvi.', 'Let\'s get out of this together.'],
          tap: ['Hehe, that tickles!', 'I\'m right here.', 'Cheep cheep!'],
          lock: 'Another lock…', caged: ['Save something and I get out.', 'The door is still shut…'],
          free: 'You saved today! I\'m out!', home: 'Every loan is closed! I\'m flying home!',
          snd: 'Sound', mute: 'Mute' },
    hi: { hi: ['नमस्ते! मैं कुरुवी हूँ।', 'चलो साथ में बाहर निकलें।'],
          tap: ['हीही, गुदगुदी!', 'मैं यहीं हूँ।', 'चीं चीं!'],
          lock: 'एक और ताला…', caged: ['कुछ बचाइए, मैं बाहर आऊँगी।', 'दरवाज़ा अभी बंद है…'],
          free: 'आज आपने बचाया! मैं बाहर!', home: 'सारे लोन खत्म! मैं घर चली!',
          snd: 'Sound', mute: 'Mute' }
  };
  var T = W[LANG] || W.ta;

  /* ---------- styles ---------- */
  var css = '' +
    '.kv-layer{position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden}' +
    '.kv-bird{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;will-change:transform;-webkit-tap-highlight-color:transparent;filter:drop-shadow(0 6px 5px rgba(42,35,29,.18))}' +
    '.kv-shadow{position:absolute;left:0;top:0;width:46px;height:8px;margin-left:-23px;margin-top:-4px;border-radius:50%;background:rgba(42,35,29,.22);filter:blur(3px);opacity:0;transition:opacity .25s}' +
    '.kv-cage{position:absolute;width:96px;height:122px;pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.kv-cage svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}' +
    '.kv-cage{z-index:1}.kv-cage-f{z-index:3;pointer-events:none}' +
    '.kv-cage.rattle svg{animation:kvRat .42s;transform-origin:50% 100%}' +
    '@keyframes kvRat{20%{transform:rotate(-3deg)}45%{transform:rotate(2.5deg)}70%{transform:rotate(-1.5deg)}}' +
    '.kv-door{transition:transform .7s cubic-bezier(.3,1.4,.5,1);transform-origin:33px 0;transform-box:view-box}' +
    '.kv-cage.open .kv-door{transform:scaleX(-.35) skewY(-8deg)}' +
    '.kv-lock{transition:transform .6s cubic-bezier(.5,0,.8,.4),opacity .6s}' +
    '.kv-lock.fall{transform:translateY(90px) rotate(40deg);opacity:0}' +
    '.kv-lock.new{animation:kvLock .5s cubic-bezier(.3,1.6,.5,1)}' +
    '@keyframes kvLock{from{transform:translateY(-30px);opacity:0}}' +
    '.kv-say{position:absolute;max-width:210px;background:#2A231D;color:#F4EEE3;font:600 14px/1.3 Archivo,system-ui,sans-serif;padding:9px 12px;pointer-events:none;opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s;white-space:normal}' +
    '.kv-say.on{opacity:1;transform:none}' +
    '.kv-say:after{content:"";position:absolute;bottom:-6px;left:var(--tail,24px);border:6px solid transparent;border-bottom:0;border-top-color:#2A231D}' +
    '.kv-snd{position:absolute;left:0;top:0;pointer-events:auto;appearance:none;width:28px;height:28px;border-radius:50%;border:1.5px solid #2A231D;background:#F4EEE3;color:#2A231D;display:grid;place-items:center;padding:0;cursor:pointer;z-index:6}' +
    '.kv-snd svg{width:15px;height:15px}' +
    '.kv-snd[aria-pressed="false"]{background:#2A231D;color:#F4EEE3}' +
    '@media (prefers-reduced-motion:reduce){.kv-door,.kv-lock{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- cage drawing (brass wire; back half, then front half over the bird) ---------- */
  function cageSVG(front) {
    var bars = '', x, n = 9;
    for (var i = 0; i < n; i++) {
      x = 12 + i * (94 / (n - 1));
      var isFront = (i % 2 === 0);
      if (isFront !== front) continue;
      if (front && i === 4) continue;                 // door gap
      bars += '<path d="M' + x.toFixed(1) + ' 132 V48 Q' + (59 + (x - 59) * .55).toFixed(1) + ' 14 59 10" fill="none" stroke="url(#kvB' + (front ? 'f' : 'b') + ')" stroke-width="' + (front ? 1.9 : 1.2) + '" stroke-linecap="round" opacity="' + (front ? 1 : .55) + '"/>';
    }
    var g = '<defs><linearGradient id="kvB' + (front ? 'f' : 'b') + '" x1="0" x2="1"><stop offset="0" stop-color="#6E4F22"/><stop offset=".45" stop-color="#D9B46A"/><stop offset="1" stop-color="#7A5A28"/></linearGradient>' +
      '<linearGradient id="kvP' + (front ? 'f' : 'b') + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#C79A4B"/><stop offset="1" stop-color="#6A4A1E"/></linearGradient></defs>';
    if (!front) {
      return '<svg viewBox="0 0 118 150" aria-hidden="true">' + g +
        '<ellipse cx="59" cy="145" rx="52" ry="4" fill="rgba(42,35,29,.18)"/>' +
        bars +
        '<path d="M14 102 H104" stroke="#8A6A32" stroke-width="2.2" opacity=".5"/>' +   // perch stick (back)
        '</svg>';
    }
    return '<svg class="kv-front" viewBox="0 0 118 150" aria-hidden="true">' + g +
      '<circle cx="59" cy="6" r="5" fill="none" stroke="url(#kvPf)" stroke-width="2.2"/>' +
      bars +
      '<path d="M12 48 Q59 30 106 48" fill="none" stroke="url(#kvPf)" stroke-width="2.4"/>' +
      '<path d="M12 90 H106" stroke="url(#kvPf)" stroke-width="1.4" opacity=".8"/>' +
      '<rect x="6" y="130" width="106" height="12" rx="1.5" fill="url(#kvPf)"/>' +
      '<rect x="6" y="140" width="106" height="3" fill="#4E3714"/>' +
      '<g class="kv-door"><rect x="33" y="62" width="52" height="68" fill="none" stroke="url(#kvPf)" stroke-width="2"/>' +
        '<path d="M46 62 V130 M59 62 V130 M72 62 V130" stroke="url(#kvPf)" stroke-width="1.6"/></g>' +
      '<g class="kv-locks"></g>' +
      '</svg>';
  }
  function lockSVG(x, y) {
    return '<g class="kv-lock new" transform="translate(' + x + ' ' + y + ')"><g>' +
      '<path d="M-5 0 V-5 A5 5 0 0 1 5 -5 V0" fill="none" stroke="#2A231D" stroke-width="2"/>' +
      '<rect x="-7.5" y="-1" width="15" height="12" rx="1.5" fill="#2A231D"/>' +
      '<circle cx="0" cy="4" r="1.6" fill="#D9B46A"/></g></g>';
  }

  /* ---------- sound ---------- */
  var AC = null, master = null, bufs = {}, muted = lsGet('mf_mute') === '1', unlocked = false;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .9; master.connect(AC.destination); } catch (e) { return null; } }
    return AC;
  }
  function loadSounds() {
    if (!ac()) return;
    ['k1', 'k2', 'k3', 'k4', 'k5'].forEach(function (k) {
      if (bufs[k]) return; bufs[k] = 'loading';
      fetch(BASE + k + '.mp3').then(function (r) { return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (res, rej) { AC.decodeAudioData(b, res, rej); }); })
        .then(function (d) { bufs[k] = d; }).catch(function () { bufs[k] = null; });
    });
  }
  function canPlay() { return !muted && unlocked && ac(); }
  function clip(k, rate, gain, when) {
    if (!canPlay() || !bufs[k] || bufs[k] === 'loading') return false;
    var s = AC.createBufferSource(), g = AC.createGain();
    s.buffer = bufs[k]; s.playbackRate.value = rate || 1; g.gain.value = gain == null ? 1 : gain;
    s.connect(g).connect(master); s.start(AC.currentTime + (when || 0)); return true;
  }
  function cheep(t, f, len, p) {   // synthetic house-sparrow "chirrup" (fallback + sparkle)
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + len * .35); o.frequency.exponentialRampToValueAtTime(f * .8, t + len);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(p, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(g).connect(master); o.start(t); o.stop(t + len + .03);
  }
  var SND = {
    chirp: function (n) {
      if (!canPlay()) return;
      if (!clip(pick(['k1', 'k2', 'k3', 'k4']), rnd(.95, 1.12), .9)) {
        var t = AC.currentTime + .02; for (var i = 0; i < (n || 3); i++) { var L = rnd(.06, .11); cheep(t, rnd(3200, 4100), L, .22); t += L + rnd(.05, .12); }
      }
    },
    song: function () {
      if (!canPlay()) return;
      clip('k1', 1.05, .9); clip('k3', 1.12, .8, .45); clip('k4', 1, .8, .95);
      var t = AC.currentTime + 1.5; for (var i = 0; i < 6; i++) { cheep(t, 3600 + (i % 2) * 600, .07, .14); t += .13; }
    },
    sad: function () { if (canPlay() && !clip('k2', .82, .7)) { var t = AC.currentTime + .02; cheep(t, 2600, .16, .16); cheep(t + .3, 2300, .2, .14); } },
    flap: function () {
      if (!canPlay()) return;
      if (clip('k5', rnd(.95, 1.1), .55)) return;
      var b = AC.createBuffer(1, AC.sampleRate * .4, AC.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.max(0, Math.sin(i / d.length * Math.PI * 6)) * .5;
      var s = AC.createBufferSource(), f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; s.buffer = b; s.connect(f).connect(master); s.start();
    },
    clink: function () {
      if (!canPlay()) return; var t = AC.currentTime + .02;
      [2093, 3136, 4186].forEach(function (f, i) { var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.07 / (i + 1), t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .5); o.connect(g).connect(master); o.start(t); o.stop(t + .55); });
    },
    unlock: function () {
      if (!canPlay()) return; var t = AC.currentTime;
      [523.25, 783.99, 1046.5].forEach(function (f, i) { var o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + i * .11); g.gain.exponentialRampToValueAtTime(.08, t + i * .11 + .01); g.gain.exponentialRampToValueAtTime(.0001, t + i * .11 + .6); o.connect(g).connect(master); o.start(t + i * .11); o.stop(t + i * .11 + .65); });
    }
  };
  function unlockAudio() {
    if (unlocked) return; unlocked = true;
    if (ac()) { try { AC.resume(); } catch (e) {} loadSounds(); }
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, unlockAudio, { once: true, passive: true, capture: true }); });

  /* ---------- DOM ---------- */
  var layer, canvas, ctx, shadow, cageEl, cageFront, bubble, sndBtn, IMG = {}, ready = false;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  function build() {
    layer = document.createElement('div'); layer.className = 'kv-layer'; layer.setAttribute('aria-hidden', 'true');
    cageEl = document.createElement('div'); cageEl.className = 'kv-cage';
    cageEl.innerHTML = cageSVG(false);
    cageFront = document.createElement('div'); cageFront.className = 'kv-cage kv-cage-f'; cageFront.innerHTML = cageSVG(true);
    shadow = document.createElement('div'); shadow.className = 'kv-shadow';
    canvas = document.createElement('canvas'); canvas.className = 'kv-bird';
    ctx = canvas.getContext('2d');
    bubble = document.createElement('div'); bubble.className = 'kv-say';
    sndBtn = document.createElement('button'); sndBtn.type = 'button'; sndBtn.className = 'kv-snd';
    layer.appendChild(cageEl); layer.appendChild(shadow); layer.appendChild(canvas); layer.appendChild(cageFront); layer.appendChild(bubble); layer.appendChild(sndBtn);
    document.body.appendChild(layer);
    sndLabel();
    sndBtn.addEventListener('click', function (e) {
      e.stopPropagation(); unlockAudio(); muted = !muted; lsSet('mf_mute', muted ? '1' : '0'); sndLabel();
      if (!muted) SND.chirp(2); track('kv_sound', { on: !muted });
    });
    canvas.addEventListener('click', function (e) { e.stopPropagation(); onPoke(); });
    cageEl.addEventListener('click', function (e) { e.stopPropagation(); onCagePoke(); });
  }
  var ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function sndLabel() { sndBtn.innerHTML = muted ? ICON_OFF : ICON_ON; sndBtn.setAttribute('aria-pressed', String(!muted)); sndBtn.setAttribute('aria-label', muted ? T.snd : T.mute); sndBtn.title = muted ? T.snd : T.mute; }

  /* ---------- geometry ---------- */
  function vw() { return window.innerWidth; }
  function vh() { return window.innerHeight; }
  var BAR_SEL = (me && me.getAttribute('data-bar')) || 'nav.bar';
  function barEl() { var b = document.querySelector(BAR_SEL); return (b && getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().height) ? b : null; }
  function barTop() { var b = barEl(); return b ? b.getBoundingClientRect().top : vh() - 8; }
  /* the cage stands in the action bar's right end (the page leaves room for it), never over the content */
  var CK = 96 / 118;   // cage drawing units -> css px
  var cageBox = { x: 0, y: 0, w: 96, h: 122 };
  function placeCage() {
    var b = barEl(), maxW = Math.min(vw(), 560), right = (vw() - maxW) / 2 + 12, floor;
    if (b) { var r = b.getBoundingClientRect(); floor = r.bottom - (parseFloat(getComputedStyle(b).paddingBottom) || 12) + 2; }
    else floor = vh() - 10;
    cageBox.x = vw() - right - cageBox.w; cageBox.y = floor - cageBox.h;
    cageEl.style.transform = cageFront.style.transform = 'translate(' + cageBox.x + 'px,' + cageBox.y + 'px)';
    sndBtn.style.transform = 'translate(' + (cageBox.x - 34) + 'px,' + (floor - 42) + 'px)';
  }
  function cageFloor() { return { x: cageBox.x + 59 * CK, y: cageBox.y + 128 * CK }; }
  function cageRoof() { return { x: cageBox.x + 59 * CK, y: cageBox.y + 10 * CK }; }
  function cageDoor() { return { x: cageBox.x + 59 * CK, y: cageBox.y + 130 * CK }; }

  /* perch points: the top edge of an element, a little in from its right end */
  function perchOf(el, side) {
    if (!el || !el.getBoundingClientRect) return null;
    var r = el.getBoundingClientRect(); if (!r.width || !r.height) return null;
    var x;
    if (/^H[12]$/.test(el.tagName)) {     // end of the heading's last line
      var range = document.createRange(); range.selectNodeContents(el);
      var rs = range.getClientRects(); var last = rs[rs.length - 1] || r;
      x = Math.min(last.right + 34, r.right - 10); if (x > vw() - 40) x = last.right - 30;
      return { x: clamp(x, 40, vw() - 40), y: last.top + 6, el: el };
    }
    x = side === 'l' ? r.left + 34 : side === 'c' ? r.left + r.width / 2 : r.right - 36;
    return { x: clamp(x, 40, vw() - 40), y: r.top + 1, el: el };
  }
  function visible(p) { return p && p.y > 110 && p.y < barTop() + 2 && p.x > 20 && p.x < vw() - 20; }

  /* ---------- the bird ---------- */
  var state = {
    set: 'perch', f: 0, dir: 1,          // frame, playback direction for perch ping-pong
    x: 0, y: 0, flip: false, s: SCALE,
    at: 'cage', perch: null,             // where it sits: 'cage' | 'roof' | 'el' | 'air'
    inCage: true, busy: false, hold: 0, nextIdle: 0, mood: 'calm',
    locks: 0, freedom: 0, wantCage: true, home: false
  };
  function setFrame(set, f, flip) {
    var S = SETS[set], img = IMG[set];
    if (!img || !img.complete) return;
    if (state.set !== set || !canvas.width) {
      canvas.width = Math.round(S.w * state.s * dpr); canvas.height = Math.round(S.h * state.s * dpr);
      canvas.style.width = (S.w * state.s) + 'px'; canvas.style.height = (S.h * state.s) + 'px';
    }
    state.set = set; state.f = f; state.flip = !!flip;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (flip) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, f * S.w, 0, S.w, S.h, 0, 0, canvas.width, canvas.height);
    place();
  }
  var squash = 1, lift = 0;
  function place() {
    var S = SETS[state.set], s = state.s;
    var ax = state.flip ? (S.w - S.ax) : S.ax;
    var tx = state.x - ax * s, ty = state.y - S.ay * s - lift;
    canvas.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)' + (squash !== 1 ? ' scale(' + (2 - squash).toFixed(3) + ',' + squash.toFixed(3) + ')' : '');
    canvas.style.transformOrigin = (ax * s) + 'px ' + (S.ay * s) + 'px';
    shadow.style.transform = 'translate(' + state.x.toFixed(1) + 'px,' + (state.y + 1).toFixed(1) + 'px) scale(' + (state.s / SCALE) + ')';
    canvas.style.zIndex = state.inCage ? 2 : 5;
  }
  function moveTo(x, y) { state.x = x; state.y = y; place(); }

  /* ---------- tiny animation helpers ---------- */
  function tween(ms, fn) {
    return new Promise(function (res) {
      if (reduced) { fn(1); res(); return; }
      var t0 = performance.now();
      (function step(t) { var k = Math.min(1, (t - t0) / ms); fn(k); if (k < 1) requestAnimationFrame(step); else res(); })(t0);
    });
  }
  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function playFrames(set, from, to, fps, flip, onEach) {
    var n = Math.abs(to - from) + 1, d = to >= from ? 1 : -1;
    return tween(n * 1000 / fps, function (k) {
      var i = from + d * Math.min(n - 1, Math.floor(k * n)); setFrame(set, i, flip); if (onEach) onEach(k);
    });
  }

  /* chirp: real clip + a little bob of the body */
  function chirp(n) {
    SND.chirp(n);
    return tween(420, function (k) { squash = 1 - Math.sin(k * Math.PI * 3) * .035 * (1 - k); place(); }).then(function () { squash = 1; place(); });
  }

  /* hop: a short jump along a perch (or to a near spot) */
  function hop(x, y) {
    var x0 = state.x, y0 = state.y, h = 18 + Math.abs(x - x0) * .12;
    shadow.style.opacity = '1';
    return tween(330, function (k) {
      state.x = x0 + (x - x0) * k; state.y = y0 + (y - y0) * k; lift = Math.sin(k * Math.PI) * h;
      squash = k < .12 ? 1 - k * .5 : k > .88 ? 1 - (1 - k) * .5 : 1.03;
      if (k > .15 && k < .85) setFrame('takeoff', k < .5 ? 2 : 4, x < x0); else setFrame('perch', 0, false);
    }).then(function () { lift = 0; squash = .92; place(); return tween(140, function (k) { squash = .92 + .08 * k; place(); }); })
      .then(function () { squash = 1; shadow.style.opacity = state.inCage ? '0' : '.9'; setFrame('perch', 0, false); });
  }

  /* fly: take off, arc across the screen, land */
  function fly(to, opts) {
    opts = opts || {};
    var x0 = state.x, y0 = state.y, x1 = to.x, y1 = to.y;
    var right = x1 >= x0, flip = !right;
    var dist = Math.hypot(x1 - x0, y1 - y0);
    var s0 = state.s, s1 = opts.scale || SCALE;
    state.busy = true; state.at = 'air'; hideSay();
    shadow.style.opacity = '0';
    SND.flap();
    if (Math.random() < .5) SND.chirp(2);
    // take-off: frames 0..14 while rising a little
    return playFrames('takeoff', 0, 8, 26, flip, function (k) { lift = k * 10; place(); })
      .then(function () {
        lift = 0;
        var ms = clamp(dist * 1.7, 520, 1500) / (opts.fast ? 1.5 : 1);
        var cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - clamp(dist * .35, 40, 160);
        var fi = 3;
        return tween(ms, function (k) {
          var e = ease(k), a = 1 - e;
          state.x = a * a * x0 + 2 * a * e * cx + e * e * x1;
          state.y = a * a * (y0 - 10) + 2 * a * e * cy + e * e * y1;
          state.s = s0 + (s1 - s0) * e;
          fi = (fi + 1) % 18; if (fi < 3) fi = 3;      // frames 3..17 are a clean wing cycle
          setFrame('fly', fi, flip);
        });
      })
      .then(function () { return playFrames('takeoff', 8, 0, 30, flip); })
      .then(function () {
        state.s = s1; squash = .9; setFrame('perch', 0, false);
        return tween(160, function (k) { squash = .9 + .1 * k; place(); });
      })
      .then(function () { squash = 1; place(); state.busy = false; shadow.style.opacity = state.inCage ? '0' : '.9'; });
  }

  /* ---------- idle life: breathe, look around, chirp, hop ---------- */
  var idleF = 0, idleDir = 1, lastT = 0, acc = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    if (!ready) return;
    var dt = Math.min(100, t - (lastT || t)); lastT = t;
    if (state.busy) return;
    // follow the element it sits on (scroll, layout changes)
    if (state.at === 'el' && state.perch && state.perch.el) {
      var p = perchOf(state.perch.el, state.perch.side);
      if (!p || !document.contains(state.perch.el) || !visible(p)) { goHome(); return; }
      if (Math.abs(p.x - state.x) > .5 || Math.abs(p.y - state.y) > .5) moveTo(p.x, p.y);
    }
    // perch loop: 12 fps ping-pong with pauses (the clip has head turns built in)
    acc += dt;
    if (state.hold > 0) { state.hold -= dt; return; }
    if (acc > 1000 / 12) {
      acc = 0;
      idleF += idleDir;
      if (idleF >= 32) { idleF = 32; idleDir = -1; state.hold = rnd(300, 1400); }
      if (idleF <= 0) { idleF = 0; idleDir = 1; state.hold = rnd(500, 2200); }
      if (idleF === 16 && Math.random() < .3) state.hold = rnd(400, 1200);
      setFrame('perch', idleF, false);
    }
    if (t > state.nextIdle) { state.nextIdle = t + rnd(5000, 11000); idleAct(); }
  }
  function idleAct() {
    if (state.busy || document.hidden) return;
    var r = Math.random();
    if (state.inCage) {
      if (r < .45) { flutterInCage(); return; }
      if (r < .75) { chirp(2); return; }
      hopInCage(); return;
    }
    if (r < .35) { chirp(3); return; }
    if (r < .6 && state.at === 'el') {   // shuffle along the perch
      var el = state.perch && state.perch.el; if (!el) return;
      var rr = el.getBoundingClientRect(); var nx = clamp(state.x + rnd(-60, 60), rr.left + 24, rr.right - 24);
      state.busy = true; hop(nx, state.y).then(function () { state.busy = false; state.perch.side = 'x'; state.perch.fx = nx - rr.left; }); return;
    }
    if (r < .8) { wander(); return; }
  }
  // remember an exact x on a perch after a shuffle
  var _perchOf = perchOf;
  perchOf = function (el, side) {
    if (side === 'x' && state.perch && state.perch.el === el && state.perch.fx != null) {
      var r = el.getBoundingClientRect(); if (!r.width) return null;
      return { x: clamp(r.left + state.perch.fx, 30, vw() - 30), y: r.top + 1, el: el };
    }
    return _perchOf(el, side);
  };

  /* candidate perches on the current screen */
  function perches() {
    var out = [], scr = document.querySelector('.scr.on') || document.body;
    var h = scr.querySelector('h1,h2'); if (h) out.push(h);
    [].slice.call(scr.querySelectorAll('.big,.card,.tile[aria-pressed="true"],.btn,.callout,.pw-price')).slice(0, 6).forEach(function (e) { out.push(e); });
    var nx = document.getElementById('next'); if (nx && nx.offsetParent) out.push(nx);
    return out.filter(function (e) { return visible(perchOf(e)); });
  }
  function wander() {
    var c = perches().filter(function (e) { return !state.perch || e !== state.perch.el; });
    if (!c.length) { if (state.at !== 'roof') goRoof(); return; }
    land(pick(c), pick(['r', 'l', 'c']));
  }
  function land(el, side) {
    var p = perchOf(el, side || 'r'); if (!visible(p)) return Promise.resolve();
    return fly(p).then(function () { state.at = 'el'; state.perch = { el: el, side: side || 'r' }; });
  }
  function goRoof() {
    return fly(cageRoof()).then(function () { state.at = 'roof'; state.perch = null; });
  }
  function goHome() { if (state.inCage) return; goRoof(); }

  /* ---------- in the cage ---------- */
  var IN_SCALE = 0.22;
  function sitInCage() {
    state.inCage = true; state.at = 'cage'; state.perch = null; state.s = IN_SCALE;
    var f = cageFloor(); moveTo(f.x + rnd(-6, 6), f.y - 20); shadow.style.opacity = '0'; setFrame('perch', 0, false);
  }
  function flutterInCage() {
    if (state.busy) return; state.busy = true;
    var y0 = state.y, flip = Math.random() < .5;
    SND.flap(); if (state.locks) setTimeout(SND.clink, 180);
    [cageEl, cageFront].forEach(function (c) { c.classList.remove('rattle'); void c.offsetWidth; c.classList.add('rattle'); });
    playFrames('takeoff', 0, 12, 28, flip, function (k) { lift = Math.sin(k * Math.PI) * 22; place(); })
      .then(function () { return playFrames('takeoff', 12, 0, 34, flip); })
      .then(function () { lift = 0; setFrame('perch', 0, false); state.y = y0; place(); state.busy = false; if (Math.random() < .6) SND.sad(); });
  }
  function hopInCage() {
    if (state.busy) return; state.busy = true;
    var f = cageFloor(); hop(clamp(state.x + rnd(-18, 18), f.x - 20, f.x + 20), state.y).then(function () { state.busy = false; });
  }
  function letOut() {
    if (!state.inCage) return Promise.resolve();
    cageEl.classList.add('open'), cageFront.classList.add('open'); SND.unlock();
    state.busy = true;
    var d = cageDoor();
    return sleep(450).then(function () { return hop(d.x, state.y); })
      .then(function () { state.inCage = false; state.busy = false; return fly(cageRoof(), { scale: SCALE }); })
      .then(function () { state.at = 'roof'; chirp(3); });
  }
  function shutIn() {
    if (state.inCage) return Promise.resolve();
    var f = cageFloor();
    return fly({ x: f.x, y: f.y - 20 }, { scale: IN_SCALE }).then(function () {
      sitInCage(); cageEl.classList.remove('open'), cageFront.classList.remove('open'); setTimeout(SND.clink, 200);
    });
  }

  /* ---------- reactions ---------- */
  var pokes = 0;
  function onPoke() {
    unlockAudio(); track('kv_poke', { where: state.at });
    if (state.busy) return;
    if (state.inCage) { onCagePoke(); return; }
    pokes++;
    if (pokes % 3 === 0) { wander(); return; }
    say(pick(T.tap)); chirp(3);
    if (Math.random() < .5) { state.busy = true; hop(state.x + rnd(-30, 30), state.y).then(function () { state.busy = false; }); }
  }
  function onCagePoke() {
    unlockAudio();
    if (!state.inCage) { if (!state.busy && state.at !== 'roof') goRoof(); return; }
    flutterInCage(); say(pick(T.caged), true);
  }

  var sayTimer = 0;
  function say(text, atCage) {
    if (!text) return;
    bubble.textContent = text; bubble.classList.remove('on'); void bubble.offsetWidth;
    var bw = Math.min(210, Math.max(120, text.length * 7.2));
    var bx = atCage ? cageBox.x + 30 - bw : state.x - bw + 30;
    var by = (atCage ? cageBox.y : state.y - 95 * (state.s / SCALE)) - 52;
    bx = clamp(bx, 10, vw() - bw - 10); by = Math.max(70, by);
    bubble.style.width = bw + 'px'; bubble.style.left = bx + 'px'; bubble.style.top = by + 'px';
    bubble.style.setProperty('--tail', clamp((atCage ? cageBox.x + 40 : state.x) - bx - 6, 14, bw - 24) + 'px');
    bubble.classList.add('on');
    clearTimeout(sayTimer); sayTimer = setTimeout(hideSay, 2600 + text.length * 30);
  }
  function hideSay() { bubble.classList.remove('on'); }

  /* ---------- public API ---------- */
  var queue = Promise.resolve();
  function then(fn) { queue = queue.then(function () { return waitIdle(); }).then(fn).catch(function () {}); return queue; }
  function waitIdle() { return new Promise(function (r) { (function c() { if (!state.busy && ready) r(); else setTimeout(c, 80); })(); }); }

  var API = {
    v: 1,
    screen: function (el) {
      then(function () {
        if (state.inCage) { if (Math.random() < .5) chirp(2); return; }
        var h = el && (el.matches && el.matches('h1,h2') ? el : el.querySelector && el.querySelector('h1,h2'));
        if (h && visible(perchOf(h))) return land(h, 'r');
        return goRoof();
      });
    },
    look: function (el) {
      if (!el || state.inCage || state.busy) return;
      var p = perchOf(el, 'r'); if (!visible(p)) return;
      then(function () { return land(el, 'r').then(function () { if (Math.random() < .6) chirp(2); }); });
    },
    locks: function (n) {
      n = Math.max(0, Math.min(8, n | 0)); if (n === state.locks) return;
      var g = cageFront.querySelector('.kv-locks'), was = state.locks; state.locks = n;
      var html = ''; for (var i = 0; i < n; i++) html += lockSVG(16 + (i % 4) * 28 + (i >= 4 ? 14 : 0), 104 - Math.floor(i / 4) * 18);
      g.innerHTML = html;
      [].slice.call(g.querySelectorAll('.kv-lock')).forEach(function (l, i) { if (i < was) l.classList.remove('new'); });
      if (n > was && ready) { SND.clink(); if (!state.inCage) say(T.lock); }
    },
    freedom: function (f) {
      f = clamp(+f || 0, 0, 1); state.freedom = f;
      if (f >= 1 && !state.home) { state.home = true; then(flyHome); }
    },
    cage: function (on) {
      state.wantCage = !!on;
      then(function () { return on ? shutIn() : letOut(); });
    },
    cheer: function () {
      track('kv_cheer');
      then(function () {
        var p = state.inCage ? letOut().then(function () { say(T.free); }) : Promise.resolve();
        return p.then(function () {
          SND.song();
          var a = { x: vw() * .25, y: vh() * .3 }, b = { x: vw() * .75, y: vh() * .22 };
          return fly(a, { fast: true }).then(function () { return fly(b, { fast: true }); }).then(goRoof).then(function () { return chirp(3); });
        });
      });
    },
    say: function (t) { then(function () { say(t); }); },
    enter: function () {   // arrive from off-screen (after the intro clip)
      then(function () {
        state.inCage = false; cageEl.classList.add('open'), cageFront.classList.add('open'); state.s = SCALE;
        moveTo(-60, vh() * .25);
        var h = document.querySelector('.scr.on h1, .scr.on h2');
        var p = h && perchOf(h); var tgt = visible(p) ? p : cageRoof();
        return fly(tgt).then(function () { if (h && tgt === p) { state.at = 'el'; state.perch = { el: h, side: 'r' }; } else state.at = 'roof'; say(pick(T.hi)); chirp(3); });
      });
    }
  };
  function flyHome() {
    say(T.home); SND.song();
    var p = state.inCage ? letOut() : Promise.resolve();
    return p.then(function () { return fly({ x: vw() + 80, y: -40 }, { fast: true }); })
      .then(function () { return sleep(4000); })
      .then(function () { moveTo(vw() + 60, 120); return goRoof(); });
  }

  /* ---------- boot ---------- */
  function boot() {
    build();
    var left = 0;
    Object.keys(SETS).forEach(function (k) {
      left++;
      var im = new Image(); im.decoding = 'async';
      im.onload = function () { if (--left === 0) start(); };
      im.onerror = function () { layer.style.display = 'none'; };
      im.src = BASE + SETS[k].src; IMG[k] = im;
    });
    placeCage();
    window.addEventListener('resize', function () { placeCage(); if (state.inCage) sitInCage(); else if (state.at === 'roof') { var r = cageRoof(); moveTo(r.x, r.y); } });
  }
  function start() {
    ready = true;
    var startCaged = window.KURUVI_START_CAGED !== false;
    if (startCaged) sitInCage();
    else { state.inCage = false; cageEl.classList.add('open'), cageFront.classList.add('open'); state.s = SCALE; var r = cageRoof(); moveTo(r.x, r.y); state.at = 'roof'; setFrame('perch', 0, false); shadow.style.opacity = '.9'; }
    state.nextIdle = performance.now() + 3000;
    requestAnimationFrame(loop);
    // keep the cage glued to the action bar as screens change
    setInterval(placeCage, 700);
    (window.KURUVI_Q || []).forEach(function (c) { try { API[c[0]].apply(null, c[1]); } catch (e) {} });
  }
  window.Kuruvi = API;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
