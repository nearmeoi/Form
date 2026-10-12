import { useState, useMemo } from 'react';
import ResultScreen from './components/ResultScreen';
import { evaluateRisk, calculateAge, calculateBMI, getBMICategory } from './utils/evaluateRisk';

const COMPLAINT_OPTIONS = [
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
  name: '',
  nik: '',
  birthDate: '',
  age: '',
  complaints: [], // Array multi-select
  hasCustomComplaint: false,
  customComplaint: '',
  height: '',
  weight: '',
  bellyCircumference: '',
  systolic: '',
  diastolic: '',
  upperArmCircumference: '',
  childOrder: '1',
  everPregnant: 'Tidak',
  previousPregnancyRisk: 'Risiko rendah',
  palpation: '',
  diagnosis: 'Supervision of normal pregnancy, unspecified'
};

function App() {
  const [view, setView] = useState('form'); // 'form' | 'result'
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');

  // Hitung umur otomatis dari tanggal lahir jika diisi
  const computedAge = useMemo(() => {
    if (formData.birthDate) {
      return calculateAge(formData.birthDate);
    }
    return formData.age ? parseInt(formData.age, 10) : '';
  }, [formData.birthDate, formData.age]);

  // Live BMI calculation
  const liveBMI = useMemo(() => {
    return calculateBMI(formData.height, formData.weight);
  }, [formData.height, formData.weight]);

  const liveBMICategory = useMemo(() => {
    return getBMICategory(liveBMI);
  }, [liveBMI]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Sinkronkan umur jika tanggal lahir diubah
      if (name === 'birthDate') {
        const calculated = calculateAge(value);
        if (calculated !== null) {
          updated.age = calculated.toString();
        }
      }
      return updated;
    });
  };

  // Handler toggle keluhan (Checkbox / Multi-Select)
  const handleComplaintToggle = (item) => {
    setFormData((prev) => {
      const exists = prev.complaints.includes(item);
      const nextComplaints = exists
        ? prev.complaints.filter((c) => c !== item)
        : [...prev.complaints, item];
      return { ...prev, complaints: nextComplaints };
    });
  };

  const handleSelectNoComplaint = () => {
    setFormData((prev) => ({
      ...prev,
      complaints: [],
      hasCustomComplaint: false,
      customComplaint: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Kumpulkan seluruh keluhan yang dipilih
    let allComplaints = [...formData.complaints];
    if (formData.hasCustomComplaint && formData.customComplaint.trim()) {
      allComplaints.push(formData.customComplaint.trim());
    }
    if (allComplaints.length === 0) {
      allComplaints = ['Tidak Ada'];
    }

    const complaintString = allComplaints.join(', ');
    const finalAge = formData.age || (computedAge !== '' ? computedAge.toString() : '');

    const evaluatedData = {
      ...formData,
      age: finalAge,
      complaints: allComplaints,
      complaint: complaintString,
      bmi: liveBMI,
      bmiCategory: liveBMICategory.label
    };

    const url = import.meta.env.VITE_GAS_URL;

    try {
      if (url) {
        const payload = new URLSearchParams({
          id_pasien: evaluatedData.patientId,
          nama_pasien: evaluatedData.name,
          nik: evaluatedData.nik,
          tgl_lahir: evaluatedData.birthDate,
          umur: evaluatedData.age,
          keluhan_utama: complaintString,
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
          pernah_hamil: evaluatedData.everPregnant,
          kehamilan_sebelum: evaluatedData.everPregnant === 'Ya' ? evaluatedData.previousPregnancyRisk : '-',
          palpasi: evaluatedData.palpation,
          diagnosa: evaluatedData.diagnosis
        });

        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          body: payload
        });
      } else {
        console.warn('VITE_GAS_URL belum diset di .env. Data tidak dikirim ke Google Sheets, langsung menampilkan hasil evaluasi.');
      }

      setSubmitStatus('success');

      // Evaluasi risiko sistem pakar forward chaining
      const result = evaluateRisk(evaluatedData);
      setEvaluationResult(result);
      setView('result');
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setEvaluationResult(null);
    setSubmitStatus('idle');
    setView('form');
  };

  const isNoComplaintActive = formData.complaints.length === 0 && !formData.hasCustomComplaint;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🩺</span>
            <div>
              <h1 className="text-white text-lg sm:text-xl font-bold tracking-tight">KlinikApp Maternal Expert</h1>
              <p className="text-xs text-slate-400">Sistem Skrining Risiko Kesehatan Ibu Hamil</p>
            </div>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 font-medium px-2.5 py-1 rounded-full border border-emerald-500/30">
            Log Book Integration
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {view === 'form' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Formulir Skrining & Rekam Medis Ibu Hamil</h2>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Silakan lengkapi data pemeriksaan pasien secara akurat. Sistem pakar akan menganalisis indikator risiko (4T, KEK, Hipertensi, IMT, multi-keluhan, dan riwayat paritas) serta memberikan saran rekomendasi klinis.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              {/* SECTION 1: IDENTITAS PASIEN */}
              <div>
                <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">1</span>
                  <h3 className="font-semibold text-slate-800 text-base">Identitas Pasien</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label htmlFor="patientId" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      No. Register / ID Pasien <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="patientId"
                      name="patientId"
                      required
                      placeholder="Contoh: RM-2026-001"
                      value={formData.patientId}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nama Lengkap Pasien <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Nama lengkap ibu hamil"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="nik" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      NIK (16 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nik"
                      name="nik"
                      required
                      maxLength={16}
                      pattern="[0-9]{16}"
                      title="NIK harus 16 digit angka"
                      placeholder="7309xxxxxxxxxxxx"
                      value={formData.nik}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="birthDate" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="age" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Umur (Tahun) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        min="10"
                        max="70"
                        required
                        placeholder="Th"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ANTROPOMETRI & IMT */}
              <div>
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">2</span>
                    <h3 className="font-semibold text-slate-800 text-base">Antropometri & Status Gizi</h3>
                  </div>
                  {liveBMI && (
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                      IMT: <strong className="text-indigo-600">{liveBMI}</strong> ({liveBMICategory.label})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="height" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Berat Badan (kg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="weight"
                      name="weight"
                      required
                      placeholder="Contoh: 54"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="upperArmCircumference" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      LILA (cm) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="upperArmCircumference"
                      name="upperArmCircumference"
                      required
                      placeholder="Batas: 23.5 cm"
                      value={formData.upperArmCircumference}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="bellyCircumference" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Lingkar Perut (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="bellyCircumference"
                      name="bellyCircumference"
                      placeholder="Contoh: 82"
                      value={formData.bellyCircumference}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: TANDA VITAL & KELUHAN (MULTI-SELECT) */}
              <div>
                <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">3</span>
                  <h3 className="font-semibold text-slate-800 text-base">Tanda Vital & Keluhan Pasien</h3>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label htmlFor="systolic" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="diastolic" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Diastole (mmHg) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="diastolic"
                        name="diastolic"
                        required
                        placeholder="Contoh: 75"
                        value={formData.diastolic}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* KELUHAN MULTI-SELECT CHIPS */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Keluhan Pasien (Bisa Pilih Lebih Dari Satu) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-500">
                        {isNoComplaintActive ? 'Tidak ada keluhan aktif' : `${formData.complaints.length + (formData.hasCustomComplaint && formData.customComplaint.trim() ? 1 : 0)} keluhan dipilih`}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      {/* Tombol Opsi: Tidak Ada Keluhan */}
                      <div>
                        <button
                          type="button"
                          onClick={handleSelectNoComplaint}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            isNoComplaintActive
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isNoComplaintActive ? '✓' : '○'}</span>
                          <span>Tidak Ada Keluhan (Kondisi Normal)</span>
                        </button>
                      </div>

                      {/* Chips Pilihan Keluhan */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                        {COMPLAINT_OPTIONS.map((item) => {
                          const isSelected = formData.complaints.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleComplaintToggle(item)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span>{item}</span>
                            </button>
                          );
                        })}

                        {/* Toggle Keluhan Lainnya */}
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, hasCustomComplaint: !prev.hasCustomComplaint }))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            formData.hasCustomComplaint
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span>{formData.hasCustomComplaint ? '✓' : '+'}</span>
                          <span>Keluhan Lainnya...</span>
                        </button>
                      </div>

                      {/* Input teks keluhan tambahan */}
                      {formData.hasCustomComplaint && (
                        <div className="pt-2">
                          <input
                            type="text"
                            placeholder="Tuliskan keluhan lain pasien di sini..."
                            value={formData.customComplaint}
                            onChange={(e) => setFormData((prev) => ({ ...prev, customComplaint: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: RIWAYAT OBSTETRI */}
              <div>
                <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">4</span>
                  <h3 className="font-semibold text-slate-800 text-base">Riwayat Obstetri & Paritas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  <div>
                    <label htmlFor="childOrder" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kehamilan Anak Ke- <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="childOrder"
                      name="childOrder"
                      required
                      value={formData.childOrder}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    >
                      <option value="1">1 (Anak Pertama / Primigravida)</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value=">4">&gt; 4 (Grande Multipara)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="everPregnant" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Pernah Hamil Sebelumnya? <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="everPregnant"
                      name="everPregnant"
                      required
                      value={formData.everPregnant}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    >
                      <option value="Tidak">Tidak (Kehamilan Pertama)</option>
                      <option value="Ya">Ya (Pernah)</option>
                    </select>
                  </div>

                  {formData.everPregnant === 'Ya' ? (
                    <div>
                      <label htmlFor="previousPregnancyRisk" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Riwayat Kehamilan Lalu <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="previousPregnancyRisk"
                        name="previousPregnancyRisk"
                        required
                        value={formData.previousPregnancyRisk}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                      >
                        <option value="Risiko rendah">Risiko Rendah / Normal</option>
                        <option value="Risiko tinggi">Risiko Tinggi / Komplikasi</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-full p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
                        Kehamilan pertama: Riwayat kehamilan lampau tidak berlaku.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: CATATAN KLINIS & DIAGNOSA */}
              <div>
                <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">5</span>
                  <h3 className="font-semibold text-slate-800 text-base">Catatan Klinis Bidan (Log Book)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label htmlFor="diagnosis" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="palpation" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hasil Palpasi & Catatan
                    </label>
                    <input
                      type="text"
                      id="palpation"
                      name="palpation"
                      placeholder="Contoh: TFU sesuai usia gestasi, punggung kiri, letak kepala"
                      value={formData.palpation}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Menyimpan ke Spreadsheet & Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan ke Spreadsheet & Evaluasi Risiko</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                {submitStatus === 'error' && (
                  <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm text-center">
                    Gagal mengirim ke Google Apps Script, namun data tetap dapat dievaluasi secara lokal.
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          <ResultScreen evaluationResult={evaluationResult} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
