/**
 * Basis Pengetahuan Sistem Pakar (Rule-Based Forward Chaining)
 * Evaluasi Risiko Kehamilan Berdasarkan Rekomendasi Klinis & Data Log Book Bidan
 *
 * Rules:
 * 1. Usia Ibu (4T: Terlalu Muda < 20 thn atau Terlalu Tua > 35 thn)
 * 2. IMT (Indeks Massa Tubuh: Kurus < 18.5, Lebih 25-29.9, Obesitas >= 30)
 * 3. Tekanan Darah (Hipertensi >=140/90, Prehipertensi, Hipotensi <90/60)
 * 4. LILA (Lingkar Lengan Atas < 23.5 cm -> Kekurangan Energi Kronis / KEK)
 * 5. Keluhan Aktif (Multi-pilihan: Mual, Mual-Muntah, Sakit Kepala, Nyeri Perut Bawah, Pusing, Nyeri Ulu Hati, dll.)
 * 6. Riwayat Kehamilan Berisiko Tinggi (Jika Pernah Hamil = Ya)
 * 7. Paritas / Anak ke-berapa (Grande Multipara > 4, Multipara Tinggi = 4)
 */

export function calculateAge(birthDateString) {
  if (!birthDateString) return null;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

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

export function evaluateRisk(formData) {
  let score = 0;
  const tips = [];
  const flags = [];
  const clinicalNotes = [];

  // Parse input
  const age = formData.age !== '' && formData.age !== null 
    ? parseInt(formData.age, 10) 
    : calculateAge(formData.birthDate);

  const bmi = calculateBMI(formData.height, formData.weight);
  const systolic = parseFloat(formData.systolic);
  const diastolic = parseFloat(formData.diastolic);
  const lila = parseFloat(formData.upperArmCircumference);
  const childOrder = formData.childOrder;

  // Mendukung keluhan berupa Array (multi-select) maupun string tunggal
  const complaints = Array.isArray(formData.complaints)
    ? formData.complaints
    : (formData.complaint ? [formData.complaint] : []);

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
      tips.push(`Status gizi tergolong Kurus (IMT: ${bmi}). Tingkatkan asupan kalori dan protein seimbang, serta konsultasikan menu makanan dengan ahli gizi puskesmas.`);
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

  // Rule 5: Keluhan Aktif (Dapat memilih lebih dari satu)
  const isTidakAda = complaints.length === 0 || (complaints.length === 1 && complaints[0] === 'Tidak Ada');
  
  if (!isTidakAda) {
    complaints.forEach((c) => {
      if (c === 'Mual-Muntah') {
        score += 1;
        flags.push('Keluhan Mual-Muntah Aktif');
        tips.push('Mual & muntah: Makan porsi kecil namun sering (5–6 kali sehari). Hindari makanan berlemak/berbau tajam. Jika muntah >5 kali/hari, segera ke faskes.');
      } else if (c === 'Mual') {
        score += 0.5;
        tips.push('Mual: Konsumsi biskuit kering sebelum bangun dari tempat tidur dan minum air hangat.');
      } else if (c === 'Sakit Kepala') {
        score += 1;
        flags.push('Keluhan Sakit Kepala');
        tips.push('Sakit kepala: Waspadai gejala penyerta pre-eklampsia. Pastikan tekanan darah terkontrol dan istirahat cukup.');
      } else if (c === 'Nyeri Perut Bawah') {
        score += 1;
        flags.push('Keluhan Nyeri Perut Bawah');
        tips.push('Nyeri perut bawah: Istirahat tirah baring (bedrest). Jika disertai flek darah atau kram hebat, segera ke faskes.');
      } else if (c === 'Nyeri Ulu Hati') {
        score += 0.5;
        tips.push('Nyeri ulu hati: Hindari makanan asam/pedas dan jangan langsung berbaring setelah makan.');
      } else if (c === 'Pusing') {
        score += 1;
        flags.push('Keluhan Pusing');
        tips.push('Pusing: Cukupi konsumsi zat besi/tablet tambah darah dan hindari perubahan posisi tubuh secara mendadak.');
      } else if (c !== 'Tidak Ada') {
        // Keluhan kustom / lainnya
        tips.push(`Keluhan (${c}): Konsultasikan perkembangan keluhan ini saat kontrol dengan bidan/dokter.`);
      }
    });
  }

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

  // Kesimpulan Level Risiko (Forward Chaining)
  let level = 'rendah';
  let title = '';
  let message = '';

  if (score >= 5) {
    level = 'sangat_tinggi';
    title = 'Perhatian Khusus: Risiko Sangat Tinggi';
    message = 'Ditemukan kombinasi beberapa faktor risiko mayor. Sangat direkomendasikan untuk segera melakukan pemeriksaan dan konsultasi dengan dokter spesialis kebidanan dan kandungan (Sp.OG) di fasilitas kesehatan rujukan.';
  } else if (score >= 3) {
    level = 'tinggi';
    title = 'Perlu Perhatian Ekstra (Risiko Tinggi)';
    message = 'Berdasarkan data pemeriksaan, terdapat beberapa indikator risiko yang perlu perhatian medis khusus. Lakukan pemantauan ANC lebih intensif dan konsultasikan dengan dokter kandungan.';
  } else if (score >= 1) {
    level = 'sedang';
    title = 'Kondisi Perlu Dipantau (Risiko Sedang)';
    message = 'Terdapat satu atau beberapa faktor yang membutuhkan perhatian khusus. Tetap patuhi jadwal kunjungan ANC, konsumsi vitamin kehamilan secara teratur, dan jaga pola makan bergizi.';
  } else {
    level = 'rendah';
    title = 'Kondisi Relatif Terjaga (Risiko Rendah)';
    message = 'Data kehamilan Anda menunjukkan kondisi yang baik dan stabil. Teruskan pola hidup sehat, cukupi asupan cairan dan nutrisi, serta nikmati masa kehamilan Anda.';
    tips.push('Lanjutkan konsumsi tablet tambah darah / vitamin asam folat dan jadwalkan kontrol ANC sesuai usia kandungan.');
  }

  return {
    score,
    level,
    title,
    message,
    flags,
    tips,
    clinicalNotes,
    patientData: {
      patientId: formData.patientId,
      name: formData.name,
      nik: formData.nik,
      age: age,
      bmi: bmi,
      bmiCategory: getBMICategory(bmi),
      bloodPressure: (systolic && diastolic) ? `${systolic}/${diastolic} mmHg` : '-',
      upperArmCircumference: lila ? `${lila} cm` : '-',
      bellyCircumference: formData.bellyCircumference ? `${formData.bellyCircumference} cm` : '-',
      complaints: complaints.length > 0 ? complaints : ['Tidak Ada'],
      complaintText: complaints.join(', ') || 'Tidak Ada',
      everPregnant: formData.everPregnant,
      childOrder: formData.childOrder
    }
  };
}
