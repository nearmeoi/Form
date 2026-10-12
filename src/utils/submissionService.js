/**
 * Service untuk penanganan pengiriman data & sinkronisasi dengan Google Spreadsheet.
 *
 * Fitur Keamanan:
 * 1. Pencegahan Race Condition & Duplikasi (Unique Ref ID & Idempotency)
 * 2. Timeout Protection (AbortController) agar tidak hang tanpa batas waktu
 * 3. Offline-First Resilience (Selalu dicadangkan ke localStorage)
 * 4. Automatic Retry untuk koneksi yang terputus sekejap
 * 5. Manual Retry Trigger langsung dari halaman hasil skrining
 */

const STORAGE_KEY = 'maternal_screening_history';
const LATEST_KEY = 'maternal_latest_submission';
const DEFAULT_TIMEOUT_MS = 12000;

/**
 * Buat ID Referensi Unik (contoh: REF-261012-A8D2)
 */
export function generateReferenceId() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${dateStr}-${randomPart}`;
}

/**
 * Simpan data pemeriksaan ke LocalStorage browser
 */
export function saveToLocalQueue(record) {
  try {
    localStorage.setItem(LATEST_KEY, JSON.stringify(record));

    const existingJson = localStorage.getItem(STORAGE_KEY);
    const history = existingJson ? JSON.parse(existingJson) : [];
    
    // Simpan hingga 50 riwayat terakhir
    const updated = [record, ...history.filter(item => item.refId !== record.refId)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Gagal menyimpan ke LocalStorage:', err);
  }
}

/**
 * Perbarui status sinkronisasi suatu record di LocalStorage
 */
export function updateLocalRecordStatus(refId, syncStatus, errorMessage = null) {
  try {
    const existingJson = localStorage.getItem(STORAGE_KEY);
    if (!existingJson) return;

    const history = JSON.parse(existingJson);
    const updated = history.map(item => {
      if (item.refId === refId) {
        return {
          ...item,
          syncStatus,
          lastSyncAttempt: new Date().toISOString(),
          syncError: errorMessage
        };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Update latest jika cocok
    const latestJson = localStorage.getItem(LATEST_KEY);
    if (latestJson) {
      const latest = JSON.parse(latestJson);
      if (latest.refId === refId) {
        localStorage.setItem(LATEST_KEY, JSON.stringify({
          ...latest,
          syncStatus,
          lastSyncAttempt: new Date().toISOString(),
          syncError: errorMessage
        }));
      }
    }
  } catch (err) {
    console.warn('Gagal memperbarui status record lokal:', err);
  }
}

/**
 * Kirim data ke Google Apps Script Spreadsheet dengan proteksi timeout & fallback
 */
export async function syncToSpreadsheet(payloadData, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = 1 } = options;
  const url = import.meta.env.VITE_GAS_URL;

  // 1. Cek ketersediaan URL endpoint
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      success: false,
      status: 'no_url',
      message: 'URL Google Apps Script belum disetel di file .env (Data aman di penyimpanan lokal).'
    };
  }

  // 2. Cek koneksi internet browser
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      status: 'offline',
      message: 'Perangkat sedang offline. Data tersimpan di memori perangkat dan dapat disinkronkan saat ada internet.'
    };
  }

  // Siapkan parameter form urlencoded
  const params = new URLSearchParams();
  Object.keys(payloadData).forEach(key => {
    params.append(key, payloadData[key] !== undefined && payloadData[key] !== null ? payloadData[key] : '');
  });

  // Eksekusi pengiriman dengan auto-retry jika transient failure
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script web apps mengharuskan no-cors dari domain luar
        body: params,
        signal: controller.signal
      });

      clearTimeout(timerId);
      return {
        success: true,
        status: 'synced',
        message: 'Data berhasil disinkronkan ke Google Spreadsheet.'
      };
    } catch (err) {
      clearTimeout(timerId);
      lastError = err;

      // Jika timeout atau network blip dan masih ada retry tersisa, jeda sejenak
      if (attempt <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
  }

  // Jika semua percobaan gagal
  const isTimeout = lastError?.name === 'AbortError';
  return {
    success: false,
    status: isTimeout ? 'timeout' : 'error',
    message: isTimeout
      ? 'Koneksi ke spreadsheet melewati batas waktu (12 detik). Kemungkinan antrean server padat.'
      : (lastError?.message || 'Gagal mengirim data ke Google Spreadsheet.')
  };
}
