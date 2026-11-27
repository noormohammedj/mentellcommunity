/* Mentell money pages: full-screen Kuruvi intro on the welcome screen.
   The sparrow flies into a "Loan trap" cage (with its sound), then "Click here to free me" plays the
   clip backwards (it flies out) and opens the calculator.
   Browsers never allow autoplay WITH sound until the visitor has touched the site, so it tries with
   sound first and, if that is refused, plays muted with a big "Tap for sound" that restarts it with sound.
   Used by /financial/ (ta), /en/ and /hi/: <script src="/financial/intro.js?v=1" data-lang="ta" defer></script> */
(function () {
  'use strict';
  var me = document.currentScript;
  var LANG = (me && me.dataset.lang) || 'ta';
  var M = '/financial/media/';
  var T = {
    ta: { sub: 'Kuruvi maadhiri neengalum loan trap-la maatikiteengala? Veliya varalaam.', free: 'Click here to free me', tap: 'Sound-ku tap pannunga', skip: 'Skip', on: 'Sound on', off: 'Sound off', caged: 'Kuruvi loan trap-la maatikichu' },
    en: { sub: 'Stuck in a loan trap like Kuruvi? Let\'s get you out.', free: 'Click here to free me', tap: 'Tap for sound', skip: 'Skip', on: 'Sound on', off: 'Sound off', caged: 'Kuruvi is stuck in the loan trap' },
    hi: { sub: 'क्या आप भी कुरुवी की तरह लोन के जाल में फँसे हैं? चलिए बाहर निकलें।', free: 'क्लिक करें, मुझे आज़ाद करें', tap: 'आवाज़ के लिए टैप करें', skip: 'छोड़ें', on: 'Sound on', off: 'Sound off', caged: 'कुरुवी लोन के जाल में फँस गई' }
  }[LANG] || null;
  if (!T) return;

  function track(n, p) { try { if (typeof window.gtag === 'function') window.gtag('event', n, Object.assign({ page: 'financial', lang: LANG }, p || {})); } catch (e) {} }
  function sfx(n, a) { try { var F = window.MentellFriends; if (F && F.sfx) F.sfx(n, a); } catch (e) {} }

  var CSS = '' +
    '.ki{position:fixed;inset:0;z-index:100;background:#15110D;color:#F4EEE3;overflow:hidden;font-family:var(--f,Archivo,system-ui,sans-serif);-webkit-tap-highlight-color:transparent;opacity:1;transition:opacity .45s}' +
    '.ki.out{opacity:0;pointer-events:none}' +
    '.ki-bg{position:absolute;inset:-40px;background:url(' + M + 'kuruvi-trap.jpg) center/cover;filter:blur(22px) brightness(.55);transform:scale(1.1)}' +
    '.ki-frame{position:absolute;left:50%;top:50%;transform-origin:50% 50%;transition:transform 1.1s cubic-bezier(.65,0,.25,1);background:#15110D url(' + M + 'kuruvi-trap.jpg) center/cover}' +
    '.ki-frame video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}' +
    '.ki-free{opacity:0;transition:opacity .15s}.ki.freeing .ki-free{opacity:1}' +
    '.ki-flash{position:absolute;inset:0;background:#F4EEE3;opacity:0;pointer-events:none}.ki.freeing .ki-flash{animation:kiFlash .5s ease-out}' +
    '@keyframes kiFlash{0%{opacity:.8}100%{opacity:0}}' +
    '.ki.shake .ki-frame video{animation:kiShake .45s}' +
    '@keyframes kiShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}' +
    '.ki-scrim{position:absolute;left:0;right:0;bottom:0;height:62%;background:linear-gradient(to top,rgba(21,17,13,.94) 0,rgba(21,17,13,.78) 38%,rgba(21,17,13,0) 100%);pointer-events:none;opacity:.35;transition:opacity .6s}' +
    '.ki.caged .ki-scrim{opacity:1}' +
    '.ki-topbar{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(12px + env(safe-area-inset-top)) 16px 12px;background:linear-gradient(to bottom,rgba(21,17,13,.6),rgba(21,17,13,0))}' +
    '.ki-brand{font-weight:800;font-stretch:125%;letter-spacing:-.02em;font-size:20px;color:#F4EEE3;text-decoration:none}' +
    '.ki-tools{display:flex;gap:8px}' +
    '.ki-chip{appearance:none;border:1.5px solid rgba(244,238,227,.7);background:rgba(21,17,13,.35);color:#F4EEE3;font:inherit;font-size:14px;font-weight:600;padding:8px 12px;min-height:40px;display:inline-flex;align-items:center;gap:6px;cursor:pointer}' +
    '.ki-chip svg{width:18px;height:18px}' +
    '.ki-tap{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);appearance:none;border:0;background:#F4EEE3;color:#2A231D;font:inherit;font-weight:800;font-size:17px;padding:14px 20px;display:flex;align-items:center;gap:10px;cursor:pointer;box-shadow:0 0 0 0 rgba(244,238,227,.6);animation:kiPulse 1.6s infinite;white-space:nowrap}' +
    '.ki-tap svg{width:24px;height:24px}' +
    '.ki-tap[hidden]{display:none}' +
    '@keyframes kiPulse{0%{box-shadow:0 0 0 0 rgba(244,238,227,.55)}100%{box-shadow:0 0 0 22px rgba(244,238,227,0)}}' +
    '.ki-bot{position:absolute;left:0;right:0;bottom:0;padding:0 20px calc(22px + env(safe-area-inset-bottom));max-width:620px;margin:0 auto}' +
    '.ki-h{font-weight:800;font-stretch:75%;letter-spacing:-.02em;line-height:.95;font-size:clamp(44px,13vw,84px);margin:0 0 8px;opacity:0;transform:translateY(16px);transition:opacity .5s,transform .5s}' +
    '.ki-sub{font-size:clamp(16px,4.4vw,20px);line-height:1.35;color:rgba(244,238,227,.86);margin:0 0 18px;max-width:30ch;opacity:0;transform:translateY(16px);transition:opacity .5s .12s,transform .5s .12s}' +
    '.ki.caged .ki-h,.ki.caged .ki-sub{opacity:1;transform:none}' +
    '.ki-free-btn{appearance:none;position:relative;overflow:hidden;width:100%;min-height:66px;padding:16px 18px;border:0;background:#2E6B4A;color:#fff;font:inherit;font-weight:800;font-stretch:100%;font-size:clamp(17px,5vw,22px);letter-spacing:.01em;text-transform:uppercase;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer;opacity:0;transform:translateY(24px) scale(.96);pointer-events:none;transition:opacity .4s .25s,transform .45s .25s cubic-bezier(.2,1.5,.4,1)}' +
    '.ki.caged .ki-free-btn{opacity:1;transform:none;pointer-events:auto}' +
    '.ki-free-btn::before{content:"";position:absolute;inset:5px;border:2px solid rgba(255,255,255,.75);pointer-events:none;animation:kiRing 1.4s ease-out infinite}' +
    '.ki-free-btn::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);transform:skewX(-18deg);animation:kiShine 2.2s ease-in-out infinite}' +
    '.ki-free-btn svg{flex:none;width:34px;height:34px;padding:4px;background:#F4EEE3;color:#2E6B4A;animation:kiLock 2.2s ease-in-out infinite}' +
    '.ki-free-btn.go .ki-shackle{transform:translate(0,-34px) rotate(-14deg);transform-origin:165px 80px;transition:transform .25s}' +
    '.ki-free-btn.go::before,.ki-free-btn.go::after,.ki-free-btn.go svg{animation:none}' +
    '@keyframes kiRing{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.03,1.25)}}' +
    '@keyframes kiShine{0%,55%{left:-60%}100%{left:130%}}' +
    '@keyframes kiLock{0%,70%,100%{transform:rotate(0)}74%{transform:rotate(-12deg)}78%{transform:rotate(10deg)}82%{transform:rotate(-8deg)}86%{transform:rotate(6deg)}90%{transform:rotate(0)}}' +
    '@media (min-width:900px) and (min-aspect-ratio:5/4){.ki-bot{left:6vw;right:auto;margin:0;padding-bottom:7vh;max-width:520px}.ki-scrim{height:100%;width:62%;right:auto;background:linear-gradient(to right,rgba(21,17,13,.9),rgba(21,17,13,0))}}' +
    '@media (prefers-reduced-motion:reduce){.ki-tap,.ki-free-btn::before,.ki-free-btn::after,.ki-free-btn svg{animation:none}.ki-frame{transition:none}}';

  var ICON_ON = '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M48 96h40l56-48v160l-56-48H48z" fill="currentColor"/><path d="M184 96a48 48 0 0 1 0 64M208 72a80 80 0 0 1 0 112" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="square"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M48 96h40l56-48v160l-56-48H48z" fill="currentColor"/><path d="M176 104l48 48M224 104l-48 48" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="square"/></svg>';
  var LOCK = '<svg viewBox="0 0 256 256" aria-hidden="true"><path class="ki-shackle" d="M88 112V80a40 40 0 0 1 77.5-14" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="square"/><rect x="40" y="112" width="176" height="112" fill="none" stroke="currentColor" stroke-width="20"/><rect x="118" y="148" width="20" height="40" fill="currentColor"/></svg>';

  function srcs(name) {
    var t = document.createElement('video');
    var av1 = t.canPlayType && t.canPlayType('video/webm; codecs="av01.0.04M.08, opus"');
    return M + name + (av1 ? '.webm' : '.mp4');
  }

  var started = false;
  function start() {
    if (started) return; started = true;
    var wl = document.querySelector('.scr[data-s="welcome"]');
    var h1 = document.getElementById('hWelcome');
    var cn = navigator.connection || {};
    var lite = !!(cn.saveData || /(^|-)2g$/.test(cn.effectiveType || '') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches));

    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var el = document.createElement('div');
    el.className = 'ki'; el.id = 'kIntro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', T.caged);
    el.innerHTML =
      '<div class="ki-bg"></div>' +
      '<div class="ki-frame"><video class="ki-v" playsinline webkit-playsinline preload="auto" disablepictureinpicture disableremoteplayback poster="' + M + 'kuruvi-trap.jpg"></video>' +
      '<video class="ki-free" muted playsinline webkit-playsinline preload="none" disablepictureinpicture disableremoteplayback aria-hidden="true"></video><i class="ki-flash"></i></div>' +
      '<div class="ki-scrim"></div>' +
      '<div class="ki-topbar"><span class="ki-brand">mentell</span><div class="ki-tools"><button type="button" class="ki-chip ki-snd"></button><button type="button" class="ki-chip ki-skip">' + T.skip + '</button></div></div>' +
      '<button type="button" class="ki-tap" hidden>' + ICON_ON + '<span>' + T.tap + '</span></button>' +
      '<div class="ki-bot"><h2 class="ki-h">' + (h1 ? h1.textContent : 'EMI?') + '</h2><p class="ki-sub">' + T.sub + '</p>' +
      '<button type="button" class="ki-free-btn">' + LOCK + '<span>' + T.free + '</span></button></div>';
    document.body.appendChild(el);
    var root = document.documentElement, prevOv = root.style.overflow; root.style.overflow = 'hidden';

    var frame = el.querySelector('.ki-frame'), v = el.querySelector('.ki-v'), fv = el.querySelector('.ki-free');
    var snd = el.querySelector('.ki-snd'), tap = el.querySelector('.ki-tap'), btn = el.querySelector('.ki-free-btn'), skip = el.querySelector('.ki-skip');
    var caged = false, zoomOut = false, busy = false, closed = false, played = false;

    /* the frame is sized to cover the screen; on tall screens it zooms out once the bird is caged so the whole cage shows */
    function layout() {
      var W = window.innerWidth, H = window.innerHeight, w = Math.max(W, H * 16 / 9), h = w * 9 / 16;
      frame.style.width = w + 'px'; frame.style.height = h + 'px';
      var tall = W / H < 1.25, s = 1, dy = 0;
      if (zoomOut && tall) { s = W / w; dy = -H * 0.1; }
      frame.style.transform = 'translate(-50%,-50%) translateY(' + dy + 'px) scale(' + s + ')';
    }
    layout(); window.addEventListener('resize', layout);

    function sndLabel() { snd.innerHTML = (v.muted ? ICON_OFF + T.off : ICON_ON + T.on); snd.setAttribute('aria-pressed', v.muted ? 'false' : 'true'); }
    function setCaged(why) {
      if (caged) return; caged = true; zoomOut = true; layout();
      el.classList.add('caged'); tap.hidden = true;
      track('mm_freeme_show', { why: why });
      if (!v.muted) sfx('clink');
    }
    function loadFree() { if (fv.src || lite) return; fv.src = srcs('kuruvi-free'); fv.preload = 'auto'; try { fv.load(); } catch (e) {} }
    function onPlay() { if (played) return; played = true; track('mm_intro_play', { sound: v.muted ? 'muted' : 'on' }); loadFree(); }

    if (lite) { v.removeAttribute('preload'); setCaged('lite'); sndLabel(); }
    else {
      v.src = srcs('kuruvi-trap');
      v.addEventListener('playing', onPlay);
      v.addEventListener('timeupdate', function () { if (v.currentTime >= 4.3) setCaged('caged'); });
      v.addEventListener('ended', function () { setCaged('ended'); });
      v.addEventListener('error', function () { setCaged('error'); });
      setTimeout(function () { if (!played) setCaged('slow'); }, 4000);   // weak signal: never hold them on a frozen frame
      setTimeout(function () { setCaged('timer'); }, 9500);
      v.muted = false;
      var p = v.play();
      var muteAndPlay = function () { v.muted = true; tap.hidden = false; sndLabel(); var q = v.play(); if (q && q.catch) q.catch(function () { setCaged('blocked'); }); };
      if (p && p.then) p.then(function () { sndLabel(); }, muteAndPlay); else sndLabel();
    }

    function soundOn() {
      if (!v.muted) return;
      v.muted = false; tap.hidden = true; sndLabel(); track('mm_intro_sound', { at: Math.round(v.currentTime * 10) / 10 });
      if (!caged || v.ended) { try { v.currentTime = 0; } catch (e) {} if (caged) { caged = false; zoomOut = false; el.classList.remove('caged'); layout(); } }
      var q = v.play(); if (q && q.catch) q.catch(function () {});
    }
    tap.addEventListener('click', function (e) { e.stopPropagation(); soundOn(); });
    snd.addEventListener('click', function (e) {
      e.stopPropagation();
      if (v.muted) { soundOn(); return; }
      v.muted = true; sndLabel();
    });
    /* tap anywhere on the picture: first tap turns the sound on; once caged, Kuruvi rattles the cage */
    el.addEventListener('click', function (e) {
      if (busy || e.target.closest('button')) return;
      if (v.muted && !lite) { soundOn(); return; }
      if (caged) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); sfx('clink'); sfx('chirp', 3); track('mm_intro_rattle'); }
    });

    function close(toCalc) {
      if (closed) return; closed = true;
      try { document.dispatchEvent(new CustomEvent('kuruvi:intro-done', { detail: { freed: !!toCalc } })); } catch (e) {}
      if (toCalc) { var nx = document.getElementById('next'); if (nx) nx.click(); }
      el.classList.add('out'); root.style.overflow = prevOv;
      try { v.pause(); fv.pause(); } catch (e) {}
      window.removeEventListener('resize', layout);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
    }
    skip.addEventListener('click', function (e) { e.stopPropagation(); track('mm_intro_skip', { at: Math.round(v.currentTime * 10) / 10 }); close(false); });
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); if (busy) return; busy = true;
      track('cta_click', { location: 'welcome_freeme' });
      btn.classList.add('go'); sfx('unlock'); setTimeout(function () { sfx('flap', 500); sfx('song'); }, 350);
      try { v.pause(); } catch (x) {}
      if (lite || fv.readyState < 2) { setTimeout(function () { close(true); }, 500); return; }
      el.classList.add('freeing'); fv.currentTime = 0; fv.playbackRate = 1.3;
      zoomOut = false; layout();   // zoom back in as it flies free
      var fin = function () { close(true); };
      fv.addEventListener('ended', fin, { once: true }); setTimeout(fin, 3800);
      var q = fv.play(); if (q && q.catch) q.catch(fin);
    });
    window.addEventListener('popstate', function () { if (!closed && !(wl && wl.classList.contains('on'))) close(false); });
    // something else took over the screen (resume jump, tracker login): get out of the way
    if (wl && window.MutationObserver) new MutationObserver(function () { if (!wl.classList.contains('on') && !busy) close(false); }).observe(wl, { attributes: true, attributeFilter: ['class'] });
  }

  function check() {
    var wl = document.querySelector('.scr[data-s="welcome"]');
    if (wl && wl.classList.contains('on')) start();
  }
  /* only on a fresh landing on the welcome screen */
  function boot() {
    check(); if (started) return;
    var n = 0, t = setInterval(function () { check(); if (started || ++n > 10) clearInterval(t); }, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
