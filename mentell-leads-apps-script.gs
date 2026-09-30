/**
 * Mentell Leads — Google Apps Script (bound to the "Mentell Leads" Google Sheet)
 *
 * SETUP (one time, ~3 minutes):
 * 1. Open your leads Sheet → Extensions → Apps Script.
 * 2. Delete whatever is in Code.gs, paste this whole file, click Save.
 * 3. Select "testWrite" in the function dropdown → Run → approve permissions.
 *    A TEST row should appear in the first tab. Delete it after.
 * 4. Deploy → New deployment → type "Web app"
 *      Execute as: Me      Who has access: Anyone
 *    → Deploy → copy the Web app URL (ends in /exec).
 * 5. Paste that URL into mentell-config.js on the site and push to GitHub.
 *
 * LATER EDITS: Deploy → Manage deployments → pencil icon → Version: "New version".
 * Never click "New deployment" again — that creates a NEW URL and the site stops logging.
 *
 * Accepts both payload shapes:
 *   physical/mental: {event, source, leadId, number, item, page, bmr, paid, timestamp}
 *   financial:       {event, source, leadId, name, email, phone, income, item, platform, location, ...}
 * Writes by column NAME and adds any missing column, so column order in the sheet never breaks it.
 */

var SHEET_NAME = 'Leads'; // falls back to the first tab if no tab with this name exists

var HEADERS = ['Timestamp (IST)', 'Event', 'Source', 'Lead ID', 'Name', 'WhatsApp', 'Email',
  'Item', 'Monthly Income', 'BMR', 'Paid', 'Platform', 'Location',
  'YouTube', 'Instagram', 'WhatsApp Community', 'Page'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = {};
    try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { d = { raw: String(e.postData.contents) }; }
    writeRow_(d);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// Open the /exec URL in a browser: "Mentell leads endpoint is live" = deployment works.
function doGet() {
  return ContentService.createTextOutput('Mentell leads endpoint is live');
}

function testWrite() {
  writeRow_({ event: 'TEST', source: 'apps-script-editor', name: 'TEST — delete me', number: '919999999999', item: 'setup check' });
}

function writeRow_(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

  // Ensure headers exist; add any that are missing at the end.
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var head = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  if (head.join('') === '') { head = []; }
  HEADERS.forEach(function (h) { if (head.indexOf(h) === -1) head.push(h); });
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(1);

  var values = {
    'Timestamp (IST)': Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss'),
    'Event': d.event || 'lead',
    'Source': d.source || d.page || '',
    'Lead ID': d.leadId || '',
    'Name': d.name || '',
    'WhatsApp': "'" + String(d.phone || d.number || ''),   // leading ' keeps it as text (no 9.19E+11)
    'Email': d.email || '',
    'Item': d.item || '',
    'Monthly Income': d.income || '',
    'BMR': d.bmr || '',
    'Paid': d.paid === undefined ? '' : (d.paid ? 'yes' : 'no'),
    'Platform': d.platform || '',
    'Location': d.location || '',
    'YouTube': d.youtube || '',
    'Instagram': d.instagram || '',
    'WhatsApp Community': d.whatsappCommunity || '',
    'Page': d.page || ''
  };
  if (values['WhatsApp'] === "'") values['WhatsApp'] = '';

  var row = head.map(function (h) { return values.hasOwnProperty(h) ? values[h] : ''; });
  sh.appendRow(row);
}
