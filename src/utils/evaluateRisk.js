/**
 * Basis Pengetahuan Sistem Pakar (Rule-Based Forward Chaining)
 * Evaluasi Risiko Kehamilan Berdasarkan Rekomendasi Klinis & Data Log Book Bidan
 *
 * Klasifikasi Hasil Akhir:
 * - Risiko Rendah (Score < 2)
 * - Risiko Tinggi (Score >= 2)
 *
 * Rules:
 * 1. Usia Ibu (4T: Terlalu Muda < 20 thn atau Terlalu Tua > 35 thn)
 * 2. IMT (Indeks Massa Tubuh: Kurus < 18.5, Lebih 25-29.9, Obesitas >= 30)
 * 3. Tekanan Darah (Hipertensi >=140/90, Prehipertensi, Hipotensi <90/60)
 * 4. LILA (Lingkar Lengan Atas < 23.5 cm -> Kekurangan Energi Kronis / KEK)
 * 5. Keluhan dengan Frekuensi (Sering = 100%, Jarang = 50%, Tidak Pernah = 0)
 * 6. Riwayat Kehamilan Berisiko Tinggi (Jika Pernah Hamil = Ya)
 * 7. Paritas / Anak ke-berapa (Grande Multipara > 4, Multipara Tinggi = 4)
 */

export function calculateBMI(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const heightM = h / 100;
  const bmi = w / (heightM * heightM);
  return parseFloat(bmi.toFixed(2));
}

export function getBMICategory(bmi) {
  if (bmi === null || isNaN(bmi)) return { category: 'Belum terhitung', label: '-' };
  if (bmi < 18.5) return { category: 'Kurus', label: 'KURUS (< 18.5)' };
  if (bmi < 25.0) return { category: 'Normal', label: 'IDEAL (18.5 - 24.9)' };
  if (bmi < 30.0) return { category: 'Kelebihan BB', label: 'LEBIH (25.0 - 29.9)' };
  return { category: 'Obesitas', label: 'OBESITAS (≥ 30.0)' };
}

/**
 * Parsing teks tekanan darah seperti "120/80" atau "110 / 70"
 */
export function parseBloodPressure(bpString) {
  if (!bpString || typeof bpString !== 'string') return { systolic: null, diastolic: null };
  const parts = bpString.split(/[\/\-]/);
  if (parts.length >= 2) {
    const sys = parseFloat(parts[0].trim());
    const dia = parseFloat(parts[1].trim());
    return {
      systolic: !isNaN(sys) ? sys : null,
      diastolic: !isNaN(dia) ? dia : null
    };
  }
  return { systolic: null, diastolic: null };
}

