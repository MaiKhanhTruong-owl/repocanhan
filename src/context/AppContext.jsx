import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  exportAllDataAsJSON,
  importDataFromJSON,
} from '../utils/storage';
import { INITIAL_FILAMENTS, INITIAL_FILES, INITIAL_PRINTERS } from '../utils/sampleData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AppContext = createContext();

// Mapper helper: DB (snake_case) -> JS (camelCase)
function mapFilamentFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    material: row.material,
    colorName: row.color_name,
    colorHex: row.color_hex,
    initialWeight: Number(row.initial_weight),
    remainingWeight: Number(row.remaining_weight),
    diameter: row.diameter,
    tempNozzle: row.temp_nozzle,
    tempBed: row.temp_bed,
    status: row.status,
    slot: row.slot,
    price: Number(row.price),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFilamentToDb(item, userId) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    brand: item.brand,
    material: item.material,
    color_name: item.colorName,
    color_hex: item.colorHex,
    initial_weight: Number(item.initialWeight || 1000),
    remaining_weight: Number(item.remainingWeight || 1000),
    diameter: item.diameter || '1.75',
    temp_nozzle: item.tempNozzle || '210-230',
    temp_bed: item.tempBed || '55-65',
    status: item.status || 'loaded',
    slot: item.slot || '',
    price: Number(item.price || 0),
    notes: item.notes || '',
    updated_at: new Date().toISOString(),
  };
}

function mapFileFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    originalFileName: row.original_file_name,
    fileType: row.file_type,
    sizeBytes: Number(row.size_bytes),
    category: row.category,
    assignedFilamentId: row.assigned_filament_id,
    estimatedWeight: Number(row.estimated_weight),
    estimatedTime: row.estimated_time,
    layerHeight: row.layer_height,
    infill: row.infill,
    targetPrinter: row.target_printer,
    tags: row.tags || [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFileToDb(item, userId) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    original_file_name: item.originalFileName || item.name,
    file_type: item.fileType || 'stl',
    size_bytes: Number(item.sizeBytes || 0),
    category: item.category || 'queued',
    assigned_filament_id: item.assignedFilamentId || null,
    estimated_weight: Number(item.estimatedWeight || 0),
    estimated_time: item.estimatedTime || '1h 30m',
    layer_height: item.layerHeight || '0.20',
    infill: item.infill || '20%',
    target_printer: item.targetPrinter || '',
    tags: item.tags || [],
    notes: item.notes || '',
    updated_at: new Date().toISOString(),
  };
}

