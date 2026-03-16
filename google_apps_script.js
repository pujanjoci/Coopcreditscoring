/**
 * Google Apps Script — Dairy Cooperative Credit Scoring Portal
 * Deploy as: Web App | Execute as: Me | Access: Anyone
 *
 * ──────────────────────────────────────────────────────────────
 * IMPORTANT: All credit scoring calculations are now handled
 * locally in the browser (js/engine/*). This script ONLY stores
 * submission data. No scoring logic belongs here.
 * ──────────────────────────────────────────────────────────────
 *
 * Endpoints:
 *   POST  action: 'submitAnswers'  — Save answers + computed score
 */

/**
 * DEBUG: GET handler — visit the web app URL in a browser to see what the
 * script reads from the Users sheet. REMOVE before production use.
 */
function doGet(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    const debug = {
      spreadsheetName: ss.getName(),
      sheetsAvailable: ss.getSheets().map(s => s.getName()),
      usersSheetFound: !!sheet,
      rows: sheet ? sheet.getDataRange().getValues() : []
    };
    return ContentService.createTextOutput(JSON.stringify(debug, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


/**
 * Handle POST requests.
 * NOTE: Running this function directly from the GAS editor will
 * produce "Cannot read properties of undefined (reading 'postData')"
 * because the editor passes no event object. That is expected.
 */
function doPost(e) {
  // Guard: called manually from the editor (no event object)
  if (!e || !e.postData || !e.postData.contents) {
    return respond({ error: 'doPost must be called via HTTP POST. Run from the Web App URL, not the editor.' });
  }
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;
    if (action === 'submitAnswers') {
      return submitAnswers(data);
    }
    if (action === 'login') {
      return handleLogin(data);
    }
    if (action === 'logout') {
      return handleLogout(data);
    }
    return respond({ error: 'Invalid POST action: ' + action });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

/**
 * Computes a SHA-256 hex string natively using Apps Script utilities.
 */
function computeSha256(str) {
  const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return signature.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

/**
 * Validate credentials against the "Users" sheet using hashed passwords.
 * Expected columns: Email | Password | Role | Status | time_logged_in | time_logged_out
 */
function handleLogin(payload) {
  const email = (payload.email || '').trim().toLowerCase();
  const password = payload.password || '';

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      return respond({ error: 'System error: Users sheet not found in the connected spreadsheet.' });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return respond({ error: 'System error: Users sheet is empty or missing data rows.' });
    }

    // Map headers to indexes dynamically
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const emailIdx = headers.indexOf('email');
    const passIdx = headers.indexOf('password');
    const roleIdx = headers.indexOf('role');
    const statusIdx = headers.indexOf('status');
    const timeInIdx = headers.indexOf('time_logged_in');

    if (emailIdx === -1 || passIdx === -1) {
      return respond({ error: 'System error: Users sheet must contain "Email" and "Password" columns.' });
    }

    const hashedInputPassword = computeSha256(password);

    // Loop through rows (skip header row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userEmail = String(row[emailIdx] || '').trim().toLowerCase();
      const userPasswordHash = String(row[passIdx] || '').trim().toLowerCase(); 
      
      // If role/status columns exist, use them. Otherwise default to 'admin' and 'active'
      const role = roleIdx !== -1 ? String(row[roleIdx] || '').trim().toLowerCase() : 'admin';
      const status = statusIdx !== -1 ? String(row[statusIdx] || '').trim().toLowerCase() : 'active';

      // Check if row actually has data (skip empty rows)
      if (!userEmail) continue;

      if (
        userEmail === email &&
        userPasswordHash === hashedInputPassword &&
        status === 'active' &&
        (role === 'admin' || role === 'approver')
      ) {
        
        // Log "time_logged_in" right back to the spreadsheet if the column exists
        if (timeInIdx !== -1) {
          // i + 1 adjusts for 1-based indexing in sheets
          sheet.getRange(i + 1, timeInIdx + 1).setValue(new Date());
        }

        return respond({ 
          success: true, 
          role: role,
          token: Utilities.getUuid() // Generate a unique token for the session 
        });
      }
    }

    return respond({ error: 'Invalid email or password. Please check your credentials.' });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

/**
 * Handle logging out by writing to "time_logged_out"
 */
function handleLogout(payload) {
  const email = (payload.email || '').trim().toLowerCase();
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    
    if (!sheet) return respond({ success: true, message: 'No Users sheet' });

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return respond({ success: true });

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const emailIdx = headers.indexOf('email');
    const timeOutIdx = headers.indexOf('time_logged_out');

    if (emailIdx !== -1 && timeOutIdx !== -1) {
      for (let i = 1; i < data.length; i++) {
        const userEmail = String(data[i][emailIdx] || '').trim().toLowerCase();
        if (userEmail === email) {
          sheet.getRange(i + 1, timeOutIdx + 1).setValue(new Date());
          break;
        }
      }
    }

    return respond({ success: true });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

/**
 * Handle CORS OPTIONS preflight requests.
 */
function doOptions(e) {
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Helper: return JSON with CORS headers.
 */
function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Save questionnaire answers, computed score, and risk tier to Submissions sheet.
 *
 * @param {Object} payload
 * @param {Object} payload.answers    - Flat key-value map of all form answers
 * @param {number} payload.score      - Computed total score (0–1000)
 * @param {string} payload.riskTier   - Risk tier label (A Risk, B Risk, etc.)
 * @param {string} payload.timestamp  - ISO timestamp from client
 */
function submitAnswers(payload) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let   sheet = ss.getSheetByName('Submissions');

    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Submissions');
      sheet.appendRow([
        'Submission Timestamp',
        'Server Timestamp',
        'Total Score',
        'Risk Tier',
        'Coop Name',
        'Answers JSON'
      ]);
      sheet.setFrozenRows(1);
    }

    const answers   = payload.answers   || {};
    const coopName  = answers['coop_name'] || answers['coop_name_input_questions'] || '—';
    const score     = payload.score     ?? '—';
    const riskTier  = payload.riskTier  || '—';
    const clientTs  = payload.timestamp || '—';

    sheet.appendRow([
      clientTs,
      new Date(),
      score,
      riskTier,
      coopName,
      JSON.stringify(answers)
    ]);

    return respond({ success: true, message: 'Submission saved successfully.' });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}