export function evaluateRisk(formData) {
  let score = 0;
  const tips = [];
  const flags = [];
  const clinicalNotes = [];

  const age = formData.age !== '' && formData.age !== null 
    ? parseInt(formData.age, 10) 
    : null;

  const bmi = calculateBMI(formData.height, formData.weight);

  // Ambil sistole dan diastole baik dari field terpisah atau string tekanan darah terpadu
  let systolic = parseFloat(formData.systolic);
  let diastolic = parseFloat(formData.diastolic);
  if ((isNaN(systolic) || isNaN(diastolic)) && formData.bloodPressure) {
    const parsedBP = parseBloodPressure(formData.bloodPressure);
    if (parsedBP.systolic !== null) systolic = parsedBP.systolic;
    if (parsedBP.diastolic !== null) diastolic = parsedBP.diastolic;
  }

  const lila = parseFloat(formData.upperArmCircumference);
  const childOrder = formData.childOrder;

  // Rule 1: Usia Ibu
  if (age !== null && !isNaN(age)) {
    if (age < 20) {
      score += 1;
      flags.push('Usia Terlalu Muda (<20 th)');
      tips.push('Usia ibu terlalu muda (<20 tahun). Perlu pemantauan lebih intensif dan antenatal care (ANC) teratur minimal 6 kali selama kehamilan.');
    } else if (age > 35) {
      score += 1;
      flags.push('Usia Terlalu Tua (>35 th)');
      tips.push('Usia ibu berisiko tinggi (>35 tahun). Disarankan pemeriksaan berkala dan konsultasi dengan dokter spesialis kandungan (Sp.OG).');
    }
  }

  // Rule 2: IMT (Status Gizi)
  if (bmi !== null && !isNaN(bmi)) {
    if (bmi < 18.5) {
      score += 1;
      flags.push(`Kurus (IMT: ${bmi})`);
      tips.push(`Status gizi tergolong Kurus (IMT: ${bmi}). Tingkatkan asupan kalori dan protein seimbang, serta konsultasikan menu makanan dengan ahli gizi.`);
    } else if (bmi >= 25.0 && bmi < 30.0) {
      score += 1;
      flags.push(`Kelebihan BB (IMT: ${bmi})`);
      tips.push(`Status gizi tergolong Lebih (IMT: ${bmi}). Jaga pola makan bergizi seimbang serta batasi makanan berkalori tinggi atau terlalu manis.`);
    } else if (bmi >= 30.0) {
      score += 2;
      flags.push(`Obesitas (IMT: ${bmi})`);
      tips.push(`Status gizi tergolong Obesitas (IMT: ${bmi}). Risiko komplikasi kehamilan seperti diabetes gestasional dan hipertensi meningkat. Wajib konsultasi ke dokter dan ahli gizi.`);
    }
  }

  // Rule 3: Tekanan Darah
  if (!isNaN(systolic) && !isNaN(diastolic) && systolic > 0 && diastolic > 0) {
    if (systolic >= 140 || diastolic >= 90) {
      score += 2;
      flags.push(`Hipertensi (${systolic}/${diastolic} mmHg)`);
      tips.push(`Tekanan darah tinggi terdeteksi (${systolic}/${diastolic} mmHg). Waspadai risiko pre-eklampsia. SEGERA jadwalkan pemeriksaan dengan dokter spesialis kandungan.`);
    } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 85 && diastolic < 90)) {
      score += 1;
      flags.push(`Prehipertensi (${systolic}/${diastolic} mmHg)`);
      tips.push(`Tekanan darah berada di batas ambang tinggi (${systolic}/${diastolic} mmHg). Pantau tensi secara berkala, kurangi konsumsi garam berlebih, dan kelola stres.`);
    } else if (systolic < 90 || diastolic < 60) {
      score += 1;
      flags.push(`Hipotensi (${systolic}/${diastolic} mmHg)`);
      tips.push(`Tekanan darah relatif rendah (${systolic}/${diastolic} mmHg). Hindari berdiri secara tiba-tiba dari posisi duduk/berbaring, perbanyak cairan tubuh, dan istirahat cukup.`);
    }
  }

  // Rule 4: LILA (KEK - Kurang Energi Kronis)
  if (!isNaN(lila) && lila > 0) {
    if (lila < 23.5) {
      score += 2;
      flags.push(`KEK (LILA: ${lila} cm)`);
      tips.push(`Ukuran LILA < 23.5 cm menunjukkan indikasi Kekurangan Energi Kronis (KEK). Dianjurkan memperoleh biskuit PMT (Pemberian Makanan Tambahan) dan suplemen zat besi/asam folat.`);
    }
  }

  // Rule 5: Keluhan dengan Tingkat Frekuensi (Sering, Jarang, Tidak Pernah)
  const complaintItems = Array.isArray(formData.complaintItems) ? formData.complaintItems : [];

  complaintItems.forEach((item) => {
    const { name, frequency } = item;
    if (!frequency || frequency === 'Tidak Pernah') return;

    const multiplier = frequency === 'Sering' ? 1 : 0.5;
    const freqLabel = frequency === 'Sering' ? 'Sering' : 'Jarang';

    if (name === 'Mual-Muntah') {
      const addedScore = 1 * multiplier;
      score += addedScore;
      flags.push(`Mual-Muntah (${freqLabel})`);
      tips.push(`Mual & muntah (${freqLabel}): Makan porsi kecil namun sering (5–6 kali sehari). Hindari makanan berlemak/berbau tajam. Jika muntah berulang (>5 kali/hari) atau lemas, segera ke fasilitas kesehatan.`);
    } else if (name === 'Mual') {
      const addedScore = 0.5 * multiplier;
      score += addedScore;
      tips.push(`Mual (${freqLabel}): Konsumsi biskuit kering sebelum bangun dari tempat tidur dan minum air hangat sedikit-sedikit.`);
    } else if (name === 'Sakit Kepala') {
      const addedScore = 1 * multiplier;
      score += addedScore;
      flags.push(`Sakit Kepala (${freqLabel})`);
      tips.push(`Sakit kepala (${freqLabel}): Waspadai gejala penyerta pre-eklampsia. Pastikan tekanan darah terkontrol dan istirahat cukup.`);
    } else if (name === 'Nyeri Perut Bawah') {
      const addedScore = 1 * multiplier;
      score += addedScore;
      flags.push(`Nyeri Perut Bawah (${freqLabel})`);
      tips.push(`Nyeri perut bawah (${freqLabel}): Istirahat tirah baring (bedrest). Jika disertai flek darah atau kram hebat, segera ke faskes.`);
    } else if (name === 'Nyeri Ulu Hati') {
      const addedScore = 0.5 * multiplier;
      score += addedScore;
      tips.push(`Nyeri ulu hati (${freqLabel}): Hindari makanan asam/pedas dan jangan langsung berbaring setelah makan.`);
    } else if (name === 'Pusing') {
      const addedScore = 1 * multiplier;
      score += addedScore;
      flags.push(`Pusing (${freqLabel})`);
      tips.push(`Pusing (${freqLabel}): Cukupi konsumsi zat besi/tablet tambah darah dan hindari perubahan posisi tubuh secara mendadak.`);
    } else {
      if (frequency === 'Sering') score += 0.5;
      tips.push(`Keluhan ${name} (${freqLabel}): Konsultasikan perkembangan keluhan ini saat kontrol dengan bidan/dokter.`);
    }
  });

  // Rule 6: Riwayat Kehamilan Sebelumnya
  if (formData.everPregnant === 'Ya') {
    if (formData.previousPregnancyRisk === 'Risiko tinggi') {
      score += 2;
      flags.push('Riwayat Kehamilan Risiko Tinggi');
      tips.push('Terdapat riwayat komplikasi atau risiko tinggi pada kehamilan sebelumnya. Konsultasikan rencana persalinan dan pemantauan khusus dengan dokter spesialis.');
    }
  } else {
    clinicalNotes.push('Primigravida (kehamilan pertama): Berikan edukasi komprehensif mengenai persiapan persalinan dan tanda-tanda bahaya kehamilan.');
  }

  // Rule 7: Paritas (Anak Ke-)
  if (childOrder === '>4') {
    score += 2;
    flags.push('Grande Multipara (Anak > 4)');
    tips.push('Kategori Grande Multipara (kehamilan ke-5 ke atas) memiliki risiko atonia uteri atau posisi plasenta abnormal. Dianjurkan merencanakan persalinan di fasilitas kesehatan rujukan/RS.');
  } else if (childOrder === '4') {
    score += 1;
    flags.push('Multipara Tinggi (Anak ke-4)');
    tips.push('Kehamilan anak ke-4 memerlukan pengawasan ekstra terhadap kekuatan kontraksi dan kondisi jalan lahir saat mendekati persalinan.');
  } else if (childOrder === '1') {
    clinicalNotes.push('Kehamilan anak pertama: Bekali ibu dengan pengetahuan tanda awal persalinan dan perawatan nifas.');
  }

  // Level Risiko Final (Klasifikasi 2 Level: Rendah vs Tinggi)
  let level = 'rendah';
  let title = '';
  let message = '';

  if (score >= 2) {
    level = 'tinggi';
    title = 'Kondisi Risiko Tinggi';
    message = 'Berdasarkan data pemeriksaan, terdeteksi indikator risiko yang memerlukan perhatian khusus. Disarankan melakukan pemantauan antenatal care (ANC) lebih intensif dan konsultasi ke fasilitas kesehatan rujukan / dokter spesialis kandungan (Sp.OG).';
  } else {
    level = 'rendah';
    title = 'Kondisi Risiko Rendah';
    message = 'Data pemeriksaan kehamilan menunjukkan kondisi yang baik dan stabil. Teruskan pola hidup sehat, cukupi asupan nutrisi dan cairan, serta lakukan pemeriksaan kehamilan secara berkala sesuai jadwal.';
    tips.push('Lanjutkan konsumsi tablet tambah darah / vitamin asam folat dan jadwalkan kontrol ANC sesuai usia kandungan.');
  }

  // Siapkan teks ringkasan keluhan aktif
  const activeComplaintsText = complaintItems
    .filter(c => c.frequency && c.frequency !== 'Tidak Pernah')
    .map(c => `${c.name} (${c.frequency})`)
    .join(', ');

  const finalBP = (systolic && diastolic)
    ? `${systolic}/${diastolic} mmHg`
    : (formData.bloodPressure || '-');

  return {
    score: parseFloat(score.toFixed(1)),
    level,
    title,
    message,
    flags,
    tips,
    clinicalNotes,
    patientData: {
      patientId: formData.patientId,
      age: age,
      bmi: bmi,
      bmiCategory: getBMICategory(bmi),
      bloodPressure: finalBP,
      upperArmCircumference: lila ? `${lila} cm` : '-',
      complaintText: activeComplaintsText || 'Tidak Ada Keluhan',
      everPregnant: formData.everPregnant,
      childOrder: formData.childOrder
    }
  };
}