export function AppProvider({ children }) {
  const { user } = useAuth();

  // State: Filaments (Cuộn nhựa)
  const [filaments, setFilaments] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.FILAMENTS, INITIAL_FILAMENTS);
  });

  // State: Print Files (File in 3D)
  const [files, setFiles] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.FILES, INITIAL_FILES);
  });

  // State: Printers (Máy in)
  const [printers, setPrinters] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.PRINTERS, INITIAL_PRINTERS);
  });

  // Navigation & Filter state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [materialFilter, setMaterialFilter] = useState('ALL');

  // Modals state
  const [isFilamentModalOpen, setIsFilamentModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState(null);

  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState(null);

  // Global Toast notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ĐỒNG BỘ TỪ CLOUD (SUPABASE) KHI ĐĂNG NHẬP
  useEffect(() => {
    if (!user || !supabase) return;

    const fetchCloudData = async () => {
      try {
        // Tải filaments từ Supabase
        const { data: filData, error: filErr } = await supabase
          .from('filaments')
          .select('*')
          .order('created_at', { ascending: false });

        if (!filErr && filData && filData.length > 0) {
          setFilaments(filData.map(mapFilamentFromDb));
        }

        // Tải files từ Supabase
        const { data: fileData, error: fileErr } = await supabase
          .from('print_files')
          .select('*')
          .order('created_at', { ascending: false });

        if (!fileErr && fileData && fileData.length > 0) {
          setFiles(fileData.map(mapFileFromDb));
        }

        showToast('Đã đồng bộ dữ liệu từ Cloud!');
      } catch (err) {
        console.error('Lỗi tải dữ liệu Supabase:', err);
      }
    };

    fetchCloudData();
  }, [user, showToast]);

  // Luôn lưu bản sao vào LocalStorage làm cache offline
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FILAMENTS, filaments);
  }, [filaments]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FILES, files);
  }, [files]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PRINTERS, printers);
  }, [printers]);

  // ====== THAO TÁC VỚI CUỘN NHỰA (FILAMENTS) ======
  const addFilament = async (newFilament) => {
    const item = {
      ...newFilament,
      id: 'fil-' + Date.now(),
      createdAt: new Date().toISOString(),
      remainingWeight: Number(newFilament.remainingWeight || newFilament.initialWeight || 1000),
      initialWeight: Number(newFilament.initialWeight || 1000),
    };
    setFilaments((prev) => [item, ...prev]);
    showToast(`Đã thêm cuộn nhựa: "${item.name}"`);

    // Lưu lên Supabase nếu đã đăng nhập
    if (user && supabase) {
      await supabase.from('filaments').insert([mapFilamentToDb(item, user.id)]);
    }
    return item;
  };

  const updateFilament = async (id, updates) => {
    setFilaments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
    showToast('Đã cập nhật thông tin cuộn nhựa');

    if (user && supabase) {
      const current = filaments.find((f) => f.id === id);
      if (current) {
        const merged = { ...current, ...updates };
        await supabase.from('filaments').update(mapFilamentToDb(merged, user.id)).eq('id', id);
      }
    }
  };

  const deleteFilament = async (id) => {
    const target = filaments.find((f) => f.id === id);
    setFilaments((prev) => prev.filter((item) => item.id !== id));
    setFiles((prev) =>
      prev.map((f) => (f.assignedFilamentId === id ? { ...f, assignedFilamentId: null } : f))
    );
    showToast(`Đã xóa cuộn nhựa: "${target?.name || ''}"`, 'info');

    if (user && supabase) {
      await supabase.from('filaments').delete().eq('id', id);
    }
  };

  const moveFilament = (filamentId, newStatus) => {
    updateFilament(filamentId, { status: newStatus });
    showToast('Đã chuyển trạng thái cuộn nhựa');
  };

  const adjustFilamentWeight = (id, deltaGrams) => {
    const target = filaments.find((f) => f.id === id);
    if (!target) return;
    const newWeight = Math.max(0, Math.min(target.initialWeight, Number(target.remainingWeight) + deltaGrams));
    updateFilament(id, { remainingWeight: newWeight });
  };

  // ====== THAO TÁC VỚI FILE IN 3D (FILES) ======
  const addFile = async (newFile) => {
    const item = {
      ...newFile,
      id: 'file-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setFiles((prev) => [item, ...prev]);
    showToast(`Đã lưu file in: "${item.name}"`);

    if (user && supabase) {
      await supabase.from('print_files').insert([mapFileToDb(item, user.id)]);
    }
    return item;
  };

  const handleDroppedComputerFiles = async (fileList, targetCategory = 'queued') => {
    const newItems = Array.from(fileList).map((file, idx) => {
      const ext = file.name.split('.').pop().toLowerCase();
      let detectedType = 'stl';
      if (['3mf', 'gcode', 'step', 'stp', 'obj', 'ply', 'zip'].includes(ext)) {
        detectedType = ext === 'stp' ? 'step' : ext;
      }

      return {
        id: 'file-' + (Date.now() + idx),
        name: file.name,
        originalFileName: file.name,
        fileType: detectedType,
        sizeBytes: file.size,
        category: targetCategory,
        assignedFilamentId: null,
        estimatedWeight: 50,
        estimatedTime: '2h 00m',
        layerHeight: '0.20',
        infill: '20%',
        targetPrinter: printers[0]?.name || 'Máy in 3D',
        tags: ['File nạp từ máy tính'],
        notes: `Nạp lúc ${new Date().toLocaleTimeString('vi-VN')}`,
        createdAt: new Date().toISOString(),
      };
    });

    setFiles((prev) => [...newItems, ...prev]);
    showToast(`Đã nạp thành công ${newItems.length} file vào danh mục!`);

    if (user && supabase) {
      const dbPayload = newItems.map((item) => mapFileToDb(item, user.id));
      await supabase.from('print_files').insert(dbPayload);
    }
  };

  const updateFile = async (id, updates) => {
    setFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
    showToast('Đã lưu thông tin file');

    if (user && supabase) {
      const current = files.find((f) => f.id === id);
      if (current) {
        const merged = { ...current, ...updates };
        await supabase.from('print_files').update(mapFileToDb(merged, user.id)).eq('id', id);
      }
    }
  };

  const deleteFile = async (id) => {
    const target = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((item) => item.id !== id));
    showToast(`Đã xóa file: "${target?.name || ''}"`, 'info');

    if (user && supabase) {
      await supabase.from('print_files').delete().eq('id', id);
    }
  };

  const moveFile = (fileId, newCategory) => {
    updateFile(fileId, { category: newCategory });
    showToast('Đã cập nhật tiến độ in của file');
  };

  const assignFilamentToFile = (fileId, filamentId) => {
    updateFile(fileId, { assignedFilamentId: filamentId });
    const fil = filaments.find((f) => f.id === filamentId);
    const file = files.find((f) => f.id === fileId);
    showToast(`Đã gán nhựa "${fil?.name || 'Mới'}" cho file "${file?.name || ''}"`);
  };

  const deductWeightForJob = (fileId) => {
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile || !targetFile.assignedFilamentId) {
      showToast('File này chưa được gán cuộn nhựa nào để trừ!', 'error');
      return;
    }
    const grams = Number(targetFile.estimatedWeight) || 0;
    if (grams <= 0) {
      showToast('Khối lượng ước tính bằng 0g, không có gì để trừ!', 'info');
      return;
    }

    adjustFilamentWeight(targetFile.assignedFilamentId, -grams);
    showToast(`Đã trừ ${grams}g nhựa khỏi cuộn tương ứng!`);
  };

  const resetToSampleData = () => {
    if (window.confirm('Khôi phục toàn bộ về dữ liệu mẫu ban đầu? Các dữ liệu hiện tại sẽ được thay thế.')) {
      setFilaments(INITIAL_FILAMENTS);
      setFiles(INITIAL_FILES);
      setPrinters(INITIAL_PRINTERS);
      showToast('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  const handleExportData = () => {
    exportAllDataAsJSON({ filaments, files, printers });
    showToast('Đã xuất file sao lưu JSON về máy tính!');
  };

  const handleImportData = async (file) => {
    try {
      const data = await importDataFromJSON(file);
      if (data.filaments) setFilaments(data.filaments);
      if (data.files) setFiles(data.files);
      if (data.printers) setPrinters(data.printers);
      showToast('Đã nhập dữ liệu từ file JSON thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi nhập file JSON', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        filaments,
        files,
        printers,
        setPrinters,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        materialFilter,
        setMaterialFilter,
        isFilamentModalOpen,
        setIsFilamentModalOpen,
        editingFilament,
        setEditingFilament,
        isFileModalOpen,
        setIsFileModalOpen,
        editingFile,
        setEditingFile,
        toast,
        showToast,
        addFilament,
        updateFilament,
        deleteFilament,
        moveFilament,
        adjustFilamentWeight,
        addFile,
        handleDroppedComputerFiles,
        updateFile,
        deleteFile,
        moveFile,
        assignFilamentToFile,
        deductWeightForJob,
        resetToSampleData,
        handleExportData,
        handleImportData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
