import { useState, useMemo } from 'react';
import ResultScreen from './components/ResultScreen';
import { evaluateRisk, calculateBMI, getBMICategory } from './utils/evaluateRisk';
import {
  generateReferenceId,
  saveToLocalQueue,
  updateLocalRecordStatus,
  syncToSpreadsheet
} from './utils/submissionService';

const COMPLAINT_LIST = [
  'Mual',
  'Mual-Muntah',
  'Pusing',
  'Sakit Kepala',
  'Nyeri Perut Bawah',
  'Nyeri Ulu Hati',
  'Batuk / Flu',
  'Kurang Nafsu Makan'
];

const INITIAL_FORM_STATE = {
  patientId: '',
  age: '',
  height: '',
  weight: '',
  upperArmCircumference: '',
  bellyCircumference: '',
  systolic: '',
  diastolic: '',
  complaintsMap: COMPLAINT_LIST.reduce((acc, curr) => {
    acc[curr] = { selected: false, frequency: 'Sering' };
    return acc;
  }, {}),
  hasCustomComplaint: false,
  customComplaintName: '',
  customComplaintFrequency: 'Sering',
  childOrder: '1',
  everPregnant: 'Tidak',
  previousPregnancyRisk: 'Risiko rendah',
  diagnosis: 'Supervision of normal pregnancy, unspecified',
  palpation: ''
};

