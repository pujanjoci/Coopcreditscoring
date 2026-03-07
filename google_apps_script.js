/**
 * Dairy Cooperative Credit Scoring Portal - Google Apps Script
 * Replace your existing Code.gs with this script.
 * 
 * IMPORTANT: 
 * 1. Deploy as a "Web App"
 * 2. Execute as: "Me"
 * 3. Who has access: "Anyone"
 */

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'fetchQuestions') {
    return fetchQuestions();
  } else if (action === 'calculateResults') {
    return calculateResults();
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Invalid GET action"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  if (!e.postData || !e.postData.contents) {
    return respond({ error: "No data received" });
  }

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'submitAnswers') {
      return submitAnswers(data.answers);
    }

    return respond({ error: "Invalid POST action" });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

// Helper to return JSON safely with CORS
function respond(responseObject) {
  return ContentService.createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------
// FETCH QUESTIONS
// ----------------------------------------------------
function fetchQuestions() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Questions");
    if (!sheet) return respond({ error: "Sheet named 'Questions' not found" });

    // Ensure we fetch ALL rows dynamically, up to the last row!
    var lastRow = sheet.getLastRow();
    
    // Safety check - if sheet is empty or only has headers
    if (lastRow < 2) return respond([]); 
    
    var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var questions = [];

    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        
        // Skip entirely empty rows
        if (!row[0] && !row[1]) continue;
        
        questions.push({
            id: row[0] || ('q_' + i),
            english: row[1] || '',
            nepali: row[2] || '',
            required: (row[3] === true || String(row[3]).toUpperCase() === 'TRUE'),
            placeholder: row[4] || ''
        });
    }

    // This guarantees the frontend receives all 100+ questions
    return respond(questions);
    
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

// ----------------------------------------------------
// SUBMIT ANSWERS
// ----------------------------------------------------
function submitAnswers(answers) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions");
    // Create sheet if missing
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Submissions");
      sheet.appendRow(["Timestamp", "Answers JSON"]);
    }
    
    sheet.appendRow([new Date(), JSON.stringify(answers)]);
    
    return respond({ success: true, message: "Answers saved successfully" });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

// ----------------------------------------------------
// CALCULATE RESULTS (Example structure)
// ----------------------------------------------------
function calculateResults() {
  try {
    // This is where you would implement your 1000-point scoring logic
    // based on the answers stored in your "Submissions" or "Questions" sheets.
    
    return respond({
      totalScore: 845,
      riskCategory: "LOW RISK",
      recommendation: "Excellent financial stability. Maintain current milk collection standards and consider expansion of processing facilities.",
      categories: [
        { name: "Financial (40%)", score: 360, max: 400 },
        { name: "Milk Quality (25%)", score: 210, max: 250 },
        { name: "Operations (15%)", score: 125, max: 150 },
        { name: "Management (10%)", score: 85, max: 100 },
        { name: "Farmer Relations (10%)", score: 65, max: 100 }
      ],
      logs: [
        { name: "Current Ratio", formula: "Current Assets / Current Liab", value: "2.1x", score: 100, max: 100 },
        { name: "Debt-to-Equity", formula: "Total Debt / Total Equity", value: "0.8x", score: 80, max: 100 },
        { name: "Milk Collection Growth", formula: "Year-on-Year Change", value: "12%", score: 120, max: 150 },
        { name: "Member Participation", formula: "Active / Total Members", value: "78%", score: 45, max: 50 }
      ],
      strengths: [
        "Strong liquidity ratio (2.1x)",
        "Consistent milk collection growth",
        "Low debt-to-equity leverage",
        "High member retention rate"
      ],
      weaknesses: [
        "Farmer training frequency is below average",
        "Manual record keeping in some departments",
        "High processing waste (3%)"
      ]
    });
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

/**
 * To fix CORS OPTIONS preflight requests if the frontend sends `application/json`
 */
function doOptions(e) {
  return ContentService.createTextOutput("OK")
    .setMimeType(ContentService.MimeType.TEXT);
}
