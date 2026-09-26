import { useState } from 'react';

function App() {
  const [formData, setFormData] = useState({
    patientId: '',
    age: '',
    complaint: 'Tidak',
    diagnosis: '',
    height: '',
    weight: '',
    bloodPressure: '',
    upperArmCircumference: '',
    palpation: '',
    everPregnant: 'Tidak',
    previousPregnancyRisk: 'Risiko rendah',
    childOrder: '1',
    deliveryMethod: 'Normal'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const url = import.meta.env.VITE_GAS_URL;

    if (!url) {
      console.error("VITE_GAS_URL is not set");
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    const data = new URLSearchParams({
      id_pasien: formData.patientId,
      umur: formData.age,
      keluhan: formData.complaint,
      diagnosa: formData.diagnosis,
      tinggi_badan: formData.height,
      berat_badan: formData.weight,
      tekanan_darah: formData.bloodPressure,
      lila: formData.upperArmCircumference,
      palpasi: formData.palpation,
      pernah_hamil: formData.everPregnant,
      kehamilan_sebelum: formData.previousPregnancyRisk,
      anak_ke: formData.childOrder,
      partum: formData.deliveryMethod
    });

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: data
      });
      
      setSubmitStatus('success');
      setFormData({
        patientId: '',
        age: '',
        complaint: 'Tidak',
        diagnosis: '',
        height: '',
        weight: '',
        bloodPressure: '',
        upperArmCircumference: '',
        palpation: '',
        everPregnant: 'Tidak',
        previousPregnancyRisk: 'Risiko rendah',
        childOrder: '1',
        deliveryMethod: 'Normal'
      });
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-900 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-white text-xl font-bold tracking-wide">KlinikApp</h1>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendataan Pasien</h2>
            <p className="text-gray-600 text-sm md:text-base">Masukkan detail informasi di bawah ini.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label htmlFor="patientId" className="block text-sm font-semibold text-gray-800 mb-1">
                ID Pasien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="patientId"
                name="patientId"
                required
                value={formData.patientId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-semibold text-gray-800 mb-1">
                Umur <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="age"
                name="age"
                min="0"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="complaint" className="block text-sm font-semibold text-gray-800 mb-1">
                Keluhan <span className="text-red-500">*</span>
              </label>
              <select
                id="complaint"
                name="complaint"
                required
                value={formData.complaint}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none bg-white"
              >
                <option value="Ya">Ya</option>
                <option value="Kadang">Kadang</option>
                <option value="Tidak">Tidak</option>
              </select>
            </div>

            <div>
              <label htmlFor="diagnosis" className="block text-sm font-semibold text-gray-800 mb-1">
                Diagnosa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="diagnosis"
                name="diagnosis"
                required
                value={formData.diagnosis}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-semibold text-gray-800 mb-1">
                Tinggi Badan (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="height"
                name="height"
                required
                value={formData.height}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-semibold text-gray-800 mb-1">
                Berat Badan (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                required
                value={formData.weight}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="bloodPressure" className="block text-sm font-semibold text-gray-800 mb-1">
                Tekanan Darah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="bloodPressure"
                name="bloodPressure"
                placeholder="120/80"
                required
                value={formData.bloodPressure}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="upperArmCircumference" className="block text-sm font-semibold text-gray-800 mb-1">
                LILA (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="upperArmCircumference"
                name="upperArmCircumference"
                required
                value={formData.upperArmCircumference}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="palpation" className="block text-sm font-semibold text-gray-800 mb-1">
                Palpasi <span className="text-red-500">*</span>
              </label>
              <textarea
                id="palpation"
                name="palpation"
                required
                rows="3"
                value={formData.palpation}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label htmlFor="everPregnant" className="block text-sm font-semibold text-gray-800 mb-1">
                Pernah Hamil <span className="text-red-500">*</span>
              </label>
              <select
                id="everPregnant"
                name="everPregnant"
                required
                value={formData.everPregnant}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none bg-white"
              >
                <option value="Ya">Ya</option>
                <option value="Tidak">Tidak</option>
              </select>
            </div>

            <div>
              <label htmlFor="previousPregnancyRisk" className="block text-sm font-semibold text-gray-800 mb-1">
                Kehamilan Sebelumnya <span className="text-red-500">*</span>
              </label>
              <select
                id="previousPregnancyRisk"
                name="previousPregnancyRisk"
                required
                value={formData.previousPregnancyRisk}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none bg-white"
              >
                <option value="Risiko rendah">Risiko rendah</option>
                <option value="Risiko tinggi">Risiko tinggi</option>
              </select>
            </div>

            <div>
              <label htmlFor="childOrder" className="block text-sm font-semibold text-gray-800 mb-1">
                Anak ke <span className="text-red-500">*</span>
              </label>
              <select
                id="childOrder"
                name="childOrder"
                required
                value={formData.childOrder}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none bg-white"
              >
                <option value="1">1</option>
                <option value=">2">&gt;2</option>
              </select>
            </div>

            <div>
              <label htmlFor="deliveryMethod" className="block text-sm font-semibold text-gray-800 mb-1">
                Partum/Melahirkan <span className="text-red-500">*</span>
              </label>
              <select
                id="deliveryMethod"
                name="deliveryMethod"
                required
                value={formData.deliveryMethod}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Operasi">Operasi</option>
              </select>
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white rounded-lg py-3 font-semibold hover:bg-gray-800 focus:outline-none disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Mengirim...' : 'Simpan Data'}
              </button>
              
              {submitStatus === 'success' && (
                <p className="text-green-600 text-sm mt-3 text-center font-medium">
                  Data berhasil disimpan!
                </p>
              )}
              
              {submitStatus === 'error' && (
                <p className="text-red-600 text-sm mt-3 text-center font-medium">
                  Terjadi kesalahan. Silakan coba lagi.
                </p>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