function App() {
  const [view, setView] = useState('form');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [refId, setRefId] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'synced' | 'timeout' | 'error' | 'offline' | 'no_url'
  const [syncError, setSyncError] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);

  // Perhitungan IMT real-time
  const liveBMI = useMemo(() => {
    return calculateBMI(formData.height, formData.weight);
  }, [formData.height, formData.weight]);

  const liveBMICategory = useMemo(() => {
    return getBMICategory(liveBMI);
  }, [liveBMI]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle checklist keluhan
  const handleToggleComplaint = (item) => {
    setFormData((prev) => {
      const current = prev.complaintsMap[item] || { selected: false, frequency: 'Sering' };
      const updatedMap = {
        ...prev.complaintsMap,
        [item]: {
          ...current,
          selected: !current.selected,
          frequency: !current.selected ? (current.frequency || 'Sering') : current.frequency
        }
      };
      return { ...prev, complaintsMap: updatedMap };
    });
  };

  // Ubah frekuensi keluhan (Sering, Jarang, Tidak Pernah)
  const handleFrequencyChange = (item, frequency) => {
    setFormData((prev) => {
      const updatedMap = {
        ...prev.complaintsMap,
        [item]: {
          selected: true, // Tetap selected agar kotak dan pilihan radio tetap aktif & tidak hilang
          frequency: frequency
        }
      };
      return { ...prev, complaintsMap: updatedMap };
    });
  };

  // Reset keluhan jika memilih "Tidak Ada Keluhan"
  const handleSelectNoComplaint = (checked) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        complaintsMap: COMPLAINT_LIST.reduce((acc, curr) => {
          acc[curr] = { selected: false, frequency: 'Sering' };
          return acc;
        }, {}),
        hasCustomComplaint: false,
        customComplaintName: '',
        customComplaintFrequency: 'Sering'
      }));
    }
  };

  // Periksa apakah opsi "Tidak Ada Keluhan" aktif (hanya aktif jika tidak ada keluhan yang dicentang)
  const isNoComplaintChecked = useMemo(() => {
    const hasAnyListChecked = Object.values(formData.complaintsMap).some((c) => c.selected);
    const hasCustomChecked = formData.hasCustomComplaint && formData.customComplaintName.trim();
    return !hasAnyListChecked && !hasCustomChecked;
  }, [formData.complaintsMap, formData.hasCustomComplaint, formData.customComplaintName]);

  // Submit Handler: Dilengkapi proteksi concurrency, timeout, dan fallback lokal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Mencegah double submit / debouncing
    setIsSubmitting(true);
    setSyncError(null);

    // 1. Kumpulkan daftar keluhan yang dipilih
    const complaintItems = [];
    COMPLAINT_LIST.forEach((name) => {
      const entry = formData.complaintsMap[name];
      if (entry && entry.selected) {
        complaintItems.push({ name, frequency: entry.frequency });
      }
    });

    if (
      formData.hasCustomComplaint &&
      formData.customComplaintName.trim()
    ) {
      complaintItems.push({
        name: formData.customComplaintName.trim(),
        frequency: formData.customComplaintFrequency
      });
    }

    // Keluhan aktif yang bermakna klinis (bukan "Tidak Pernah")
    const activeComplaints = complaintItems.filter((c) => c.frequency !== 'Tidak Pernah');
    const complaintString = activeComplaints.length > 0
      ? activeComplaints.map((c) => `${c.name} (${c.frequency})`).join(', ')
      : 'Tidak Ada Keluhan';

    const evaluatedData = {
      ...formData,
      complaintItems: complaintItems,
      complaint: complaintString,
      bmi: liveBMI,
      bmiCategory: liveBMICategory.label
    };

    // 2. Evaluasi risiko menggunakan sistem pakar forward chaining
    const evaluation = evaluateRisk(evaluatedData);
    const generatedRefId = generateReferenceId();

    // 3. Cadangkan langsung ke penyimpanan browser (Offline-first / Anti-data-loss)
    const localRecord = {
      refId: generatedRefId,
      timestamp: new Date().toISOString(),
      patientData: evaluatedData,
      evaluationResult: evaluation,
      syncStatus: 'pending'
    };
    saveToLocalQueue(localRecord);

    // Hitung estimasi partum (jumlah riwayat persalinan sebelumnya)
    let calculatedPartum = '0';
    if (evaluatedData.everPregnant === 'Ya') {
      const childNum = parseInt(evaluatedData.childOrder, 10);
      if (!isNaN(childNum) && childNum > 1) {
        calculatedPartum = String(childNum - 1);
      } else if (evaluatedData.childOrder === '>4') {
        calculatedPartum = '>3';
      }
    }

    // 4. Siapkan payload data untuk Google Spreadsheet
    const payload = {
      ref_id: generatedRefId,
      id_pasien: evaluatedData.patientId,
      umur: evaluatedData.age,
      keluhan: complaintString,
      keluhan_utama: complaintString,
      diagnosa: evaluatedData.diagnosis,
      tinggi_badan: evaluatedData.height,
      berat_badan: evaluatedData.weight,
      lingkar_perut: evaluatedData.bellyCircumference,
      imt: liveBMI ? liveBMI.toString() : '',
      hasil_imt: liveBMICategory.label,
      sistole: evaluatedData.systolic,
      diastole: evaluatedData.diastolic,
      tekanan_darah: `${evaluatedData.systolic}/${evaluatedData.diastolic}`,
      lila: evaluatedData.upperArmCircumference,
      anak_ke: evaluatedData.childOrder,
      partum: calculatedPartum,
      pernah_hamil: evaluatedData.everPregnant,
      kehamilan_sebelum: evaluatedData.everPregnant === 'Ya' ? evaluatedData.previousPregnancyRisk : '-',
      palpasi: evaluatedData.palpation,
      skor_risiko: evaluation.score.toString(),
      level_risiko: evaluation.level,
      kesimpulan: evaluation.title
    };

    setRefId(generatedRefId);
    setEvaluationResult(evaluation);
    setLastSubmission({ payload, refId: generatedRefId });

    // 5. Kirim ke Google Spreadsheet dengan proteksi timeout & penanganan error
    try {
      const syncRes = await syncToSpreadsheet(payload, { timeoutMs: 12000, maxRetries: 1 });
      
      if (syncRes.success) {
        setSyncStatus('synced');
        setSyncError(null);
        updateLocalRecordStatus(generatedRefId, 'synced');
      } else {
        setSyncStatus(syncRes.status);
        setSyncError(syncRes.message);
        updateLocalRecordStatus(generatedRefId, syncRes.status, syncRes.message);
      }
    } catch (err) {
      console.error('Unhandled sync error:', err);
      setSyncStatus('error');
      setSyncError('Koneksi terputus saat menyimpan data ke spreadsheet.');
      updateLocalRecordStatus(generatedRefId, 'error', err.message);
    } finally {
      setIsSubmitting(false);
      // PENTING: Pengguna TETAP langsung diarahkan ke halaman hasil evaluasi klinis!
      // Petugas kesehatan tidak boleh terhambat hanya karena spreadsheet lambat/offline.
      setView('result');
    }
  };

  // Fungsi Kirim Ulang Sinkronisasi (Retry Sync) dari ResultScreen
  const handleRetrySync = async () => {
    if (!lastSubmission || isRetrying) return;
    setIsRetrying(true);

    try {
      const result = await syncToSpreadsheet(lastSubmission.payload, { timeoutMs: 12000, maxRetries: 0 });
      if (result.success) {
        setSyncStatus('synced');
        setSyncError(null);
        updateLocalRecordStatus(lastSubmission.refId, 'synced');
      } else {
        setSyncStatus(result.status);
        setSyncError(result.message);
        updateLocalRecordStatus(lastSubmission.refId, result.status, result.message);
      }
    } catch (err) {
      setSyncStatus('error');
      setSyncError('Koneksi masih belum stabil. Silakan coba lagi nanti.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setEvaluationResult(null);
    setSyncStatus('idle');
    setSyncError(null);
    setRefId('');
    setLastSubmission(null);
    setView('form');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header Bar Minimalis Gaya Gojek */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ATQ
            </span>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">Form Kehamilan</h1>
              <p className="text-[11px] text-slate-500">Evaluasi Risiko Ibu Hamil</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-5 px-4">
        {view === 'form' ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Header Form */}
            <div className="border-b border-slate-100 px-6 py-5 bg-white">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Formulir Pasien</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Isi data pemeriksaan ibu hamil untuk mendapatkan evaluasi risiko.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* BAGIAN 1: INFORMASI PASIEN */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[11px]">1</span>
                  <span>Informasi Pasien</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label htmlFor="patientId" className="block text-xs font-semibold text-slate-700 mb-1">
                      ID Pasien <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="patientId"
                      name="patientId"
                      required
                      placeholder="Contoh: RM-001"
                      value={formData.patientId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-xs font-semibold text-slate-700 mb-1">
                      Umur Pasien (Tahun) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      min="10"
                      max="70"
                      required
                      placeholder="Contoh: 24"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* BAGIAN 2: PEMERIKSAAN FISIK & ANTROPOMETRI */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[11px]">2</span>
                  <span>Pemeriksaan Fisik & Antropometri</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label htmlFor="height" className="block text-xs font-semibold text-slate-700 mb-1">
                      Tinggi Badan (cm) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="height"
                      name="height"
                      required
                      placeholder="Contoh: 155"
                      value={formData.height}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-xs font-semibold text-slate-700 mb-1">
                      Berat Badan (kg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="weight"
                      name="weight"
                      required
                      placeholder="Contoh: 52"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="upperArmCircumference" className="block text-xs font-semibold text-slate-700 mb-1">
                      LILA (cm) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="upperArmCircumference"
                      name="upperArmCircumference"
                      required
                      placeholder="Normal ≥ 23.5 cm"
                      value={formData.upperArmCircumference}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="bellyCircumference" className="block text-xs font-semibold text-slate-700 mb-1">
                      Lingkar Perut (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="bellyCircumference"
                      name="bellyCircumference"
                      placeholder="Contoh: 80"
                      value={formData.bellyCircumference}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>

                  {liveBMI && (
                    <div className="sm:col-span-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Perhitungan IMT:</span>
                        <strong className="text-slate-900 font-bold">{liveBMI}</strong>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {liveBMICategory.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* BAGIAN 3: TANDA VITAL */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[11px]">3</span>
                  <span>Tanda Vital (Tekanan Darah)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label htmlFor="systolic" className="block text-xs font-semibold text-slate-700 mb-1">
                      Sistole (mmHg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="systolic"
                      name="systolic"
                      required
                      placeholder="Contoh: 110"
                      value={formData.systolic}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="diastolic" className="block text-xs font-semibold text-slate-700 mb-1">
                      Diastole (mmHg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="diastolic"
                      name="diastolic"
                      required
                      placeholder="Contoh: 70"
                      value={formData.diastolic}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* BAGIAN 4: KELUHAN PASIEN */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[11px]">4</span>
                  <span>Keluhan yang Dialami Pasien</span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Pilih keluhan yang dirasakan, lalu tentukan frekuensi kemunculannya:
                </p>

                {/* Opsi: Tidak Ada Keluhan */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={isNoComplaintChecked}
                      onChange={(e) => handleSelectNoComplaint(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Tidak Ada Keluhan (Kondisi Segar / Sehat)</span>
                  </label>
                </div>

                {/* Daftar Keluhan */}
                <div className="space-y-2 pt-1">
                  {COMPLAINT_LIST.map((item) => {
                    const entry = formData.complaintsMap[item] || { selected: false, frequency: 'Sering' };
                    return (
                      <div
                        key={item}
                        className={`p-3 rounded-xl border transition ${
                          entry.selected ? 'bg-blue-50/70 border-blue-300' : 'border-slate-200/70 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={entry.selected}
                              onChange={() => handleToggleComplaint(item)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <span>{item}</span>
                          </label>

                          {entry.selected && (
                            <div className="flex items-center space-x-3 pl-6 sm:pl-0 text-xs">
                              <span className="text-slate-400 text-[11px]">Frekuensi:</span>
                              {['Sering', 'Jarang', 'Tidak Pernah'].map((freq) => (
                                <label key={freq} className="inline-flex items-center space-x-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`freq-${item}`}
                                    value={freq}
                                    checked={entry.frequency === freq}
                                    onChange={() => handleFrequencyChange(item, freq)}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className={entry.frequency === freq ? 'font-semibold text-blue-700' : 'text-slate-600'}>
                                    {freq}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Keluhan Kustom / Tambahan */}
                  <div
                    className={`p-3 rounded-xl border transition ${
                      formData.hasCustomComplaint ? 'bg-blue-50/70 border-blue-300' : 'border-slate-200/70 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.hasCustomComplaint}
                          onChange={(e) => setFormData((prev) => ({ ...prev, hasCustomComplaint: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span>Keluhan Lainnya...</span>
                      </label>

                      {formData.hasCustomComplaint && (
                        <div className="flex items-center space-x-3 pl-6 sm:pl-0 text-xs">
                          <span className="text-slate-400 text-[11px]">Frekuensi:</span>
                          {['Sering', 'Jarang', 'Tidak Pernah'].map((freq) => (
                            <label key={freq} className="inline-flex items-center space-x-1 cursor-pointer">
                              <input
                                type="radio"
                                name="freq-custom"
                                value={freq}
                                checked={formData.customComplaintFrequency === freq}
                                onChange={() => setFormData((prev) => ({ ...prev, customComplaintFrequency: freq }))}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className={formData.customComplaintFrequency === freq ? 'font-semibold text-blue-700' : 'text-slate-600'}>
                                {freq}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {formData.hasCustomComplaint && (
                      <div className="mt-2.5 pl-6">
                        <input
                          type="text"
                          placeholder="Sebutkan keluhan pasien lainnya..."
                          value={formData.customComplaintName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, customComplaintName: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* BAGIAN 5: RIWAYAT OBSTETRI */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[11px]">5</span>
                  <span>Riwayat Obstetri & Paritas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label htmlFor="childOrder" className="block text-xs font-semibold text-slate-700 mb-1">
                      Hamil Anak Ke- <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="childOrder"
                      name="childOrder"
                      required
                      value={formData.childOrder}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    >
                      <option value="1">1 (Anak Pertama / Primigravida)</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value=">4">&gt; 4 (Grande Multipara)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="everPregnant" className="block text-xs font-semibold text-slate-700 mb-1">
                      Pernah Hamil Sebelumnya? <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="everPregnant"
                      name="everPregnant"
                      required
                      value={formData.everPregnant}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    >
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya</option>
                    </select>
                  </div>

                  {formData.everPregnant === 'Ya' && (
                    <div className="sm:col-span-2">
                      <label htmlFor="previousPregnancyRisk" className="block text-xs font-semibold text-slate-700 mb-1">
                        Riwayat Kehamilan Sebelumnya <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="previousPregnancyRisk"
                        name="previousPregnancyRisk"
                        required
                        value={formData.previousPregnancyRisk}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                      >
                        <option value="Risiko rendah">Risiko Rendah / Tanpa Komplikasi</option>
                        <option value="Risiko tinggi">Risiko Tinggi / Riwayat Komplikasi Persalinan</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* BAGIAN 6: CATATAN KLINIS BIDAN */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[11px]">6</span>
                  <span>Catatan Klinis & Diagnosa</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label htmlFor="diagnosis" className="block text-xs font-semibold text-slate-700 mb-1">
                      Diagnosa Awal <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="diagnosis"
                      name="diagnosis"
                      required
                      placeholder="Supervision of normal pregnancy, unspecified"
                      value={formData.diagnosis}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="palpation" className="block text-xs font-semibold text-slate-700 mb-1">
                      Palpasi / Catatan Khusus
                    </label>
                    <input
                      type="text"
                      id="palpation"
                      name="palpation"
                      placeholder="TFU sesuai gestasi, letak kepala..."
                      value={formData.palpation}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* TOMBOL SUBMIT GAYA GOJEK (SIMPEL, RAPIH, JELAS) */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menyimpan & Menganalisis Data...</span>
                    </>
                  ) : (
                    <span>Simpan & Lihat Saran Evaluasi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <ResultScreen
            evaluationResult={evaluationResult}
            refId={refId}
            syncStatus={syncStatus}
            syncError={syncError}
            onReset={handleReset}
            onRetrySync={handleRetrySync}
            isRetrying={isRetrying}
          />
        )}
      </main>
    </div>
  );
}

export default App;
