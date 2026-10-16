/**
 * =========================================================================
 * Jb.rides - Google Sheets Apps Script for Automatic Lead Collection
 * Sheet ID: 1Ma29NQDKejrwZd3A4XP3QszNgyuvcY8URv7SrY1e9jo
 * =========================================================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1Ma29NQDKejrwZd3A4XP3QszNgyuvcY8URv7SrY1e9jo/edit
 * 2. In top menu click: Extensions (विस्तार) -> Apps Script
 * 3. Delete any default code in Code.gs and PASTE ALL THIS CODE below.
 * 4. Click 'Save' (💾 icon or Ctrl+S).
 * 5. Click 'Deploy' (नीला बटन ऊपर दाईं तरफ) -> 'New deployment'
 * 6. Click Gear icon (⚙️) -> Select 'Web app'
 *    - Description: "Jb.rides Lead Webhook"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (महत्वपूर्ण: Anyone सेलेक्ट करें)
 * 7. Click 'Deploy'. Grant permissions if asked.
 * 8. Copy the 'Web app URL' (it will look like: https://script.google.com/macros/s/AKfycb.../exec)
 * 9. Paste that URL in js/main.js in 'GOOGLE_SHEET_WEB_APP_URL'.
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // 10 seconds lock to prevent simultaneous write clashes

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. Check if Header row exists, if not, create it
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Date & Time (IST)",
        "Customer Name",
        "Phone / WhatsApp",
        "Vehicle Type",
        "Rental Duration",
        "Pickup Date",
        "Customer Notes / Message",
        "Lead Source"
      ];
      sheet.appendRow(headers);
      
      // Style headers: Bold, Dark Slate background, White text
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0f172a");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    // 2. Parse incoming data (FormData or JSON)
    var data;
    if (e.postData && e.postData.type === "application/json") {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      data = {};
    }

    // Indian Standard Time (IST) formatting
    var timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd/MM/yyyy hh:mm:ss a");

    var name = data.customer_name || data.name || data.contactName || "N/A";
    var phone = data.customer_phone || data.phone || data.contactPhone || "N/A";
    var vehicle = data.vehicle_type || data.vehicle || data.contactVehicle || "N/A";
    var duration = data.rental_duration || data.duration || "N/A";
    var pickupDate = data.pickup_date || data.date || "N/A";
    var notes = data.customer_notes || data.notes || data.message || data.contactMessage || "N/A";
    var source = data.lead_source || data.source || "Website Enquiry";

    // 3. Append row into Google Sheet
    sheet.appendRow([
      timestamp,
      name,
      phone,
      vehicle,
      duration,
      pickupDate,
      notes,
      source
    ]);

    // 4. (Optional) Send Instant Email Alert to Owner
    try {
      var ownerEmail = "Jderides68@gmail.com";
      var emailSubject = "🔥 New Ride Lead Received: " + name + " (" + vehicle + ")";
      var emailBody = "Hello Jb.rides Owner,\n\n" +
        "You have received a new ride booking lead on your website:\n\n" +
        "👤 Name: " + name + "\n" +
        "📞 Phone: " + phone + "\n" +
        "🛵 Vehicle: " + vehicle + "\n" +
        "⏱️ Duration: " + duration + "\n" +
        "📅 Pickup Date: " + pickupDate + "\n" +
        "📝 Notes: " + notes + "\n" +
        "🌐 Source: " + source + "\n\n" +
        "View All Leads in Google Sheet:\n" +
        "https://docs.google.com/spreadsheets/d/1Ma29NQDKejrwZd3A4XP3QszNgyuvcY8URv7SrY1e9jo/edit\n\n" +
        "— Jb.rides System Alert";

      MailApp.sendEmail(ownerEmail, emailSubject, emailBody);
    } catch (mailError) {
      Logger.log("Email alert error: " + mailError.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Lead recorded successfully in Google Sheet"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Jb.rides Google Sheet Webhook is active and working perfectly!").setMimeType(ContentService.MimeType.TEXT);
}
