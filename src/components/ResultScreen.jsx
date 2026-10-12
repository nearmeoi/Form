import { useEffect, useState } from 'react';

export default function ResultScreen({ evaluationResult, onReset }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  if (!evaluationResult) return null;

  const { level, title, message, flags = [], tips = [], clinicalNotes = [], score = 0, patientData } = evaluationResult;

  // Konfigurasi visual berdasarkan level risiko
  const levelTheme = {
    rendah: {
      cardBorder: 'border-emerald-300',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeLabel: 'Risiko Rendah',
      badgeIcon: '✓',
      accentColor: 'text-emerald-700',
      actionAlertBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      actionIcon: '🟢',
      actionLead: 'Kondisi Relatif Terjaga & Aman',
      actionSub: 'Lanjutkan pola hidup sehat dan pemeriksaan rutin sesuai jadwal bidan/puskesmas.'
    },
    sedang: {
      cardBorder: 'border-amber-300',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeLabel: 'Risiko Sedang',
      badgeIcon: '!',
      accentColor: 'text-amber-700',
      actionAlertBg: 'bg-amber-50 border-amber-200 text-amber-900',
      actionIcon: '🟡',
      actionLead: 'Perlu Pemantauan & Perhatian Khusus',
      actionSub: 'Ada indikasi yang membutuhkan penyesuaian pola makan/istirahat serta kontrol ANC lebih teratur.'
    },
    tinggi: {
      cardBorder: 'border-rose-300',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      badgeLabel: 'Risiko Tinggi',
      badgeIcon: '⚠',
      accentColor: 'text-rose-700',
      actionAlertBg: 'bg-rose-50 border-rose-200 text-rose-900',
      actionIcon: '🔴',
      actionLead: 'Rekomendasi Rujukan Dokter Spesialis (Sp.OG)',
      actionSub: 'Ditemukan faktor risiko penting. Segera konsultasikan ke fasilitas kesehatan rujukan untuk evaluasi mendalam.'
    },
    sangat_tinggi: {
      cardBorder: 'border-purple-300',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      badgeLabel: 'Risiko Sangat Tinggi',
      badgeIcon: '🚨',
      accentColor: 'text-purple-800',
      actionAlertBg: 'bg-purple-50 border-purple-200 text-purple-900',
      actionIcon: '🚨',
      actionLead: 'Peringatan Medis: Waspada Komplikasi Kritis',
      actionSub: 'Kombinasi faktor risiko tinggi terdeteksi. Segera hubungi dokter kandungan atau IGD Rumah Sakit.'
    }
  };

  const theme = levelTheme[level] || levelTheme.rendah;

  // Helper memisahkan judul saran (sebelum titik dua) dan penjelasannya
  const parseTip = (tipText) => {
    const colonIndex = tipText.indexOf(':');
    if (colonIndex > 0 && colonIndex < 40) {
      return {
        category: tipText.slice(0, colonIndex).trim(),
        text: tipText.slice(colonIndex + 1).trim()
      };
    }
    return {
      category: 'Saran',
      text: tipText
    };
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-2">
      <div
        className={`bg-white rounded-xl border-2 ${theme.cardBorder} shadow-sm overflow-hidden transition-all duration-500 ease-out transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        {/* 1. HERO BANNER: STATUS & KESIMPULAN UTAMA (FOKUS UTAMA) */}
        <div className="p-6 text-center border-b border-gray-100 bg-white">
          {/* Badge Level */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-3 shadow-2xs">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${theme.badgeBg}`}>
              {theme.badgeIcon}
            </span>
            <span className={theme.accentColor}>{theme.badgeLabel}</span>
            <span className="text-gray-400 font-normal">|</span>
            <span className="text-gray-500 font-medium">Skor: {score}</span>
          </div>

          {/* Judul Utama */}
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            {title}
          </h2>

          {/* Penjelasan Ringkas */}
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {/* 2. CALLOUT BOX: TINDAKAN UTAMA YANG HARUS DIAMBIL */}
        <div className="px-6 pt-5">
          <div className={`p-4 rounded-lg border ${theme.actionAlertBg} flex items-start gap-3`}>
            <span className="text-xl flex-shrink-0 mt-0.5">{theme.actionIcon}</span>
            <div>
              <h3 className="text-sm font-bold leading-snug">
                {theme.actionLead}
              </h3>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                {theme.actionSub}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 3. FAKTOR RISIKO TERDETEKSI (JIKA ADA) */}
          {flags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Faktor Risiko yang Terdeteksi
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                  {flags.length} Indikator
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>{flag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4. SARAN & REKOMENDASI KLINIS TERSTRUKTUR */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Rekomendasi Tindakan & Edukasi
            </h4>

            <div className="space-y-2.5">
              {tips.map((tip, index) => {
                const parsed = parseTip(tip);
                return (
                  <div
                    key={index}
                    className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 flex items-start gap-3 hover:bg-gray-100/60 transition"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="text-xs leading-relaxed text-gray-800">
                      {parsed.category !== 'Saran' && (
                        <span className="font-bold text-gray-900 block mb-0.5">
                          {parsed.category}
                        </span>
                      )}
                      <p className="text-gray-700">{parsed.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. CATATAN EDUKASI PRIMIGRAVIDA DLL (JIKA ADA) */}
          {clinicalNotes.length > 0 && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
              <strong className="block font-bold mb-1">Catatan Bidan:</strong>
              <ul className="list-disc list-inside space-y-1">
                {clinicalNotes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. RINGKASAN DATA PASIEN (COLLAPSIBLE / DAPAT DIBUKA-TUTUP) */}
          {patientData && (
            <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-semibold text-gray-700 transition"
              >
                <span>Ringkasan Data Pemeriksaan Pasien</span>
                <span className="text-gray-500 font-normal">
                  {showDetails ? '▲ Tutup' : '▼ Lihat Rincian'}
                </span>
              </button>

              {showDetails && (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white border-t border-gray-200">
                  <div>
                    <span className="text-gray-400 block text-[11px]">ID Pasien:</span>
                    <span className="font-semibold text-gray-900">{patientData.patientId || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Umur:</span>
                    <span className="font-semibold text-gray-900">{patientData.age ? `${patientData.age} Tahun` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Status IMT:</span>
                    <span className="font-semibold text-gray-900">{patientData.bmi || '-'} ({patientData.bmiCategory?.category || '-'})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Tekanan Darah:</span>
                    <span className="font-semibold text-gray-900">{patientData.bloodPressure}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">LILA / Lingkar Perut:</span>
                    <span className="font-semibold text-gray-900">{patientData.upperArmCircumference} / {patientData.bellyCircumference}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Hamil Anak Ke-:</span>
                    <span className="font-semibold text-gray-900">{patientData.childOrder}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 pt-1 border-t border-gray-100">
                    <span className="text-gray-400 block text-[11px]">Keluhan:</span>
                    <span className="font-medium text-gray-800">{patientData.complaintText || 'Tidak Ada Keluhan'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. TOMBOL KEMBALI / INPUT PASIEN BARU */}
          <div className="pt-2 text-center">
            <button
              onClick={onReset}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition text-sm shadow-sm"
            >
              ← Kembali & Input Pasien Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
