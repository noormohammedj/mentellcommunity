/* Mentell site config — ONE place for settings shared by every page.
   Paste your Apps Script Web App URL (ends in /exec) between the quotes below.
   physical.html, mental.html and financial.html all read it from here. */
window.MENTELL_LEADS_URL = 'PASTE_APPS_SCRIPT_EXEC_URL_HERE';
 
/* Loan Closing Roadmap (₹99): Razorpay Payment Link or Payment Button URL (public link only, NEVER a secret key).
   In Razorpay, set the success redirect to: https://mentell.co.in/financial.html?paid=1#roadmap */
window.MENTELL_ROADMAP_PAY_URL = 'https://rzp.io/rzp/xAvsKApO';
