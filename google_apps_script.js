const SHEET_NAME = "Sheet1"; // sesuaikan dengan nama sheet tujuan

function doPost(e) {
  // LockService untuk menangani submit bersamaan secara aman (antrean hingga 30 detik)
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    hasLock = lock.tryLock(30000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
    var p = e.parameter || {};

    sheet.appendRow([
      p.id_pasien || "",
      p.umur || "",
      p.keluhan || p.keluhan_utama || "",
      p.diagnosa || "",
      p.tinggi_badan || "",
      p.berat_badan || "",
      p.tekanan_darah || "",
      p.lila || "",
      p.palpasi || "",
      p.pernah_hamil || "",
      p.kehamilan_sebelum || "",
      p.anak_ke || "",
      p.partum || ""
    ]);

    SpreadsheetApp.flush();

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

// opsional: buka URL deployment di browser untuk cek apakah script aktif
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "Apps Script aktif" }))
    .setMimeType(ContentService.MimeType.JSON);
}
