const SHEET_NAME = "Sheet1"; // sesuaikan dengan nama sheet tujuan

// 13 Kolom standar sesuai struktur form skrining
const COLUMNS = [
  { key: "id_pasien", title: "ID Pasien" },
  { key: "umur", title: "Umur" },
  { key: "keluhan", title: "Keluhan" },
  { key: "diagnosa", title: "Diagnosa" },
  { key: "tinggi_badan", title: "Tinggi Badan" },
  { key: "berat_badan", title: "Berat Badan" },
  { key: "tekanan_darah", title: "Tekanan Darah" },
  { key: "lila", title: "LILA" },
  { key: "palpasi", title: "Palpasi" },
  { key: "pernah_hamil", title: "Pernah Hamil" },
  { key: "kehamilan_sebelum", title: "Kehamilan Sebelum" },
  { key: "anak_ke", title: "Anak Ke-" },
  { key: "partum", title: "Partum" }
];

/**
 * Otomatis pasang header dan rapikan format spreadsheet jika sheet masih kosong
 */
function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    setupSheetHeaders(sheet);
  }
}

/**
 * Format dan tata letak header (Warna hijau rapi, font tebal putih, beku baris 1)
 */
function setupSheetHeaders(sheet) {
  var titles = COLUMNS.map(function(col) { return col.title; });
  
  // Tulis nama-nama kolom di baris ke-1
  var range = sheet.getRange(1, 1, 1, titles.length);
  range.setValues([titles]);
  range
    .setFontWeight("bold")
    .setBackground("#00880C") // Aksen hijau rapi
    .setFontColor("#FFFFFF")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  sheet.setFrozenRows(1); // Kunci baris 1 agar tetap terlihat saat di-scroll
  sheet.setRowHeight(1, 36);

  // Sesuaikan lebar setiap kolom otomatis
  for (var i = 1; i <= titles.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

/**
 * FUNGSI SETUP MANDIRI:
 * Bisa dijalankan langsung dari Google Apps Script Editor (pilih 'setupSheet' lalu klik 'Run'),
 * atau diakses lewat browser: https://script.google.com/.../exec?action=setup
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  setupSheetHeaders(sheet);
  return "Berhasil: Kolom dan format spreadsheet telah diatur otomatis.";
}

function doPost(e) {
  // LockService untuk menangani submit bersamaan secara aman (antrean hingga 30 detik)
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    hasLock = lock.tryLock(30000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();

    // Otomatis cek & buat header jika spreadsheet masih kosong
    ensureHeader(sheet);

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

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  // Jika URL dibuka dengan ?action=setup, langsung atur kolom spreadsheet
  if (action === "setup") {
    var msg = setupSheet();
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: msg }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      status: "Apps Script aktif",
      info: "Buka link dengan '?action=setup' untuk mengatur kolom spreadsheet secara otomatis."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
