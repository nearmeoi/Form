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
  height: '',
  weight: '',
  upperArmCircumference: '',
  bellyCircumference: '',
  systolic: '',
  diastolic: '',
  complaints: [],
  hasCustomComplaint: false,
  customComplaint: '',
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
      if (name === 'birthDate') {
        const calculated = calculateAge(value);
        if (calculated !== null) {
          updated.age = calculated.toString();
        }
      }
      return updated;
    });
  };

  // Toggle checkbox biasa untuk keluhan
  const handleComplaintCheckbox = (item) => {
    setFormData((prev) => {
      const exists = prev.complaints.includes(item);
      const nextComplaints = exists
        ? prev.complaints.filter((c) => c !== item)
        : [...prev.complaints, item];
      return { ...prev, complaints: nextComplaints };
    });
  };

  const handleSelectNoComplaint = (checked) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        complaints: [],
        hasCustomComplaint: false,
        customComplaint: ''
      }));
    }
  };

  const isNoComplaintChecked = formData.complaints.length === 0 && !formData.hasCustomComplaint;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📋</span>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">KlinikApp Maternal</h1>
          </div>
          <span className="text-xs text-gray-500">Puskesmas / Pelayanan ANC</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-6 px-4">
        {view === 'form' ? (
          <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
            {/* Header Form */}
            <div className="border-b border-gray-200 px-6 py-5 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Formulir Skrining Ibu Hamil</h2>
              <p className="text-sm text-gray-600 mt-1">
                Lengkapi formulir pemeriksaan di bawah ini untuk mencatat data pasien dan mengevaluasi tingkat risiko kehamilan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* BAGIAN 1: IDENTITAS PASIEN */}
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="px-2 text-sm font-bold text-gray-800">
                  1. Identitas Pasien
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Pasien <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Nama lengkap pasien"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-1">
                      NIK (16 Digit) <span className="text-red-500">*</span>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                        Umur (Tahun) <span className="text-red-500">*</span>
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

                  {/* Info Ringkas IMT Otomatis */}
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

              {/* BAGIAN 4: KELUHAN PASIEN (CHECKBOX BIASA) */}
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="px-2 text-sm font-bold text-gray-800">
                  4. Keluhan Pasien
                </legend>
                <div className="space-y-3 mt-2">
                  <p className="text-xs text-gray-600">
                    Pilih keluhan yang dirasakan oleh ibu hamil (bisa pilih lebih dari satu):
                  </p>

                  {/* Checkbox: Tidak Ada Keluhan */}
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded">
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-gray-800">
                      <input
                        type="checkbox"
                        checked={isNoComplaintChecked}
                        onChange={(e) => handleSelectNoComplaint(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span>Tidak Ada Keluhan</span>
                    </label>
                  </div>

                  {/* Grid Checkbox Standar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {COMPLAINT_OPTIONS.map((item) => {
                      const isChecked = formData.complaints.includes(item);
                      return (
                        <label
                          key={item}
                          className="flex items-center space-x-2.5 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm text-gray-800"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleComplaintCheckbox(item)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}

                    {/* Checkbox Keluhan Lainnya */}
                    <label className="flex items-center space-x-2.5 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.hasCustomComplaint}
                        onChange={(e) => setFormData((prev) => ({ ...prev, hasCustomComplaint: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span>Lainnya</span>
                    </label>
                  </div>

                  {/* Input Teks Jika Keluhan Lainnya Dicetang */}
                  {formData.hasCustomComplaint && (
                    <div className="pt-1">
                      <label htmlFor="customComplaint" className="block text-xs text-gray-600 mb-1">
                        Sebutkan keluhan lainnya:
                      </label>
                      <input
                        type="text"
                        id="customComplaint"
                        placeholder="Contoh: Nyeri pinggang, sesak napas..."
                        value={formData.customComplaint}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customComplaint: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  )}
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
                    Gagal mengirim ke spreadsheet. Namun data tetap dapat dievaluasi.
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
