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

  // Level configuration
  const levelConfig = {
    rendah: {
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      badgeIcon: '✓',
      badgeText: 'Risiko Rendah',
      headerBg: 'from-emerald-500/10 to-transparent'
    },
    sedang: {
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      badgeIcon: '!',
      badgeText: 'Risiko Sedang',
      headerBg: 'from-amber-500/10 to-transparent'
    },
    tinggi: {
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      badgeIcon: '⚠',
      badgeText: 'Risiko Tinggi',
      headerBg: 'from-rose-500/10 to-transparent'
    },
    sangat_tinggi: {
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      dotColor: 'bg-purple-600',
      badgeIcon: '🚨',
      badgeText: 'Risiko Sangat Tinggi',
      headerBg: 'from-purple-500/10 to-transparent'
    }
  };

  const currentLevel = levelConfig[level] || levelConfig.rendah;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div
        className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-700 ease-out transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* TOP STATUS CARD */}
        <div className={`p-6 sm:p-8 bg-gradient-to-b ${currentLevel.headerBg} border-b border-slate-100 text-center`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-4 font-semibold text-xs tracking-wider uppercase shadow-xs bg-white/80 backdrop-blur-xs">
            <span className="text-base">{currentLevel.badgeIcon}</span>
            <span className={currentLevel.badgeColor.split(' ')[1]}>{currentLevel.badgeText}</span>
            <span className="text-slate-400 font-normal">| Skor Risiko: {score}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{title}</h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">{message}</p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* FAKTOR RISIKO TERDETEKSI */}
          {flags.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Faktor Risiko Terdeteksi ({flags.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100"
                  >
                    <span>•</span> {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SARAN & REKOMENDASI KLINIS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Saran & Rekomendasi Tindakan ({tips.length})
              </h3>
            </div>

            <div className="space-y-3">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3.5 hover:border-slate-200 transition"
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${currentLevel.dotColor}`} />
                  <p className="text-slate-700 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CATATAN TAMBAHAN (JIKA PRIMIGRAVIDA DLL) */}
          {clinicalNotes.length > 0 && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                Catatan Asuhan Bidan:
              </h4>
              <ul className="text-xs text-indigo-800 space-y-1 list-disc list-inside">
                {clinicalNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* RINGKASAN DATA PASIEN (COLLAPSIBLE) */}
          {patientData && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left text-xs font-semibold text-slate-700 transition"
              >
                <span>Ringkasan Data Pasien & Antropometri</span>
                <span>{showDetails ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
              </button>

              {showDetails && (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white text-xs">
                  <div>
                    <span className="text-slate-400 block">No. Register / ID:</span>
                    <strong className="text-slate-800">{patientData.patientId || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Umur:</span>
                    <span className="text-slate-800">{patientData.age ? `${patientData.age} Tahun` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">IMT:</span>
                    <span className="text-slate-800">{patientData.bmi || '-'} ({patientData.bmiCategory?.category || '-'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tekanan Darah:</span>
                    <span className="text-slate-800">{patientData.bloodPressure}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">LILA / Lingkar Perut:</span>
                    <span className="text-slate-800">{patientData.upperArmCircumference} / {patientData.bellyCircumference}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block">Keluhan Terpilih:</span>
                    <span className="text-slate-800 font-medium">
                      {patientData.complaintText || (Array.isArray(patientData.complaints) ? patientData.complaints.join(', ') : patientData.complaint) || 'Tidak Ada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Anak Ke-:</span>
                    <span className="text-slate-800">{patientData.childOrder}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pernah Hamil:</span>
                    <span className="text-slate-800">{patientData.everPregnant}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTION BUTTON */}
          <div className="pt-2 text-center">
            <button
              onClick={onReset}
              className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 text-sm"
            >
              + Input Pasien Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
