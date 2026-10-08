/* =====================================================================
   Mentell site config — ONE place for settings shared by every page.
   physical.html, mental.html and financial.html all load this file.
   Edit values here only. Never put a secret key or password in this file:
   it is public. Payment links and webhook URLs are fine.
   ===================================================================== */
window.MENTELL_CONFIG = {
  /* Google Sheet lead logging: your Apps Script Web App URL (ends in /exec).
     New Sheet 'Mentell Leads' (owner noormohammed.j@gmail.com), set up 5 Oct 2026. */
  googleSheetWebhook: 'https://script.google.com/macros/s/AKfycbwejRkoIlj-fz2wxOke2rz2Hydr62ZZPhj-msQAWpRmxPqPQSjofa_iaAW79ezHn6H62g/exec',
 
  /* Razorpay Payment Links (public links, not keys) */
  loanPlanPaymentLink: 'https://rzp.io/rzp/xAvsKApO',      // ₹99 Loan Closing Roadmap. Redirect: https://mentell.co.in/financial.html?paid=1#roadmap
  coachingPaymentLink: 'https://rzp.io/rzp/O6mVchGk',      // coaching (quantity page). Redirect: https://mentell.co.in/financial.html?coaching=1#coaching
 
  /* Coaching offer */
  coachingPrice: 4999,              // used only when coachingInstalmentPrice is 0
  coachingInstalmentPrice: 1667,    // MUST equal the per-unit price on the Razorpay page. Full price shown = this × coachingInstalments
  coachingDays: 90,
  coachingInstalments: 3,
  // Value breakdown shown on the page. Set "worth" only to a TRUE number (what you charge
  // or would charge for that part on its own). Leave it '' to show no amount.
  coachingIncludes: [
    { title: 'Weekly accountability', desc: '', worth: '' },
    { title: 'Personal strategy for your numbers', desc: '', worth: '' },
    { title: 'Expense review', desc: '', worth: '' },
    { title: 'Loan optimisation', desc: '', worth: '' },
    { title: 'Habit building', desc: '', worth: '' },
    { title: 'WhatsApp support from Noor', desc: '', worth: '' },
    { title: 'Financial wellness coaching', desc: '', worth: '' }
  ],
 
  /* Contact + community */
  whatsappNumber: '919629843122',
  communityLink: 'https://chat.whatsapp.com/Jqjs0nPE7RY7Rt5lJ3nIKo',
  youtubeLink: 'https://www.youtube.com/@Noormohammed.j',
  instagramLink: 'https://www.instagram.com/mentell.community/',
 
  /* Gate: name + WhatsApp are always required. Set true to ALSO require tapping
     Community + YouTube (taps can't be verified; YouTube policy risk; see handover). */
  requireSocialTaps: false,
 
  /* Social proof: real "can free up" amounts users sent you (₹/month). Amounts only,
     never names or numbers. Empty array = strip hidden. */
  recentResults: [608, 1308, 1824, 3709],
 
  /* Real reviews ONLY, with the person's permission. Empty = review section hidden.
     Example: { name: 'Karthik, Chennai', text: '...', saved: '₹1,800/month' } */
  reviews: [
    { name: 'Karthik, Chennai', text: 'Leak calculator paathu shock aayitten, evalo kaasu waste pannitu irundhu irukkean, Thanks Bor', saved: '₹3,709/month' },
    { name: 'MathiMagil, Madurai', text: 'en husband ku nerila loan irukku bro, adha enna panna nu theyriyama irundhom, unga 1:1 coaching neriya help pannuthu, he is able to sleep peacefully now.', saved: '₹6,800/month' },
    { name: 'Aarthi, Coimbatore', text: 'eppo paaru tension aavae irukkum, ippo dhan konjam nimadhiya irukku.', saved: '₹2,500/month' }
  ],
 
  /* ₹99 payment check + "Restore my plan" (financial.html). Paste the /exec URL of the
     SEPARATE 'Mentell Payments Endpoint' script here (see PAYMENTS-SETUP.md).
     '' = off: the page works exactly as before (unlock on ?paid=1, no restore box). */
  paymentCheckUrl: '',

  /* Optional: extra webhook (Make / Pabbly / Zapier) for instant alerts. '' = off.
     The Apps Script already emails you on every lead; see handover. */
  notifyWebhook: '',
 
  /* GA4 ID (the tag in each page's <head> uses this same ID) */
  analyticsMeasurementId: 'G-CYPL2VHDKP',

  /* Products sold through Razorpay Payment Links, keyed by the link's last part.
     Used by the analytics layer below to send begin_checkout / purchase with the
     right ₹ value on pages that don't track payments themselves (physical.html).
     financial.html tracks its own ₹99 / coaching payments, so they are not listed.
     If you change a price on Razorpay, change it here too. */
  analyticsProducts: {
    'jfq9RaF': { id: 'diet_plan_499', name: 'Custom Diet Chart', price: 499, page: 'physical' }
  }
};
 
