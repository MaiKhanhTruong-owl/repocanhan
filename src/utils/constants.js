// Danh mục chất liệu nhựa in 3D phổ biến
export const MATERIAL_TYPES = [
  { id: 'PLA', name: 'PLA', tempNozzle: '190-220°C', tempBed: '45-60°C', color: '#10b981' },
  { id: 'PLA+', name: 'PLA+ / Pro', tempNozzle: '205-225°C', tempBed: '50-60°C', color: '#059669' },
  { id: 'PETG', name: 'PETG', tempNozzle: '230-250°C', tempBed: '70-85°C', color: '#0284c7' },
  { id: 'ABS', name: 'ABS', tempNozzle: '240-260°C', tempBed: '90-110°C', color: '#ea580c' },
  { id: 'ASA', name: 'ASA', tempNozzle: '240-260°C', tempBed: '90-110°C', color: '#d97706' },
  { id: 'TPU', name: 'TPU (Dẻo)', tempNozzle: '210-230°C', tempBed: '30-50°C', color: '#8b5cf6' },
  { id: 'SILK_PLA', name: 'Silk PLA', tempNozzle: '205-225°C', tempBed: '50-60°C', color: '#ec4899' },
  { id: 'WOOD_PLA', name: 'Wood / Gỗ', tempNozzle: '190-210°C', tempBed: '45-60°C', color: '#b45309' },
  { id: 'CARBON_FIBER', name: 'CF (Carbon)', tempNozzle: '250-280°C', tempBed: '80-100°C', color: '#475569' },
  { id: 'NYLON_PA', name: 'Nylon / PA', tempNozzle: '250-270°C', tempBed: '80-100°C', color: '#4f46e5' },
  { id: 'PC', name: 'Polycarbonate', tempNozzle: '260-290°C', tempBed: '100-115°C', color: '#64748b' },
  { id: 'RESIN', name: 'Resin (SLA)', tempNozzle: 'N/A', tempBed: 'N/A', color: '#06b6d4' },
  { id: 'OTHER', name: 'Khác', tempNozzle: 'Tùy chỉnh', tempBed: 'Tùy chỉnh', color: '#6b7280' },
];

// Các thương hiệu nhựa phổ biến
export const POPULAR_BRANDS = [
  'Bambu Lab',
  'eSun',
  'Sunlu',
  'Polymaker',
  'Creality',
  'Overture',
  'Anycubic',
  'Eryone',
  'Flashforge',
  'Prusament',
  'Tinmorry',
  'Kingroon',
  'Khác'
];

// Bảng màu thông dụng để chọn nhanh
export const PRESET_COLORS = [
  { name: 'Đen (Black)', hex: '#18181b' },
  { name: 'Trắng (White)', hex: '#f8fafc' },
  { name: 'Xám đậm (Dark Gray)', hex: '#475569' },
  { name: 'Xám bạc (Silver/Gray)', hex: '#94a3b8' },
  { name: 'Đỏ tươi (Fire Red)', hex: '#ef4444' },
  { name: 'Đỏ đô (Burgundy)', hex: '#991b1b' },
  { name: 'Cam (Orange)', hex: '#f97316' },
  { name: 'Vàng tươi (Yellow)', hex: '#eab308' },
  { name: 'Xanh lá (Green)', hex: '#22c55e' },
  { name: 'Xanh lục đậm (Dark Green)', hex: '#15803d' },
  { name: 'Xanh ngọc (Cyan/Mint)', hex: '#06b6d4' },
  { name: 'Xanh dương (Blue)', hex: '#3b82f6' },
  { name: 'Xanh navy (Navy Blue)', hex: '#1e3a8a' },
  { name: 'Tím (Purple)', hex: '#a855f7' },
  { name: 'Hồng (Pink)', hex: '#ec4899' },
  { name: 'Vàng ánh kim (Silk Gold)', hex: '#d97706' },
  { name: 'Đồng đỏ (Silk Copper)', hex: '#b45309' },
  { name: 'Trong suốt (Clear/Natural)', hex: '#e2e8f0' },
  { name: 'Nâu gỗ (Wood Brown)', hex: '#78350f' },
  { name: 'Cầu vồng (Rainbow/Multicolor)', hex: 'rainbow' },
];

// Các trạng thái / cột Kanban của Cuộn nhựa
export const FILAMENT_COLUMNS = [
  {
    id: 'loaded',
    title: 'Đang nạp máy / AMS',
    icon: 'Printer',
    color: 'emerald',
    description: 'Cuộn nhựa đang lắp trực tiếp trên máy in hoặc khay AMS/hút ẩm'
  },
  {
    id: 'drybox',
    title: 'Hộp sấy / Chống ẩm',
    icon: 'Flame',
    color: 'amber',
    description: 'Đang bảo quản trong hộp sấy hạt hút ẩm hoặc tủ chống ẩm'
  },
  {
    id: 'storage',
    title: 'Trong kho / Kệ lưu trữ',
    icon: 'Package',
    color: 'blue',
    description: 'Cuộn nhựa còn nguyên hoặc dự phòng trên giá để đồ'
  },
  {
    id: 'depleted',
    title: 'Sắp hết / Đã hết',
    icon: 'Archive',
    color: 'slate',
    description: 'Dưới 50g hoặc đã hết dùng để lưu vết lịch sử'
  }
];

// Các trạng thái / cột Kanban của File in 3D
export const FILE_COLUMNS = [
  {
    id: 'queued',
    title: 'Hàng đợi / Ý tưởng',
    icon: 'ListFilter',
    color: 'indigo',
    description: 'File vừa kéo thả vào, cần thiết lập hoặc cắt lát'
  },
  {
    id: 'ready',
    title: 'Đã sẵn sàng in',
    icon: 'CheckCircle2',
    color: 'emerald',
    description: 'Đã có file cắt lát gcode/3mf và gán màu nhựa'
  },
  {
    id: 'printing',
    title: 'Đang in trên máy',
    icon: 'PlayCircle',
    color: 'amber',
    description: 'Máy in đang chạy tác vụ này'
  },
  {
    id: 'completed',
    title: 'Đã in thành công',
    icon: 'Trophy',
    color: 'teal',
    description: 'Sản phẩm đã in hoàn tất, có thể trừ nhựa'
  },
  {
    id: 'failed',
    title: 'In lỗi / Thất bại',
    icon: 'AlertTriangle',
    color: 'rose',
    description: 'In bị lỗi hoặc hư hỏng để theo dõi hao hụt'
  }
];
