const STORAGE_KEYS = {
  FILAMENTS: 'printflow_filaments_v1',
  FILES: 'printflow_files_v1',
  PRINTERS: 'printflow_printers_v1',
  SETTINGS: 'printflow_settings_v1',
};

// Đọc dữ liệu từ localStorage
export function loadFromStorage(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Lỗi đọc localStorage với key: ${key}`, err);
    return fallbackValue;
  }
}

// Lưu dữ liệu vào localStorage
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Lỗi ghi localStorage với key: ${key}`, err);
  }
}

export { STORAGE_KEYS };

// Format dung lượng file byte -> KB/MB/GB
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Format định dạng tiền tệ VND
export function formatVND(amount) {
  if (!amount || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Xuất toàn bộ dữ liệu ra file JSON
export function exportAllDataAsJSON(data) {
  const exportPayload = {
    appName: 'PrintFlow 3D Hub',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    filaments: data.filaments,
    files: data.files,
    printers: data.printers,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `PrintFlow_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Đọc file JSON từ người dùng tải lên
export function importDataFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.filaments && !parsed.files) {
          reject(new Error('File JSON không hợp lệ hoặc không có dữ liệu PrintFlow.'));
          return;
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error('Không thể phân tích định dạng file JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsText(file);
  });
}
