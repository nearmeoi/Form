/**
 * Google Apps Script (Code.gs)
 * Salin dan tempel kode ini ke Extensions > Apps Script pada Google Spreadsheet Anda.
 * Kemudian klik Deploy > New Deployment > Web app:
 * - Execute as: Me
 * - Who has access: Anyone (Siapa saja)
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // Inisialisasi Header jika spreadsheet masih kosong
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Waktu Input",
        "ID Pasien / No. Reg",
        "Nama Pasien",
        "NIK",
        "Tanggal Lahir",
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
        "Palpasi & Catatan"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    }

    var p = e.parameter;
    var timestamp = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss");

    var newRow = [
      timestamp,
      p.id_pasien || "",
      p.nama_pasien || "",
      p.nik || "",
      p.tgl_lahir || "",
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
      p.palpasi || ""
    ];

    sheet.appendRow(newRow);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", row: sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
