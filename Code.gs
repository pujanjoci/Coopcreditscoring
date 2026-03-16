function doGet(e) {
  const action = e.parameter.action;

  if (action === "getSubmissions") {
    return getSubmissions();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSubmissions() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Submissions");

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0];
  const submissions = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = data[i][index];
    });

    submissions.push(row);
  }

  return ContentService
    .createTextOutput(JSON.stringify(submissions))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (err) {
    return JSON_RESPONSE({ success: false, error: 'Invalid JSON body' });
  }

  if (params.action === "saveApproverDecision") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions");
      if (!sheet) return JSON_RESPONSE({ success: false, error: "Submissions sheet not found" });

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return JSON_RESPONSE({ success: false, error: "No data" });

      const headers = data[0];
      const idIndex = headers.findIndex(h => h.toLowerCase() === 'id' || h.toLowerCase() === 'submissionid');
      const statusIndex = headers.findIndex(h => h.toLowerCase() === 'approverstatus' || h.toLowerCase() === 'status' || h.toLowerCase() === 'decision');
      const notesIndex = headers.findIndex(h => h.toLowerCase() === 'approvernotes' || h.toLowerCase() === 'notes' || h.toLowerCase() === 'recommendation');
      const decidedAtIndex = headers.findIndex(h => h.toLowerCase() === 'approverdecidedat' || h.toLowerCase() === 'decidedat');

      let rowIndex = -1;
      
      if (idIndex !== -1) {
          for (let i = 1; i < data.length; i++) {
              if (String(data[i][idIndex]) === String(params.submissionId)) {
                  rowIndex = i + 1; // 1-indexed for sheet ranges
                  break;
              }
          }
      }

      if (rowIndex !== -1) {
          if (statusIndex !== -1) sheet.getRange(rowIndex, statusIndex + 1).setValue(params.approverStatus);
          if (notesIndex !== -1) sheet.getRange(rowIndex, notesIndex + 1).setValue(params.approverNotes);
          if (decidedAtIndex !== -1) sheet.getRange(rowIndex, decidedAtIndex + 1).setValue(params.approverDecidedAt);
          
          return JSON_RESPONSE({ success: true });
      } else {
          return JSON_RESPONSE({ success: false, error: "Submission not found" });
      }
  }

  return JSON_RESPONSE({ success: false, error: "Invalid action" });
}

function JSON_RESPONSE(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