/* Backward compatibility: older code on physical/mental reads these globals. */
window.MENTELL_LEADS_URL = window.MENTELL_CONFIG.googleSheetWebhook;
window.MENTELL_ROADMAP_PAY_URL = window.MENTELL_CONFIG.loanPlanPaymentLink;

/* =====================================================================
   Mentell analytics layer (v1, 8 Oct 2026). Runs on every page that loads
   this file. Load this file BEFORE the GA tag in <head> so the settings
   below reach the first page_view. Nothing here sends name, phone or email.

   What it does:
   1. Same lead event everywhere: physical/mental 'whatsapp_lead_captured'
      also sends GA4's standard 'generate_lead' (financial already does).
   2. ₹499 diet plan: 'begin_checkout' on Pay click, 'purchase' (₹499) on
      the ?paid=1 return. Values come from analyticsProducts above.
   3. A purchase is counted once per device (same transaction_id = skipped).
   4. Your own devices: open any page with ?internal=1 once → GA is switched
      off on that browser for good (a small "GA off" tag shows bottom-left).
      ?internal=0 switches it back on. ?ga_debug=1 = send this visit to
      GA DebugView tagged as internal, to check tracking.
   5. Razorpay returns (?paid=1 / ?coaching=1, or a razorpay referrer) keep
      the visitor's original source (Instagram, reel…) instead of "rzp.io".
   6. The Lead ID (random, e.g. L1abc…) is sent as GA user_id, so one person
      across physical / mental / financial counts as one user.
   7. Every site event (leads, checkout, purchase, tool events) carries
      page_pillar (home / physical / mental / financial / about). GA's own
      automatic page_view/scroll don't; use the page path for those.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.MENTELL_CONFIG || {};
  var GA_ID = CFG.analyticsMeasurementId || 'G-CYPL2VHDKP';
  var PRODUCTS = CFG.analyticsProducts || {};

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function qp(k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } }

  /* Which page are we on? */
  var file = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
  var PILLAR = { index: 'home', physical: 'physical', mental: 'mental', financial: 'financial', about: 'about' }[file] || file;

  /* 4. Internal devices */
  if (qp('internal') === '1') lsSet('mentell_internal', '1');
  if (qp('internal') === '0') lsDel('mentell_internal');
  var DEBUG = qp('ga_debug') === '1';
  var INTERNAL = lsGet('mentell_internal') === '1';
  if (INTERNAL && !DEBUG) window['ga-disable-' + GA_ID] = true;

  /* 8. "Open in Chrome" hand-off (financial.html). The Instagram browser sends the
     visitor's calculator answers in ?mh=…; we save them here and remove ?mh from the
     address bar BEFORE the GA tag reads the URL, so the numbers never reach GA.
     Name, phone, paid status and saved-plan keys are never carried or accepted. */
  (function handoff() {
    var raw = qp('mh');
    if (!raw) return;
    try {
      if (raw.length <= 20000) {
        var json = decodeURIComponent(escape(atob(raw.replace(/-/g, '+').replace(/_/g, '/'))));
        var d = clean(JSON.parse(json), 0);
        if (d && typeof d === 'object') {
          if (d.l && typeof d.l === 'object' && d.l.leaks) { delete d.l.name; delete d.l.phone; lsSet('mentell_leak_v2', JSON.stringify(d.l)); }
          if (d.n && typeof d.n === 'object' && Array.isArray(d.n.loans)) lsSet('mentell_loans_v1', JSON.stringify(d.n));
          if (typeof d.id === 'string' && /^L[a-z0-9]{6,20}$/.test(d.id) && !lsGet('mentell_lead_id')) lsSet('mentell_lead_id', d.id);
          try {
            if (d.g === true) sessionStorage.setItem('mentell_gate_ok', '1');
            if (d.a === true) sessionStorage.setItem('mentell_analyzed', '1');
            sessionStorage.setItem('mentell_handoff', '1');
          } catch (e) {}
        }
      }
    } catch (e) {}
    try {
      var u = new URL(location.href);
      var target = (u.searchParams.get('mt') || '').replace(/[^a-zA-Z0-9_-]/g, '');
      u.searchParams.delete('mh'); u.searchParams.delete('mt');
      history.replaceState(null, '', u.pathname + (u.searchParams.toString() ? '?' + u.searchParams : '') + (target ? '#' + target : u.hash));
    } catch (e) {}
  })();
  /* Keep only plain numbers / short safe text / booleans, a few levels deep. */
  function clean(v, depth) {
    if (depth > 6) return undefined;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (typeof v === 'boolean' || v === null) return v;
    if (typeof v === 'string') return v.replace(/[<>"'`&\\]/g, '').slice(0, 80);
    if (Array.isArray(v)) return v.slice(0, 30).map(function (x) { return clean(x, depth + 1); });
    if (typeof v === 'object') {
      var o = {}, n = 0;
      for (var k in v) {
        if (!Object.prototype.hasOwnProperty.call(v, k) || n++ > 60) continue;
        if (!/^[A-Za-z0-9_]{1,30}$/.test(k) || k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        var c = clean(v[k], depth + 1);
        if (c !== undefined) o[k] = c;
      }
      return o;
    }
    return undefined;
  }
  window.MentellClean = function (v) { return clean(v, 0); };

  /* Commands queued straight into dataLayer run before the page's own
     gtag('config') when this file loads first in <head>. */
  window.dataLayer = window.dataLayer || [];
  function dl() { window.dataLayer.push(arguments); }

  var base = { page_pillar: PILLAR };
  if (DEBUG) { base.debug_mode = true; base.traffic_type = 'internal'; }

  /* 5. Razorpay returns: don't let rzp.io / razorpay.com take credit */
  var ref = document.referrer || '';
  var PAID_RETURN = qp('paid') === '1' || qp('coaching') === '1' || !!qp('razorpay_payment_id');
  if (PAID_RETURN || /(^|\.)(rzp\.io|razorpay\.com|razorpay\.me)(\/|:|$)/i.test(ref.replace(/^https?:\/\//, ''))) {
    base.ignore_referrer = 'true';
  }

  /* 6. user_id = Lead ID (random, not personal data) */
  var userIdSent = null;
  function leadId() { return lsGet('mentell_lead_id'); }
  var lid = leadId();
  if (lid) { base.user_id = lid; userIdSent = lid; }

  dl('set', base);

  /* 3. One purchase per transaction_id per device */
  function txSeen(tx) {
    var list = (lsGet('mentell_ga_tx') || '').split('|');
    return list.indexOf(tx) !== -1;
  }
  function txRemember(tx) {
    var list = (lsGet('mentell_ga_tx') || '').split('|').filter(Boolean);
    list.push(tx);
    lsSet('mentell_ga_tx', list.slice(-50).join('|'));
  }

  /* Wrap the page's gtag() once it exists, so every page's events pass through here */
  function wrapGtag() {
    var orig = window.gtag;
    if (typeof orig !== 'function' || orig.__mentell) return typeof orig === 'function';
    var wrapped = function (cmd, name, params) {
      if (cmd !== 'event') return orig.apply(this, arguments);
      var p = {}, skip = false, extraLead = null;
      try {
        if (params && typeof params === 'object') for (var k in params) p[k] = params[k];
        if (!('page_pillar' in p)) p.page_pillar = PILLAR;
        if (DEBUG) { p.debug_mode = true; p.traffic_type = 'internal'; }
        /* Lead ID may have been created just now (at the lead form) */
        var id = leadId();
        if (id && id !== userIdSent) { userIdSent = id; orig('set', { user_id: id }); }
        if (name === 'purchase' && p.transaction_id) {
          var tx = String(p.transaction_id);
          if (txSeen(tx)) skip = true; else txRemember(tx);
        }
        if (name === 'whatsapp_lead_captured') {
          extraLead = { method: 'whatsapp_form', lead_source: PILLAR, item: p.item || '', page_pillar: PILLAR };
          if (DEBUG) { extraLead.debug_mode = true; extraLead.traffic_type = 'internal'; }
        }
      } catch (e) { p = params; }
      if (skip) return;
      var r = orig.call(this, 'event', name, p);
      if (extraLead) orig('event', 'generate_lead', extraLead);
      return r;
    };
    wrapped.__mentell = true;
    window.gtag = wrapped;
    return true;
  }
  wrapGtag();

  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }
  function today() { var d = new Date(); return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
  function deviceId() {
    var d = lsGet('mentell_ga_device');
    if (!d) { d = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); lsSet('mentell_ga_device', d); }
    return d;
  }
  function productFromHref(href) {
    var m = /rzp\.io\/(?:rzp\/|l\/)?([A-Za-z0-9]+)/.exec(href || '');
    return m && PRODUCTS[m[1]] ? PRODUCTS[m[1]] : null;
  }
  function item(pr) { return [{ item_id: pr.id, item_name: pr.name, price: pr.price, quantity: 1 }]; }

  /* 2a. begin_checkout when a listed payment link is tapped (pages that don't track it themselves) */
  if (PILLAR !== 'financial') {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href*="rzp.io"]') : null;
      var pr = a && productFromHref(a.getAttribute('href'));
      if (!pr) return;
      wrapGtag();
      track('begin_checkout', { currency: 'INR', value: pr.price, items: item(pr), link_location: a.closest('[id]') ? a.closest('[id]').id : '' });
    }, true);
  }

  /* 2b. purchase on the ?paid=1 return, for products whose page is this one */
  var pendingPurchase = null;
  if (qp('paid') === '1') {
    for (var key in PRODUCTS) if (PRODUCTS[key].page === PILLAR) { pendingPurchase = PRODUCTS[key]; break; }
  }

  function onReady() {
    wrapGtag();
    if (pendingPurchase) {
      var pr = pendingPurchase; pendingPurchase = null;
      track('purchase', { currency: 'INR', value: pr.price, transaction_id: pr.id + '-' + (leadId() || deviceId()) + '-' + today(), items: item(pr) });
    }
    if (INTERNAL && document.body && !document.getElementById('mentellGaOff')) {
      var tag = document.createElement('div');
      tag.id = 'mentellGaOff';
      tag.textContent = DEBUG ? 'GA debug (internal)' : 'GA off · internal';
      tag.title = 'This browser is marked as Mentell internal. Open any page with ?internal=0 to switch GA back on.';
      tag.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483000;font:600 11px/1 system-ui,sans-serif;padding:5px 8px;border-radius:99px;background:rgba(26,19,48,.78);color:#fff;pointer-events:none;';
      document.body.appendChild(tag);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();

  window.MentellAnalytics = { version: 1, pillar: PILLAR, internal: INTERNAL, debug: DEBUG };
})();
