/**
 * Google Apps Script (Code.gs)
 * Backend Google Spreadsheet untuk Form Skrining Kesehatan Ibu Hamil
 * 
 * Fitur Keamanan & Penanganan Beban Bersamaan:
 * 1. LockService: Mencegah race condition jika ada submit bersamaan (antrean aman hingga 30 detik)
 * 2. Idempotensi & Ref ID: Mencatat referensi unik transaksi untuk pelacakan
 * 3. Evaluasi Terintegrasi: Mencatat Skor Risiko & Level Rekomendasi Klinis ke baris data
 */

function doPost(e) {
  // Gunakan LockService agar aman jika banyak bidan/pengguna submit secara bersamaan
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    // Tunggu giliran maksimal 30 detik untuk menghindari tabrakan data (race conditions)
    hasLock = lock.tryLock(30000);
    if (!hasLock) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "Server sedang sibuk memproses antrean data lain. Silakan coba sesaat lagi."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // Inisialisasi baris Header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Waktu Input",
        "Ref ID",
        "ID Pasien / No. Reg",
        "Umur (Tahun)",
        "Keluhan Utama",
        "Tinggi (cm)",
        "Berat Badan (kg)",
        "Lingkar Perut (cm)",
        "IMT",
        "Hasil IMT",
        "Sistole (mmHg)",
        "Diastole (mmHg)",
        "Tekanan Darah",
        "LILA (cm)",
        "Anak Ke-",
        "Pernah Hamil",
        "Riwayat Kehamilan",
        "Diagnosa Awal",
        "Palpasi & Catatan",
        "Skor Risiko",
        "Level Risiko",
        "Kesimpulan Evaluasi"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#00880C")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    var p = e.parameter || {};
    var timestamp = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss");

    var newRow = [
      timestamp,
      p.ref_id || ("REF-" + Utilities.getUuid().slice(0, 8).toUpperCase()),
      p.id_pasien || "",
      p.umur || "",
      p.keluhan_utama || "",
      p.tinggi_badan || "",
      p.berat_badan || "",
      p.lingkar_perut || "",
      p.imt || "",
      p.hasil_imt || "",
      p.sistole || "",
      p.diastole || "",
      p.tekanan_darah || "",
      p.lila || "",
      p.anak_ke || "",
      p.pernah_hamil || "",
      p.kehamilan_sebelum || "-",
      p.diagnosa || "",
      p.palpasi || "",
      p.skor_risiko || "0",
      p.level_risiko || "rendah",
      p.kesimpulan || ""
    ];

    sheet.appendRow(newRow);
    SpreadsheetApp.flush(); // Komit penulisan data sebelum lock dilepas

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Data berhasil dicatat ke spreadsheet",
        row: sheet.getLastRow(),
        ref_id: p.ref_id
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "ok",
      message: "Endpoint Web App Google Sheets Skrining Aktif dan Siap Menerima Data."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
