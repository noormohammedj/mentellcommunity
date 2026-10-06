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
 
  /* Optional: extra webhook (Make / Pabbly / Zapier) for instant alerts. '' = off.
     The Apps Script already emails you on every lead; see handover. */
  notifyWebhook: '',
 
  /* GA4 ID (the tag in each page's <head> uses this same ID) */
  analyticsMeasurementId: 'G-CYPL2VHDKP'
};
 
/* Backward compatibility: older code on physical/mental reads these globals. */
window.MENTELL_LEADS_URL = window.MENTELL_CONFIG.googleSheetWebhook;
window.MENTELL_ROADMAP_PAY_URL = window.MENTELL_CONFIG.loanPlanPaymentLink;
