import { useState } from 'react';

// Koleksi Ikon SVG Minimalis & Bersih
function IconShieldCheck({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconHeartPulse({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function IconScale({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-8-6l4-8 4 8H4zm12 0l4-8 4 8h-8z" />
    </svg>
  );
}

function IconRuler({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function IconUser({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconStethoscope({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconCheck({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconCopy({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  );
}

function IconRefresh({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function IconCloudCheck({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5l2.25 2.25 4.5-4.5M19.5 12a4.5 4.5 0 00-6.364-4.045 6.002 6.002 0 00-11.082 3.09 4.5 4.5 0 001.946 8.955h15a4.5 4.5 0 00.5-8.999z" />
    </svg>
  );
}

function IconCloudAlert({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM19.5 12a4.5 4.5 0 00-6.364-4.045 6.002 6.002 0 00-11.082 3.09 4.5 4.5 0 001.946 8.955h15a4.5 4.5 0 00.5-8.999z" />
    </svg>
  );
}

export default function ResultScreen({
  evaluationResult,
  refId,
  syncStatus = 'synced',
  syncError = null,
  onReset,
  onRetrySync,
  isRetrying = false
}) {
  const [copied, setCopied] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  if (!evaluationResult) return null;

  const {
    level = 'rendah',
    flags = [],
    tips = [],
    clinicalNotes = [],
    score = 0,
    patientData = {}
  } = evaluationResult;

  // Konfigurasi tema visual gaya Gojek Payment Success (Simpel, Terfokus)
  const themeConfig = {
    rendah: {
      statusHeading: 'Kondisi Risiko Rendah',
      badgeBg: 'bg-emerald-50 text-[#00880C] border-emerald-200',
      badgeLabel: 'Risiko Rendah',
      heroIconBg: 'bg-[#00880C]',
      rippleBg: 'bg-emerald-400',
      heroShadow: 'shadow-emerald-600/30',
      iconSvg: (
        <svg className="w-12 h-12 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )
    },
    sedang: {
      statusHeading: 'Kondisi Risiko Sedang',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeLabel: 'Risiko Sedang',
      heroIconBg: 'bg-amber-500',
      rippleBg: 'bg-amber-400',
      heroShadow: 'shadow-amber-500/30',
      iconSvg: (
        <svg className="w-12 h-12 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )
    },
    tinggi: {
      statusHeading: 'Kondisi Risiko Tinggi',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeLabel: 'Risiko Tinggi',
      heroIconBg: 'bg-rose-600',
      rippleBg: 'bg-rose-400',
      heroShadow: 'shadow-rose-600/30',
      iconSvg: (
        <svg className="w-12 h-12 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )
    },
    sangat_tinggi: {
      statusHeading: 'Kondisi Risiko Sangat Tinggi',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      badgeLabel: 'Risiko Sangat Tinggi',
      heroIconBg: 'bg-rose-700',
      rippleBg: 'bg-rose-500',
      heroShadow: 'shadow-rose-700/30',
      iconSvg: (
        <svg className="w-12 h-12 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" />
        </svg>
      )
    }
  };

  const currentTheme = themeConfig[level] || themeConfig.rendah;

  // Parsing tips rekomendasi
  const parsedTips = tips.map((tip) => {
    const colonIndex = tip.indexOf(':');
    if (colonIndex > 0 && colonIndex < 40) {
      return {
        tag: tip.slice(0, colonIndex).trim(),
        text: tip.slice(colonIndex + 1).trim()
      };
    }
    return {
      tag: 'Panduan Klinis',
      text: tip
    };
  });

  // Salin ringkasan ke clipboard
  const handleCopySummary = async () => {
    const summaryText = `*RINGKASAN EVALUASI RISIKO IBU HAMIL*
ID Pasien: ${patientData.patientId || '-'}
No. Ref: ${refId || '-'}
Status: ${currentTheme.statusHeading} (Skor: ${score})

*Parameter Vital Pasien:*
• Tekanan Darah: ${patientData.bloodPressure || '-'}
• IMT: ${patientData.bmi || '-'} (${patientData.bmiCategory?.category || '-'})
• LILA: ${patientData.upperArmCircumference || '-'}
• Usia Pasien: ${patientData.age ? `${patientData.age} Tahun` : '-'}
• Paritas: Anak ke-${patientData.childOrder || '-'}
• Keluhan: ${patientData.complaintText || 'Tidak Ada Keluhan'}

*Rekomendasi:*
${tips.join('\n')}

Dicatat melalui Form Kehamilan`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = summaryText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isSynced = syncStatus === 'synced';
  const isSyncProblem = syncStatus === 'error' || syncStatus === 'timeout' || syncStatus === 'offline';

  return (
    <div className="w-full max-w-2xl mx-auto py-2 space-y-4 font-sans animate-fadeIn">
      
      {/* CARD 1: INFO DATA TERSIMPAN (DIPERTAHANKAN) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          {isSynced ? (
            <span className="w-7 h-7 rounded-full bg-emerald-50 text-[#00880C] flex items-center justify-center flex-shrink-0">
              <IconCloudCheck className="w-4 h-4" />
            </span>
          ) : (
            <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <IconCloudAlert className="w-4 h-4" />
            </span>
          )}

          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-2">
              <span>{isSynced ? 'Tersimpan di Google Spreadsheet' : 'Data Tersimpan di Perangkat (Lokal)'}</span>
              {refId && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  {refId}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {isSynced
                ? 'Semua data pemeriksaan telah aman tercatat di spreadsheet.'
                : syncError || 'Koneksi spreadsheet tertunda. Data pasien tidak hilang dan siap dikirim ulang.'}
            </p>
          </div>
        </div>

        {/* Tombol Retry jika belum tersinkron */}
        {isSyncProblem && onRetrySync && (
          <button
            type="button"
            onClick={onRetrySync}
            disabled={isRetrying}
            className="self-start sm:self-center px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Mengirim...' : 'Kirim Ulang'}</span>
          </button>
        )}
      </div>

      {/* CARD 2: HERO STATUS ALA PAYMENT SUCCESS GOJEK (ICON BERGERAK DI TENGAH GEDE + TEKS STATUS) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs flex flex-col items-center justify-center text-center">
        {/* Icon Bergerak di Tengah Gede */}
        <div className="relative flex items-center justify-center my-2">
          {/* Efek Denyut Luar (Ripple Effect) */}
          <div className={`absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full ${currentTheme.rippleBg} animate-ping opacity-25`} />
          <div className={`absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full ${currentTheme.rippleBg} opacity-40 animate-pulse`} />

          {/* Lingkaran Utama Berisi Icon */}
          <div className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full ${currentTheme.heroIconBg} flex items-center justify-center shadow-lg ${currentTheme.heroShadow} transition-transform duration-300`}>
            {currentTheme.iconSvg}
          </div>
        </div>

        {/* Tulisan Status di Bawah Icon */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-5">
          {currentTheme.statusHeading}
        </h2>

        {/* Badge Skor & Indikator */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${currentTheme.badgeBg}`}>
            {currentTheme.badgeLabel}
          </span>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full">
            Skor: <strong className="text-slate-800">{score}</strong>
          </span>
        </div>
      </div>

      {/* CARD 3: REKOMENDASI TINDAKAN & KONSELING (BOLD TEGAS, DAFTAR DI BAWAHNYA) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Rekomendasi Tindakan & Konseling
          </h3>
          {flags.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
              {flags.length} Indikator
            </span>
          )}
        </div>

        {/* Indikator Perhatian Khusus (Jika Ada) */}
        {flags.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block mb-1.5">
              Faktor Risiko Terdeteksi:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {flags.map((flag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-rose-700 border border-rose-200/80 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{flag}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Daftar Rekomendasi Terstruktur */}
        <div className="space-y-2.5">
          {parsedTips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition text-xs flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100">
                {idx + 1}
              </div>
              <div className="flex-1">
                {tip.tag !== 'Panduan Klinis' && (
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    {tip.tag}
                  </span>
                )}
                <p className="text-slate-600 leading-relaxed">
                  {tip.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Catatan Edukasi Bidan Tambahan */}
        {clinicalNotes.length > 0 && (
          <div className="mt-4 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900">
            <span className="font-bold block mb-1">Catatan Edukasi Kehamilan:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {clinicalNotes.map((note, idx) => (
                <li key={idx} className="leading-relaxed">{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* COLLAPSE: PARAMETER PEMERIKSAAN & RINCIAN LENGKAP ISI FORMULIR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs text-xs">
        <button
          type="button"
          onClick={() => setShowFullDetails(!showFullDetails)}
          className="w-full px-5 py-3.5 bg-white hover:bg-slate-50 flex items-center justify-between font-semibold text-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <IconStethoscope className="w-4 h-4 text-slate-500" />
            <span>Lihat Parameter Pemeriksaan & Rincian Formulir</span>
          </div>
          <span className="text-slate-400 text-xs">
            {showFullDetails ? 'Tutup ▲' : 'Buka ▼'}
          </span>
        </button>

        {showFullDetails && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-4">
            {/* 1. Grid Parameter Vital Pemeriksaan */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Parameter Vital Pemeriksaan
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Tekanan Darah */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-medium">Tekanan Darah</span>
                    <IconHeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {patientData.bloodPressure || '-'}
                  </div>
                </div>

                {/* Status IMT */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-medium">Status IMT</span>
                    <IconScale className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {patientData.bmi || '-'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {patientData.bmiCategory?.category || '-'}
                  </div>
                </div>

                {/* LILA */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-medium">LILA</span>
                    <IconRuler className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {patientData.upperArmCircumference || '-'}
                  </div>
                </div>

                {/* Usia Ibu */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-medium">Usia Pasien</span>
                    <IconUser className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {patientData.age ? `${patientData.age} Tahun` : '-'}
                  </div>
                </div>

                {/* Paritas */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-medium">Paritas</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ke-</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    Anak ke-{patientData.childOrder || '-'}
                  </div>
                </div>

                {/* Keluhan */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-medium">Keluhan Aktif</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 truncate" title={patientData.complaintText}>
                    {patientData.complaintText || 'Tidak Ada Keluhan'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Rincian Tambahan Isi Formulir */}
            <div className="pt-2 border-t border-slate-200/60">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Data Isian Lainnya
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-slate-400 block text-[11px]">ID Pasien:</span>
                  <span className="font-semibold text-slate-800">{patientData.patientId || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Lingkar Perut:</span>
                  <span className="font-semibold text-slate-800">{patientData.bellyCircumference || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Riwayat Hamil:</span>
                  <span className="font-semibold text-slate-800">{patientData.everPregnant || '-'}</span>
                </div>
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Keluhan Lengkap:</span>
                  <span className="font-medium text-slate-800">{patientData.complaintText || 'Tidak ada keluhan'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOMBOL AKSI GOJEK-STYLE */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        {/* Tombol Utama: Input Pasien Berikutnya */}
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:flex-1 py-3 px-5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
        >
          <span>+ Input Pasien Berikutnya</span>
        </button>

        {/* Tombol Sekunder: Salin Ringkasan */}
        <button
          type="button"
          onClick={handleCopySummary}
          className="w-full sm:w-auto py-3 px-5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm transition shadow-2xs flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <IconCheck className="w-4 h-4 text-[#00880C]" />
              <span className="text-[#00880C] font-semibold">Tersalin!</span>
            </>
          ) : (
            <>
              <IconCopy className="w-4 h-4 text-slate-500" />
              <span>Salin Ringkasan</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
