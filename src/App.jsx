import { useState, useMemo } from 'react';
import ResultScreen from './components/ResultScreen';
import { evaluateRisk, calculateBMI, getBMICategory } from './utils/evaluateRisk';

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
  // Simpan status setiap keluhan: { [namaKeluhan]: { selected: boolean, frequency: 'Sering' | 'Jarang' | 'Tidak Pernah' } }
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
  const [submitStatus, setSubmitStatus] = useState('idle');

  // Live BMI calculation
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
          // Default jika baru dicentang
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
          selected: frequency !== 'Tidak Pernah',
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
          acc[curr] = { selected: false, frequency: 'Tidak Pernah' };
          return acc;
        }, {}),
        hasCustomComplaint: false,
        customComplaintName: '',
        customComplaintFrequency: 'Tidak Pernah'
      }));
    }
  };

  // Periksa apakah tidak ada keluhan yang aktif
  const hasActiveComplaints = useMemo(() => {
    const fromList = Object.values(formData.complaintsMap).some(
      (c) => c.selected && c.frequency !== 'Tidak Pernah'
    );
    const fromCustom = formData.hasCustomComplaint && formData.customComplaintName.trim() && formData.customComplaintFrequency !== 'Tidak Pernah';
    return fromList || fromCustom;
  }, [formData.complaintsMap, formData.hasCustomComplaint, formData.customComplaintName, formData.customComplaintFrequency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Kumpulkan keluhan beserta frekuensinya
    const complaintItems = [];
    COMPLAINT_LIST.forEach((name) => {
      const entry = formData.complaintsMap[name];
      if (entry && entry.selected && entry.frequency !== 'Tidak Pernah') {
        complaintItems.push({ name, frequency: entry.frequency });
      }
    });

    if (
      formData.hasCustomComplaint &&
      formData.customComplaintName.trim() &&
      formData.customComplaintFrequency !== 'Tidak Pernah'
    ) {
      complaintItems.push({
        name: formData.customComplaintName.trim(),
        frequency: formData.customComplaintFrequency
      });
    }

    const complaintString = complaintItems.length > 0
      ? complaintItems.map((c) => `${c.name} (${c.frequency})`).join(', ')
      : 'Tidak Ada Keluhan';

    const evaluatedData = {
      ...formData,
      complaintItems: complaintItems,
      complaint: complaintString,
      bmi: liveBMI,
      bmiCategory: liveBMICategory.label
    };

    const url = import.meta.env.VITE_GAS_URL;

    try {
      if (url) {
        const payload = new URLSearchParams({
          id_pasien: evaluatedData.patientId,
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📋</span>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">KlinikApp Maternal</h1>
          </div>
          <span className="text-xs text-gray-500">Form Skrining Kehamilan</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-6 px-4">
        {view === 'form' ? (
          <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
            {/* Header Form */}
            <div className="border-b border-gray-200 px-6 py-5 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Formulir Skrining Kesehatan Ibu Hamil</h2>
              <p className="text-sm text-gray-600 mt-1">
                Lengkapi informasi pemeriksaan di bawah ini untuk mencatat data dan melihat evaluasi risiko kehamilan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* BAGIAN 1: INFORMASI PASIEN */}
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="px-2 text-sm font-bold text-gray-800">
                  1. Informasi Pasien
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                      No. Register / ID Pasien <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="patientId"
                      name="patientId"
                      required
                      placeholder="Contoh: RM-001"
                      value={formData.patientId}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                      Umur Pasien (Tahun) <span className="text-red-500">*</span>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </fieldset>

              {/* BAGIAN 2: PEMERIKSAAN FISIK & ANTROPOMETRI */}
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="px-2 text-sm font-bold text-gray-800">
                  2. Pemeriksaan Fisik & Antropometri
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                      Tinggi Badan (cm) <span className="text-red-500">*</span>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                      Berat Badan (kg) <span className="text-red-500">*</span>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="upperArmCircumference" className="block text-sm font-medium text-gray-700 mb-1">
                      LILA (cm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="upperArmCircumference"
                      name="upperArmCircumference"
                      required
                      placeholder="Batas normal ≥ 23.5 cm"
                      value={formData.upperArmCircumference}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="bellyCircumference" className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  {liveBMI && (
                    <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded p-2.5 text-xs text-blue-900 flex items-center justify-between">
                      <span>Perhitungan IMT Otomatis: <strong>{liveBMI}</strong></span>
                      <span className="font-semibold">{liveBMICategory.label}</span>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* BAGIAN 3: TANDA VITAL */}
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="px-2 text-sm font-bold text-gray-800">
                  3. Tanda Vital (Tekanan Darah)
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label htmlFor="systolic" className="block text-sm font-medium text-gray-700 mb-1">
                      Sistole (mmHg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="systolic"
                      name="systolic"
                      required
                      placeholder="Contoh: 110"
                      value={formData.systolic}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="diastolic" className="block text-sm font-medium text-gray-700 mb-1">
                      Diastole (mmHg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="diastolic"
                      name="diastolic"
                      required
                      placeholder="Contoh: 70"
                      value={formData.diastolic}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </fieldset>

              {/* BAGIAN 4: KELUHAN PASIEN (DENGAN TINGKAT FREKUENSI) */}
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="px-2 text-sm font-bold text-gray-800">
                  4. Keluhan Pasien
                </legend>
                <div className="space-y-3 mt-2">
                  <p className="text-xs text-gray-600">
                    Centang keluhan yang dialami, lalu tentukan frekuensi kemunculannya (<strong>Sering</strong>, <strong>Jarang</strong>, atau <strong>Tidak Pernah</strong>):
                  </p>

                  {/* Opsi: Tidak Ada Keluhan */}
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded">
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-gray-800">
                      <input
                        type="checkbox"
                        checked={!hasActiveComplaints}
                        onChange={(e) => handleSelectNoComplaint(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span>Tidak Ada Keluhan (Kondisi Sehat / Normal)</span>
                    </label>
                  </div>

                  {/* Daftar Keluhan dengan Pilihan Frekuensi */}
                  <div className="space-y-2 pt-1">
                    {COMPLAINT_LIST.map((item) => {
                      const entry = formData.complaintsMap[item] || { selected: false, frequency: 'Sering' };
                      return (
                        <div
                          key={item}
                          className={`p-2.5 rounded border transition ${
                            entry.selected ? 'bg-blue-50/50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {/* Checkbox Nama Keluhan */}
                            <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-gray-800">
                              <input
                                type="checkbox"
                                checked={entry.selected}
                                onChange={() => handleToggleComplaint(item)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span>{item}</span>
                            </label>

                            {/* Opsi Frekuensi (Muncul saat dicentang) */}
                            {entry.selected && (
                              <div className="flex items-center space-x-3 pl-6 sm:pl-0 text-xs">
                                <span className="text-gray-500 font-medium">Frekuensi:</span>
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
                                    <span className={entry.frequency === freq ? 'font-semibold text-blue-700' : 'text-gray-600'}>
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

                    {/* Keluhan Tambahan / Lainnya */}
                    <div
                      className={`p-2.5 rounded border transition ${
                        formData.hasCustomComplaint ? 'bg-blue-50/50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-gray-800">
                          <input
                            type="checkbox"
                            checked={formData.hasCustomComplaint}
                            onChange={(e) => setFormData((prev) => ({ ...prev, hasCustomComplaint: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span>Keluhan Lainnya...</span>
                        </label>

                        {formData.hasCustomComplaint && (
                          <div className="flex items-center space-x-3 pl-6 sm:pl-0 text-xs">
                            <span className="text-gray-500 font-medium">Frekuensi:</span>
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
                                <span className={formData.customComplaintFrequency === freq ? 'font-semibold text-blue-700' : 'text-gray-600'}>
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
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* BAGIAN 5: RIWAYAT OBSTETRI */}
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="px-2 text-sm font-bold text-gray-800">
                  5. Riwayat Obstetri & Paritas
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label htmlFor="childOrder" className="block text-sm font-medium text-gray-700 mb-1">
                      Hamil Anak Ke- <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="childOrder"
                      name="childOrder"
                      required
                      value={formData.childOrder}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="1">1 (Anak Pertama / Primigravida)</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value=">4">&gt; 4 (Grande Multipara)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="everPregnant" className="block text-sm font-medium text-gray-700 mb-1">
                      Pernah Hamil Sebelumnya? <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="everPregnant"
                      name="everPregnant"
                      required
                      value={formData.everPregnant}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya</option>
                    </select>
                  </div>

                  {formData.everPregnant === 'Ya' && (
                    <div className="md:col-span-2">
                      <label htmlFor="previousPregnancyRisk" className="block text-sm font-medium text-gray-700 mb-1">
                        Riwayat Kehamilan Sebelumnya <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="previousPregnancyRisk"
                        name="previousPregnancyRisk"
                        required
                        value={formData.previousPregnancyRisk}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="Risiko rendah">Risiko Rendah / Normal</option>
                        <option value="Risiko tinggi">Risiko Tinggi / Riwayat Komplikasi</option>
                      </select>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* BAGIAN 6: CATATAN KLINIS BIDAN */}
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="px-2 text-sm font-bold text-gray-800">
                  6. Catatan Klinis & Diagnosa
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnosa Awal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="diagnosis"
                      name="diagnosis"
                      required
                      placeholder="Supervision of normal pregnancy, unspecified"
                      value={formData.diagnosis}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="palpation" className="block text-sm font-medium text-gray-700 mb-1">
                      Palpasi / Catatan Bidan
                    </label>
                    <input
                      type="text"
                      id="palpation"
                      name="palpation"
                      placeholder="TFU sesuai usia gestasi, letak kepala..."
                      value={formData.palpation}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </fieldset>

              {/* TOMBOL SUBMIT */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? 'Menyimpan Data...' : 'Simpan Data Pasien & Lihat Saran Evaluasi'}
                </button>

                {submitStatus === 'error' && (
                  <p className="text-xs text-red-600 text-center mt-2">
                    Gagal mengirim ke spreadsheet. Namun data tetap dapat dievaluasi secara lokal.
                  </p>
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
