/* =====================================================================
   Mentell friends (v1, 22 Nov 2026): Kuruvi (money), Mayil (body), Aandhai (mind).
   One file for every page. No libraries: SVG drawings, Web Audio sounds, the phone's
   own voice (speechSynthesis) for the 15-second how-to clips.

   Use on a page:
     <script src="/friends/friends.js?v=1" defer></script>
     <div data-friend="kuruvi|mayil|aandhai|home" data-lang="ta|en|hi"></div>
   The div becomes a scene with a 15-second talking how-to. It plays once by itself
   on a person's first visit (pictures and captions; the voice starts once they tap),
   and the "15s" button replays it.

   Money tracker (/financial/): <div data-friend-cage></div>, then
     MentellFriends.cageSet(el, {frac: 0..1 of the loan paid, locks: n, open: n})
     MentellFriends.cageCheer(el)   // after a saving is logged
   ===================================================================== */
(function () {
  'use strict';
  if (window.MentellFriends) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function q(root, s) { return root.querySelector(s); }
  function qa(root, s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  function track(ev, p) { try { if (typeof gtag === 'function') gtag('event', ev, p || {}); } catch (e) {} }

  /* ---------------- words ---------------- */
  var UI = {
    ta: { watch: 'Eppadi use panradhu', sound: 'Sound', skip: 'Skip', mute: 'Sound off', unmute: 'Sound on' },
    en: { watch: 'How it works', sound: 'Sound', skip: 'Skip', mute: 'Sound off', unmute: 'Sound on' },
    hi: { watch: 'कैसे काम करता है', sound: 'आवाज़', skip: 'Skip', mute: 'Sound off', unmute: 'Sound on' }
  };
  /* spoken lines: Tamil and Hindi in their own script so the phone's voice reads them properly */
  var VO = {
    kuruvi: {
      ta: ['நீங்க சேர்த்து வைக்கிற ஒவ்வொரு ரூபாயும் என்னை இந்த கூண்டுல இருந்து வெளியே வர வைக்கும்.',
           'உங்க EMI, சம்பளம், செலவு சொல்லுங்க. மூணு நிமிஷத்துல உங்க EMI-free தேதி.',
           'தினமும் சேமிச்சதை log பண்ணுங்க. எல்லா லோனும் முடிஞ்சா, நான் வீட்டுக்கு பறந்துடுவேன்!'],
      en: ['Every rupee you save will let me come out of this cage sooner.',
           'Tell me your EMIs, salary and spends. In three minutes you get your EMI-free date.',
           'Log what you save each day. When every loan is closed, I fly home!'],
      hi: ['आप जो हर रुपया बचाते हैं, वो मुझे इस पिंजरे से जल्दी बाहर निकालेगा।',
           'अपनी EMI, सैलरी और खर्च बताइए। तीन मिनट में आपकी EMI-मुक्त तारीख।',
           'रोज़ की बचत लिखिए। सारे लोन खत्म, तो मैं घर उड़ जाऊँगी!']
    },
    mayil: {
      ta: ['நீங்க குடிக்கிற ஒவ்வொரு டம்ளர் தண்ணியும், நடக்கிற ஒவ்வொரு நடையும் எனக்கு ஒரு புது இறகு.',
           'உங்க உடம்புக்கு ஏத்த diet plan கீழே இருக்கு. ஒன்பது இறகு வந்தா, நான் தோகை விரிச்சு ஆடுவேன்!'],
      en: ['Every glass of water and every walk you take grows me a new feather.',
           'Your diet plan is just below. Nine feathers, and I open my tail and dance!']
    },
    aandhai: {
      ta: ['நீங்க விடுற ஒவ்வொரு மூச்சும் இந்த மேகத்தை விலக்கும்.',
           'கீழே இருக்கிற ரெண்டு நிமிஷ test பண்ணுங்க. உங்க stress எங்க இருந்து வருதுன்னு பாக்கலாம்.'],
      en: ['Every calm breath you take pushes this cloud away.',
           'Take the two-minute check below and see what is driving your stress.']
    },
    home: {
      ta: ['வணக்கம்! நாங்க மூணு பேரு உங்க கூடவே இருப்போம். பணம், உடம்பு, மனசு.',
           'எது உங்களை அதிகமா கஷ்டப்படுத்துதோ, அந்த கார்டை தொடுங்க.'],
      en: ['Hi! We are your three little friends. Money, body and mind.',
           'Tap the card for what bothers you most.']
    }
  };

  /* ---------------- style ---------------- */
  var CSS = [
    '.mf{position:relative;margin:18px 0 22px;border:1.5px solid var(--mf-line,#DDD1BF);background:var(--mf-card,#FBF8F2);padding:10px 10px 8px;max-width:560px;font-family:Archivo,system-ui,sans-serif;color:#2A231D}',
    '.mf svg.mf-sc{display:block;width:100%;height:auto;overflow:visible}',
    '.mf-cap{position:absolute;left:12px;right:12px;top:10px;background:rgba(30,24,19,.92);color:#FBF3E6;padding:10px 12px;font-weight:700;font-size:15px;line-height:1.4;opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s;pointer-events:none}',
    '.mf-cap.on{opacity:1;transform:none}',
    '.mf-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px}',
    '.mf-bar button{font:700 13px/1 Archivo,system-ui,sans-serif;border:1.5px solid #2A231D;background:transparent;color:#2A231D;padding:8px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}',
    '.mf-bar button.mf-play{background:#2A231D;color:#FBF3E6}',
    '.mf-bar .mf-sp{margin-left:auto}',
    '.mf-bar button[aria-pressed="true"]{background:#2A231D;color:#FBF3E6}',
    '.mf-bar button[hidden]{display:none}',
    '.mf-prog{height:3px;background:#E4DACB;margin-top:6px;overflow:hidden}.mf-prog i{display:block;height:100%;width:0;background:#2E6B4A}',
    '.mf .chr .wingF{transform-box:fill-box;transform-origin:0% 10%}',
    '.mf .chr .wingB{transform-box:fill-box;transform-origin:100% 10%}',
    '.mf .chr.flying .wingF{animation:mfFlapR .1s ease-in-out infinite alternate}',
    '.mf .chr.flying .wingB{animation:mfFlapL .1s ease-in-out infinite alternate}',
    '@keyframes mfFlapR{from{transform:rotate(10deg)}to{transform:rotate(-70deg)}}',
    '@keyframes mfFlapL{from{transform:rotate(-10deg)}to{transform:rotate(70deg)}}',
    '.mf .eyes{transform-box:fill-box;transform-origin:50% 50%;animation:mfBlink 4.6s infinite}',
    '@keyframes mfBlink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}',
    '.mf .bodyg{transform-box:fill-box;transform-origin:50% 100%;animation:mfBreathe 3.2s ease-in-out infinite}',
    '@keyframes mfBreathe{50%{transform:scale(1.025,.985)}}',
    '.mf .head{transform-box:fill-box;transform-origin:50% 90%;transition:transform .25s}',
    '.mf .chr.sing .head{animation:mfSing .5s ease-in-out 4}',
    '@keyframes mfSing{25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}',
    '.mf .chr.sad .head{transform:translateY(3px) rotate(-8deg)}.mf .chr.sad .eyes{animation:none;transform:scaleY(.55)}',
    '.mf .beak{transform-box:fill-box;transform-origin:50% 0%}',
    '.mf .chr.talk .beak{animation:mfTalk .16s ease-in-out infinite alternate}',
    '@keyframes mfTalk{to{transform:scaleY(1.35) translateY(1px)}}',
    '.mf .chr.puff .bodyg{animation:mfPuff 8s ease-in-out infinite}@keyframes mfPuff{50%{transform:scale(1.09)}}',
    '.mf .chr.bob{animation:mfBob .5s ease-in-out 2}@keyframes mfBob{50%{translate:0 -8px}}',
    '.mf .bar{transition:opacity .9s,transform 1.2s cubic-bezier(.2,.8,.2,1)}',
    '.mf .lock{transition:transform .9s cubic-bezier(.4,0,.6,1),opacity .9s}',
    '.mf .door{transform-box:fill-box;transform-origin:0% 50%;transition:transform 1.1s cubic-bezier(.2,.8,.2,1)}',
    '.mf.free .door{transform:scaleX(-.15) skewY(-8deg)}',
    '.mf .fe{transform:scale(0);transition:transform .7s cubic-bezier(.3,1.6,.5,1)}.mf .fe.on{transform:scale(1)}',
    '.mf.dance .fanw{animation:mfFan .5s ease-in-out 6 alternate}@keyframes mfFan{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}',
    '.mf .cloud{transition:opacity 1.2s,transform 1.2s}',
    '.mf .rain line{animation:mfRain .9s linear infinite}@keyframes mfRain{from{transform:translateY(-6px);opacity:0}30%{opacity:.8}to{transform:translateY(26px);opacity:0}}',
    '.mf .sun{transition:opacity 1.2s,transform 1.4s cubic-bezier(.2,.8,.2,1)}',
    '.mf .ring{transform-box:fill-box;transform-origin:50% 50%;opacity:0}.mf.breathing .ring{opacity:1;animation:mfRing 8s ease-in-out infinite}@keyframes mfRing{0%,100%{transform:scale(.6)}50%{transform:scale(1.25)}}',
    '.mf-cage{margin:4px 0 0}.mf-cage.mf{border:0;padding:0;background:none;margin:6px 0 0}',
    '@media (prefers-reduced-motion:reduce){.mf *{animation:none!important;transition:none!important}}'
  ].join('\n');

  /* ---------------- drawings (original) ---------------- */
  var FUR = 'filter="url(#mfFur)"', SOFT = 'filter="url(#mfSoft)"';
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<radialGradient id="mfBody" cx=".42" cy=".32" r=".78"><stop offset="0" stop-color="#FFFEFB"/><stop offset=".55" stop-color="#EFE7DD"/><stop offset="1" stop-color="#BFB2A3"/></radialGradient>' +
    '<radialGradient id="mfCap" cx=".45" cy=".25" r=".85"><stop offset="0" stop-color="#D99260"/><stop offset=".55" stop-color="#A85F35"/><stop offset="1" stop-color="#6E3A1E"/></radialGradient>' +
    '<radialGradient id="mfWing" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#C98352"/><stop offset=".6" stop-color="#94522C"/><stop offset="1" stop-color="#5E3118"/></radialGradient>' +
    '<radialGradient id="mfEye" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#4A3F38"/><stop offset=".55" stop-color="#120E0B"/><stop offset="1" stop-color="#000"/></radialGradient>' +
    '<linearGradient id="mfBeak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC98A"/><stop offset="1" stop-color="#E5823D"/></linearGradient>' +
    '<radialGradient id="mfPBody" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#8FD0DE"/><stop offset=".55" stop-color="#3C88A6"/><stop offset="1" stop-color="#1E4E6A"/></radialGradient>' +
    '<radialGradient id="mfPWing" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#C9B48E"/><stop offset=".6" stop-color="#8E7650"/><stop offset="1" stop-color="#5E4A30"/></radialGradient>' +
    '<linearGradient id="mfPlume" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2F6E5A"/><stop offset="1" stop-color="#6FB58A"/></linearGradient>' +
    '<radialGradient id="mfOBody" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#F3EADD"/><stop offset=".55" stop-color="#CDBBA5"/><stop offset="1" stop-color="#8C7862"/></radialGradient>' +
    '<radialGradient id="mfOWing" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#B29676"/><stop offset=".6" stop-color="#806548"/><stop offset="1" stop-color="#55412D"/></radialGradient>' +
    '<filter id="mfFur" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>' +
    '<filter id="mfSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
    '</defs></svg>';
  function eyes(dx, y, r, ring) {
    return '<g class="eyes">' + (ring ? '<circle cx="-' + dx + '" cy="' + y + '" r="' + (r + 2.6) + '" fill="' + ring + '"/><circle cx="' + dx + '" cy="' + y + '" r="' + (r + 2.6) + '" fill="' + ring + '"/>' : '') +
      '<circle cx="-' + dx + '" cy="' + y + '" r="' + r + '" fill="url(#mfEye)"/><circle cx="' + dx + '" cy="' + y + '" r="' + r + '" fill="url(#mfEye)"/>' +
      '<circle cx="' + (-dx + 1.9) + '" cy="' + (y - 2.2) + '" r="' + (r * .34) + '" fill="#fff"/><circle cx="' + (dx + 1.9) + '" cy="' + (y - 2.2) + '" r="' + (r * .34) + '" fill="#fff"/></g>';
  }
  function feet(c) { return '<path d="M-6 -3 V0 M-6 0 L-9 1 M-6 0 L-3 1 M6 -3 V0 M6 0 L3 1 M6 0 L9 1" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" fill="none"/>'; }
  var SHADOW = '<ellipse cx="0" cy="1" rx="17" ry="2.6" fill="#3A2A1A" opacity=".22" ' + SOFT + '/>';
  function sparrow() {
    return SHADOW + '<g class="bodyg"><path d="M10 -14 L22 -6 L19 -3 L8 -9 Z" fill="#5E3118"/>' +
      '<g class="wingB"><path d="M-17 -44 C-31 -38 -33 -20 -25 -9 C-20 -12 -17 -22 -16 -34 Z" fill="url(#mfWing)" ' + FUR + '/></g>' +
      '<ellipse cx="0" cy="-30" rx="24.5" ry="28.5" fill="url(#mfBody)" ' + FUR + '/><ellipse cx="0" cy="-20" rx="15" ry="12" fill="#fff" opacity=".45" ' + SOFT + '/>' +
      '<g class="wingF"><path d="M17 -44 C31 -38 33 -20 25 -9 C20 -12 17 -22 16 -34 Z" fill="url(#mfWing)" ' + FUR + '/></g>' +
      '<g class="head"><path d="M-23 -38 C-25 -66 25 -66 23 -38 C17 -44 9 -45 0 -44 C-9 -45 -17 -44 -23 -38 Z" fill="url(#mfCap)" ' + FUR + '/>' +
      '<ellipse cx="-12" cy="-41" rx="8.5" ry="7.5" fill="#9A5631" opacity=".55" ' + SOFT + '/><ellipse cx="12" cy="-41" rx="8.5" ry="7.5" fill="#9A5631" opacity=".55" ' + SOFT + '/>' +
      '<ellipse cx="0" cy="-35" rx="11" ry="7" fill="#FFFDF8" opacity=".9" ' + SOFT + '/>' + eyes(9.5, -42, 5.6) +
      '<path class="beak" d="M-4.6 -38.5 Q0 -42.5 4.6 -38.5 Q1.5 -31.5 0 -31 Q-1.5 -31.5 -4.6 -38.5 Z" fill="url(#mfBeak)"/></g></g>' + feet('#E08A57');
  }
  function peacock() {
    var fan = '';
    for (var i = 0; i < 9; i++) {
      var a = -76 + i * 19;
      fan += '<g transform="rotate(' + a + ')"><path d="M0 0 V-58" stroke="#9A7448" stroke-width="1" stroke-dasharray="2 4" opacity=".55"/><circle cx="0" cy="-62" r="5" fill="none" stroke="#9A7448" stroke-dasharray="2 3" opacity=".5"/>' +
        '<g class="fe" data-f="' + i + '"><path d="M0 0 Q-7 -30 0 -54 Q7 -30 0 0 Z" fill="url(#mfPlume)" ' + FUR + '/><path d="M0 0 V-56" stroke="#2F5D4A" stroke-width=".8"/>' +
        '<ellipse cx="0" cy="-62" rx="7.5" ry="9.5" fill="#3E8E6B" ' + FUR + '/><ellipse cx="0" cy="-61" rx="5.2" ry="6.8" fill="#D9A93A"/><ellipse cx="0" cy="-60" rx="3.4" ry="4.6" fill="#1F4E8C"/><ellipse cx="0" cy="-59.5" rx="1.6" ry="2.2" fill="#0D1B2E"/></g></g>';
    }
    return SHADOW + '<g transform="translate(0 -24)"><g class="fanw">' + fan + '</g></g><g class="bodyg">' +
      '<g class="wingB"><path d="M-16 -42 C-30 -36 -31 -18 -23 -8 C-18 -12 -16 -22 -15 -32 Z" fill="url(#mfPWing)" ' + FUR + '/></g>' +
      '<ellipse cx="0" cy="-30" rx="23.5" ry="27.5" fill="url(#mfPBody)" ' + FUR + '/><ellipse cx="0" cy="-19" rx="14" ry="11" fill="#CDEBEF" opacity=".45" ' + SOFT + '/>' +
      '<g class="wingF"><path d="M16 -42 C30 -36 31 -18 23 -8 C18 -12 16 -22 15 -32 Z" fill="url(#mfPWing)" ' + FUR + '/></g>' +
      '<g class="head"><g stroke="#2F5D4A" stroke-width="1"><path d="M0 -56 L-6 -68 M0 -56 L0 -71 M0 -56 L6 -68"/></g>' +
      '<circle cx="-6" cy="-69" r="2.6" fill="#2E7DA0"/><circle cx="0" cy="-72" r="2.6" fill="#2E7DA0"/><circle cx="6" cy="-69" r="2.6" fill="#2E7DA0"/>' +
      '<path d="M-15 -48 C-12 -51 -6 -51 -4 -49 M15 -48 C12 -51 6 -51 4 -49 M-15 -37 C-12 -34 -7 -34 -5 -36 M15 -37 C12 -34 7 -34 5 -36" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>' +
      eyes(9, -42, 5.4) + '<path class="beak" d="M-3.8 -38.5 Q0 -41.5 3.8 -38.5 Q1.2 -32.5 0 -32 Q-1.2 -32.5 -3.8 -38.5 Z" fill="#CDB79A"/></g></g>' + feet('#9C8A78');
  }
  function owl() {
    return SHADOW + '<g class="bodyg"><g class="wingB"><path d="M-17 -40 C-30 -34 -31 -16 -23 -6 C-18 -10 -16 -20 -15 -30 Z" fill="url(#mfOWing)" ' + FUR + '/></g>' +
      '<ellipse cx="0" cy="-30" rx="25" ry="29" fill="url(#mfOBody)" ' + FUR + '/>' +
      '<g fill="#9C8770" opacity=".55"><path d="M-8 -20 l2 3 l2 -3 M4 -16 l2 3 l2 -3 M-4 -10 l2 3 l2 -3 M-14 -14 l2 3 l2 -3 M10 -24 l2 3 l2 -3"/></g>' +
      '<g class="wingF"><path d="M17 -40 C30 -34 31 -16 23 -6 C18 -10 16 -20 15 -30 Z" fill="url(#mfOWing)" ' + FUR + '/></g>' +
      '<g class="head"><path d="M-22 -46 L-19 -64 L-10 -54 Z M22 -46 L19 -64 L10 -54 Z" fill="#8C7258" ' + FUR + '/>' +
      '<ellipse cx="-10" cy="-41" rx="10.5" ry="10" fill="#F6EEE3" ' + FUR + '/><ellipse cx="10" cy="-41" rx="10.5" ry="10" fill="#F6EEE3" ' + FUR + '/>' +
      eyes(10, -41, 5.6, '#E9A23B') + '<path class="beak" d="M-3 -36 Q0 -38 3 -36 Q1 -29 0 -28.5 Q-1 -29 -3 -36 Z" fill="#B88A55"/></g></g>' + feet('#B89A6E');
  }
  var GROUND = '<rect x="0" y="206" width="360" height="24" fill="#D9CBB4" opacity=".45"/>';
  var GLOW = '<circle cx="180" cy="124" r="92" fill="#EADFCC"/>';
  function cageScene() {
    return GLOW + GROUND +
      '<path class="flight" d="M180 156 C214 128 236 70 206 44 C186 28 160 60 200 70 C240 80 290 70 316 143" fill="none"/>' +
      '<g fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<g transform="translate(318 206)" stroke="#2A231D"><path d="M-22 0 V-40 H22 V0 Z" fill="#FBF8F2"/><path d="M-30 -37 L0 -63 L30 -37 Z" fill="#B5603A" stroke="#8E4527"/><path d="M-6 0 V-18 H6 V0" fill="#7A5232"/><rect x="8" y="-32" width="9" height="9" fill="#F2C46B" stroke-width="1"/></g>' +
      '<g stroke="#9A7448"><path d="M180 30 a6 6 0 1 1 0.1 0 M180 42 V50"/><path d="M118 96 C118 62 242 62 242 96" stroke-width="1.8"/>' +
      '<path d="M134 96 C138 72 222 72 226 96 M150 96 C156 78 204 78 210 96 M180 52 V96" opacity=".7"/><path d="M114 96 H246 M112 200 H248 M110 204 H250" stroke-width="2"/>' +
      '<path d="M136 168 H224" stroke="#7A5232" stroke-width="3"/><g class="bars"></g>' +
      '<g class="door"><path d="M166 112 H194 V200 H166 Z" stroke-width="1.8" fill="#FBF8F2" fill-opacity=".001"/><path d="M173 112 V200 M180 112 V200 M187 112 V200" stroke-width="1.8"/></g><g class="locks"></g></g></g>' +
      '<g class="chr" data-c="kuruvi" style="transform:translate(150px,168px)">' + sparrow() + '</g>';
  }
  var SCENES = {
    kuruvi: cageScene,
    mayil: function () {
      return GLOW + GROUND + '<g transform="translate(262 206)"><path d="M-13 -30 C-22 -24 -22 -4 -10 0 H10 C22 -4 22 -24 13 -30 Z" fill="#C0703F" stroke="#8E4527" stroke-width="1.4"/><path d="M-9 -34 H9 V-30 H-9 Z" fill="#A85F35"/></g>' +
        '<g class="chr" data-c="mayil" style="transform:translate(170px,204px)">' + peacock() + '</g>';
    },
    aandhai: function () {
      return GLOW + '<g class="sun" style="opacity:0;transform:translateY(30px)"><circle cx="276" cy="52" r="18" fill="#F2B84B"/><g stroke="#F2B84B" stroke-width="2.4" stroke-linecap="round"><path d="M276 22 V28 M276 76 V82 M246 52 H252 M300 52 H306 M255 31 L259 35 M293 69 L297 73 M297 31 L293 35 M259 69 L255 73"/></g></g>' + GROUND +
        '<path d="M0 168 C60 160 120 166 250 158 C262 157 270 150 276 142 M222 160 C230 150 236 146 246 146" stroke="#7A5232" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<path d="M246 146 c6 -8 16 -8 20 -2 c-6 4 -14 6 -20 2 Z M232 152 c-2 -9 4 -16 12 -14 c-2 6 -6 12 -12 14 Z" fill="#6E8F5A"/>' +
        '<circle class="ring" cx="170" cy="128" r="46" fill="none" stroke="#2E6B4A" stroke-width="2" stroke-dasharray="3 5"/>' +
        '<g class="chr" data-c="aandhai" style="transform:translate(170px,162px)">' + owl() + '</g>' +
        '<g class="cloud"><g class="rain" stroke="#7FA6C2" stroke-width="2" stroke-linecap="round"><line x1="150" y1="70" x2="148" y2="78"/><line x1="166" y1="72" x2="164" y2="80" style="animation-delay:-.3s"/><line x1="182" y1="70" x2="180" y2="78" style="animation-delay:-.6s"/><line x1="198" y1="72" x2="196" y2="80" style="animation-delay:-.15s"/></g>' +
        '<path d="M136 64 C124 64 124 46 138 46 C138 30 162 26 168 40 C174 28 198 30 198 46 C214 44 216 64 202 64 Z" fill="#9AA3AB"/><path d="M140 58 C150 54 190 54 200 58" stroke="#B7BEC4" stroke-width="3" fill="none" stroke-linecap="round"/></g>';
    },
    home: function () {
      return GLOW + GROUND + '<g class="chr" data-c="kuruvi" style="transform:translate(92px,204px)">' + sparrow() + '</g>' +
        '<g class="chr" data-c="mayil" style="transform:translate(180px,204px)">' + peacock() + '</g>' +
        '<g class="chr" data-c="aandhai" style="transform:translate(268px,204px)">' + owl() + '</g>';
    }
  };

  /* ---------------- sound ---------------- */
  var AC = null, master = null, unlocked = false, noiseBuf = null;
  var muted = lsGet('mf_mute') === '1';
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createDynamicsCompressor(); master.connect(AC.destination); } catch (e) { return null; } }
    if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  function ok() { return !muted && unlocked && ac(); }
  function nb() { if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; }
  function cheep(t, base, len, peak) {
    var g = AC.createGain(), bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = base * 1.1; bp.Q.value = 2.5;
    [[1, 1], [2, .35], [3, .12]].forEach(function (h) {
      var o = AC.createOscillator(), og = AC.createGain();
      o.frequency.setValueAtTime(base * .72 * h[0], t); o.frequency.exponentialRampToValueAtTime(base * 1.18 * h[0], t + len * .3); o.frequency.exponentialRampToValueAtTime(base * .82 * h[0], t + len);
      og.gain.value = h[1]; o.connect(og).connect(bp); o.start(t); o.stop(t + len + .03);
    });
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .008); g.gain.setValueAtTime(peak, t + len * .6); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    bp.connect(g).connect(master);
  }
  function tone(f, t, d, type, p, f2) { var o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(p, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(master); o.start(t); o.stop(t + d + .05); }
  function noise(t, d, f, p) { var s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = nb(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = .9; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(p, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(fl).connect(g).connect(master); s.start(t, Math.random() * .5); s.stop(t + d + .02); }
  var SFX = {
    chirp: function (n) { if (!ok()) return; var t = AC.currentTime + .02; for (var i = 0; i < (n || 3); i++) { var L = .07 + Math.random() * .05; cheep(t, 3300 + Math.random() * 900, L, .3); t += L + .06 + Math.random() * .08; } },
    song: function () { if (!ok()) return; var t = AC.currentTime + .02; for (var i = 0; i < 9; i++) { var L = .06 + (i % 3 === 2 ? .06 : .02); cheep(t, (i % 3 === 2 ? 4300 : 3400) + Math.random() * 500, L, .24); t += L + (i % 3 === 2 ? .22 : .05); } },
    peep: function (n) { if (!ok()) return; var t = AC.currentTime + .02; for (var i = 0; i < (n || 2); i++) { cheep(t, 2100 + Math.random() * 300, .12, .22); t += .2; } },
    hoot: function () { if (!ok()) return; var t = AC.currentTime + .02; tone(420, t, .35, 'sine', .18, 360); tone(400, t + .5, .5, 'sine', .15, 330); },
    flap: function (ms) { if (!ok()) return; var n = Math.max(3, Math.round((ms || 300) / 1000 * 14)); for (var i = 0; i < n; i++) noise(AC.currentTime + i / 14, .07, 700 + Math.random() * 500, .2); },
    clink: function () { if (!ok()) return; var t = AC.currentTime + .05; tone(2093, t, .6, 'sine', .1); tone(3136, t + .04, .6, 'sine', .05); },
    unlock: function () { if (!ok()) return; var t = AC.currentTime; noise(t + .03, .05, 2700, .35); [523.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, t + .2 + i * .12, .7, 'triangle', .09); }); },
    feather: function () { if (!ok()) return; var t = AC.currentTime; [1318.5, 1760, 2637].forEach(function (f, i) { tone(f, t + i * .07, .5, 'sine', .06); }); },
    chime: function () { if (!ok()) return; var t = AC.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, t + i * .1, .8, 'triangle', .08); }); }
  };
  var VOICE_OF = { kuruvi: function () { SFX.chirp(3); }, mayil: function () { SFX.peep(2); }, aandhai: function () { SFX.hoot(); }, home: function () { SFX.chirp(2); } };

  /* the phone's own voice */
  var voices = [];
  function loadVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) {} }
  try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
  function pickVoice(lang) {
    var want = lang === 'ta' ? ['ta-in', 'ta'] : lang === 'hi' ? ['hi-in', 'hi'] : ['en-in', 'en-gb', 'en-us', 'en'];
    for (var i = 0; i < want.length; i++) for (var j = 0; j < voices.length; j++) { var l = String(voices[j].lang || '').replace('_', '-').toLowerCase(); if (l.indexOf(want[i]) === 0) return voices[j]; }
    return null;
  }
  var sayTok = 0;
  function speak(text, lang, chr, fallback) {
    return new Promise(function (res) {
      var my = ++sayTok, est = Math.max(1800, text.length * (lang === 'en' ? 62 : 75));
      if (chr) chr.classList.add('talk');
      var done = false;
      function end() { if (done) return; done = true; if (chr) chr.classList.remove('talk'); res(); }
      var used = false;
      try {
        if (!muted && unlocked && 'speechSynthesis' in window) {
          var v = pickVoice(lang);
          if (v || lang === 'en') {
            speechSynthesis.cancel();
            var u = new SpeechSynthesisUtterance(text); if (v) u.voice = v; u.lang = v ? v.lang : 'en-IN'; u.rate = .95; u.pitch = 1.45;
            u.onend = function () { setTimeout(end, 150); }; u.onerror = function () { setTimeout(end, 400); };
            speechSynthesis.speak(u); used = true; setTimeout(end, est + 5000);
          }
        }
      } catch (e) {}
      if (!used) { if (fallback) fallback(); setTimeout(end, est); }
      void my;
    });
  }
  function hush() { sayTok++; try { speechSynthesis.cancel(); } catch (e) {} }

  /* ---------------- characters ---------------- */
  function pos(c) { var m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(c.style.transform || ''); return m ? [+m[1], +m[2]] : [0, 0]; }
  function place(c, x, y) { c.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }
  function mood(c, m, ms) { ['sing', 'sad', 'puff', 'bob'].forEach(function (k) { c.classList.remove(k); }); void c.getBoundingClientRect(); if (m) { c.classList.add(m); if (ms) setTimeout(function () { c.classList.remove(m); }, ms); } }
  function hop(c, x, y) {
    return new Promise(function (res) {
      var p = pos(c); if (y == null) y = p[1];
      var ms = reduced ? 0 : 260 + Math.abs(x - p[0]) * 2.2, mx = (p[0] + x) / 2, my = Math.min(p[1], y) - 14 - Math.abs(x - p[0]) * .1;
      if (!ms || !c.animate) { place(c, x, y); res(); return; }
      c.classList.add('flying'); if (ok()) for (var i = 0; i < 3; i++) noise(AC.currentTime + i / 18, .06, 800, .16);
      c.animate([{ transform: 'translate(' + p[0] + 'px,' + p[1] + 'px)' }, { transform: 'translate(' + mx + 'px,' + my + 'px)' }, { transform: 'translate(' + x + 'px,' + y + 'px)' }], { duration: ms, easing: 'ease-in-out' })
        .onfinish = function () { place(c, x, y); c.classList.remove('flying'); res(); };
    });
  }
  function fly(c, path, ms) {
    return new Promise(function (res) {
      var L = path.getTotalLength(), kf = [];
      for (var i = 0; i <= 48; i++) { var p = path.getPointAtLength(L * i / 48); kf.push({ transform: 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)' }); }
      var e = path.getPointAtLength(L);
      if (reduced || !c.animate) { place(c, e.x, e.y); res(); return; }
      c.classList.add('flying'); SFX.flap(ms); SFX.chirp(4);
      c.animate(kf, { duration: ms, easing: 'ease-in-out' }).onfinish = function () { place(c, e.x, e.y); c.classList.remove('flying'); res(); };
    });
  }

  /* ---------------- cage state ---------------- */
  var NB = 13;
  var ORDER = (function () { var o = [], l = 0, r = NB - 1; while (l <= r) { o.push(l++); if (l <= r) o.push(r--); } return o; })();
  function drawCage(root, frac, locks, open) {
    var gone = NB * Math.max(0, Math.min(1, frac)), h = '';
    for (var i = 0; i < NB; i++) {
      var x = 122 + i * 9.6; if (x > 164 && x < 196) continue;
      var rank = ORDER.indexOf(i), g = rank < Math.floor(gone), part = rank === Math.floor(gone) ? 1 - (gone % 1) : 1;
      h += '<path class="bar" d="M' + x.toFixed(1) + ' 98 V200" stroke-width="1.8" style="opacity:' + (g ? 0 : Math.max(.25, part).toFixed(2)) + ';transform:translateY(' + (g ? -26 : 0) + 'px)"/>';
    }
    q(root, '.bars').innerHTML = h;
    var L = '';
    for (var k = 0; k < locks; k++) {
      var off = k < open, x0 = 180 - (locks - 1) * 4 + k * 8;
      L += '<g class="lock" style="' + (off ? 'opacity:0;transform:translateY(40px)' : '') + '"><g transform="translate(' + x0 + ' 152)"><path d="M-2.5 0 V-3 a2.5 2.5 0 0 1 5 0 V0" stroke-width="1.2"/><rect x="-3.5" y="0" width="7" height="6" rx="1" fill="#C89B3C" stroke="none"/></g></g>';
    }
    q(root, '.locks').innerHTML = L;
  }

  /* ---------------- a stage ---------------- */
  function mount(el) {
    if (el.__mf) return; el.__mf = 1;
    var kind = el.getAttribute('data-friend'), isCage = el.hasAttribute('data-friend-cage');
    if (isCage) kind = 'kuruvi';
    if (!SCENES[kind]) return;
    var langs = Object.keys(VO[kind]);
    var lang = el.getAttribute('data-lang') || lsGet('mf_lang') || 'ta';
    if (langs.indexOf(lang) < 0) lang = langs.indexOf('en') >= 0 ? 'en' : langs[0];
    el.classList.add('mf'); if (isCage) el.classList.add('mf-cage');
    var label = { kuruvi: 'Kuruvi, a sparrow in a cage. Every saving takes a bar away.', mayil: 'Mayil, a peacock chick. Every healthy habit grows a feather.', aandhai: 'Aandhai, an owl chick under a rain cloud. Every calm breath clears the sky.', home: 'Kuruvi, Mayil and Aandhai, your money, body and mind friends.' }[kind];
    el.innerHTML = '<svg class="mf-sc" viewBox="0 0 360 230" role="img" aria-label="' + label + '">' + SCENES[kind]() + '</svg>' +
      (isCage ? '' : '<div class="mf-cap" aria-live="polite"></div><div class="mf-prog"><i></i></div><div class="mf-bar">' +
        '<button type="button" class="mf-play"></button><button type="button" class="mf-skip" hidden></button>' +
        (el.hasAttribute('data-lang') ? '' : langs.map(function (l) { return '<button type="button" class="mf-l" data-l="' + l + '" aria-pressed="false">' + ({ ta: 'தமிழ்', en: 'EN', hi: 'हिं' })[l] + '</button>'; }).join('')) +
        '<button type="button" class="mf-sp mf-mute"></button></div>');
    var chars = qa(el, '.chr');
    if (kind === 'kuruvi') drawCage(el, 0, 3, 0);
    if (kind === 'mayil') feathers(el, 2);
    if (kind === 'home') feathers(el, 5);
    if (isCage) { el.__chr = chars[0]; return; }

    var cap = q(el, '.mf-cap'), prog = q(el, '.mf-prog i'), play = q(el, '.mf-play'), skip = q(el, '.mf-skip'), mute = q(el, '.mf-mute');
    var tok = 0, running = false;
    function labels() {
      var U = UI[lang] || UI.en;
      play.innerHTML = '&#9654; ' + U.watch + ' · 15s'; skip.textContent = U.skip; mute.textContent = muted ? U.unmute : U.mute;
      qa(el, '.mf-l').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-l') === lang)); });
    }
    labels();
    function say(text) { cap.classList.remove('on'); void cap.offsetWidth; cap.textContent = text; cap.classList.add('on'); }
    function reset() {
      el.classList.remove('free', 'dance', 'breathing'); cap.classList.remove('on'); prog.style.transition = 'none'; prog.style.width = '0';
      chars.forEach(function (c) { mood(c); c.classList.remove('talk', 'flying'); });
      if (kind === 'kuruvi') { drawCage(el, 0, 3, 0); place(chars[0], 150, 168); }
      if (kind === 'mayil') feathers(el, 2);
      if (kind === 'aandhai') sky(el, 0);
    }
    function stop() { tok++; running = false; hush(); reset(); skip.hidden = true; }
    async function run() {
      stop(); var my = ++tok; running = true; skip.hidden = false; lsSet('mf_seen_' + kind, '1');
      track('friend_clip_play', { friend: kind, lang: lang });
      var V = VO[kind][lang], c = chars[0], fb = VOICE_OF[kind], live = function () { return my === tok; };
      var dur = kind === 'kuruvi' ? 15000 : 12000; void prog.offsetWidth; prog.style.transition = 'width ' + dur + 'ms linear'; prog.style.width = '100%';
      try {
        if (kind === 'kuruvi') {
          mood(c, 'sad'); say(V[0]); var s0 = speak(V[0], lang, c, fb);
          for (var f = 1; f <= 4; f++) { await wait(700); if (!live()) return; drawCage(el, f * .09, 3, 0); SFX.clink(); }
          await s0; if (!live()) return; mood(c);
          say(V[1]); var s1 = speak(V[1], lang, c, fb); await hop(c, 206, 168); await wait(500); if (!live()) return;
          drawCage(el, .6, 3, 1); SFX.unlock(); await s1; if (!live()) return;
          say(V[2]); var s2 = speak(V[2], lang, c, fb); drawCage(el, 1, 3, 3); SFX.unlock(); await wait(500); el.classList.add('free'); await wait(700); if (!live()) return;
          await hop(c, 180, 156); await fly(c, q(el, '.flight'), 3000); if (!live()) return; mood(c, 'sing', 2000); SFX.song(); await s2;
        } else if (kind === 'mayil') {
          say(V[0]); var m0 = speak(V[0], lang, c, fb);
          for (var n = 3; n <= 6; n++) { await wait(800); if (!live()) return; feathers(el, n); SFX.feather(); }
          await m0; if (!live()) return;
          say(V[1]); var m1 = speak(V[1], lang, c, fb); for (var n2 = 7; n2 <= 9; n2++) { await wait(500); if (!live()) return; feathers(el, n2); SFX.feather(); }
          el.classList.add('dance'); mood(c, 'sing', 3000); SFX.chime(); await m1; await wait(800);
        } else if (kind === 'aandhai') {
          el.classList.add('breathing'); mood(c, 'puff'); say(V[0]); var a0 = speak(V[0], lang, c, fb);
          for (var k = 1; k <= 3; k++) { await wait(1100); if (!live()) return; sky(el, k / 6); }
          await a0; if (!live()) return; el.classList.remove('breathing'); mood(c);
          say(V[1]); var a1 = speak(V[1], lang, c, fb); sky(el, 1); SFX.chime(); mood(c, 'sing', 2000); await a1; await wait(800);
        } else {
          say(V[0]); var h0 = speak(V[0], lang, null, fb);
          for (var j = 0; j < chars.length; j++) { mood(chars[j], 'bob', 1100); VOICE_OF[chars[j].getAttribute('data-c')](); await wait(900); if (!live()) return; }
          await h0; if (!live()) return; say(V[1]); await speak(V[1], lang, null, fb); await wait(600);
        }
        if (!live()) return;
        await wait(1500); if (live()) { stop(); }
      } catch (e) { stop(); }
    }
    play.addEventListener('click', function () { unlock(); run(); });
    skip.addEventListener('click', function () { track('friend_clip_skip', { friend: kind }); stop(); });
    mute.addEventListener('click', function () { muted = !muted; lsSet('mf_mute', muted ? '1' : '0'); if (muted) hush(); labels(); qa(document, '.mf .mf-mute').forEach(function (b) { b.textContent = muted ? (UI[lang] || UI.en).unmute : (UI[lang] || UI.en).mute; }); });
    qa(el, '.mf-l').forEach(function (b) { b.addEventListener('click', function () { lang = b.getAttribute('data-l'); lsSet('mf_lang', lang); labels(); if (running) run(); }); });
    q(el, 'svg').addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('.chr'); if (!c) return; unlock(); VOICE_OF[c.getAttribute('data-c')](); mood(c, 'sing', 1500); });
    /* first visit: play once when it comes into view */
    if (!lsGet('mf_seen_' + kind) && el.getAttribute('data-autoplay') !== 'off') {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting && x.intersectionRatio > .5) { io.disconnect(); setTimeout(run, 500); } }); }, { threshold: [.5, .8] });
        io.observe(el);
      } else setTimeout(run, 800);
    }
  }
  function feathers(root, n) { var order = [4, 3, 5, 2, 6, 1, 7, 0, 8]; qa(root, '.fe').forEach(function (f) { f.classList.toggle('on', order.indexOf(+f.getAttribute('data-f')) < n); }); }
  function sky(root, p) {
    var c = q(root, '.cloud'), s = q(root, '.sun'), r = q(root, '.rain'); if (!c) return;
    c.style.opacity = String(1 - p * .92); c.style.transform = 'translate(' + (p * 60) + 'px,' + (-p * 14) + 'px) scale(' + (1 - p * .35) + ')'; c.style.transformOrigin = '170px 50px';
    r.style.display = p >= .5 ? 'none' : ''; s.style.opacity = p >= 1 ? 1 : p * .35; s.style.transform = 'translateY(' + ((1 - p) * 30) + 'px)';
  }
  function unlock() { if (unlocked) return; unlocked = true; ac(); loadVoices(); }
  document.addEventListener('pointerdown', unlock, true);

  function init() {
    if (!document.getElementById('mf-css')) { var st = document.createElement('style'); st.id = 'mf-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (!document.getElementById('mfFur')) document.body.insertAdjacentHTML('afterbegin', DEFS);
    qa(document, '[data-friend],[data-friend-cage]').forEach(mount);
  }

  window.MentellFriends = {
    init: init,
    mount: function (el) { init(); mount(el); },
    /* tracker cage: frac = share of the way to EMI-free (0..1), locks = loans, open = loans closed */
    cageSet: function (el, s) {
      if (!el) return; init(); mount(el);
      var locks = Math.max(1, Math.min(6, s.locks || 1)), open = Math.max(0, Math.min(locks, s.open || 0)), free = open >= locks || s.frac >= .999;
      drawCage(el, free ? 1 : s.frac, locks, open);
      el.classList.toggle('free', free);
      var c = el.__chr; if (c && !c.classList.contains('flying')) { if (free) place(c, 316, 143); else place(c, 150, 168); }
    },
    cageCheer: function (el) {
      if (!el || !el.__chr) return; var c = el.__chr;
      if (el.classList.contains('free')) { mood(c, 'sing', 1600); SFX.song(); return; }
      SFX.clink(); SFX.chirp(3); hop(c, 206, 168).then(function () { mood(c, 'sing', 1400); return wait(1200); }).then(function () { return hop(c, 150, 168); });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
