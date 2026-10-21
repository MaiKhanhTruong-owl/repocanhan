import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Radio,
  Zap,
  BatteryCharging,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Info,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Sliders,
  ExternalLink,
  Cable,
  Maximize2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function EspWiringDiagram() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // State chọn tab / góc nhìn
  const [activeTab, setActiveTab] = useState('diagram'); // 'diagram' | 'pinout' | 'guide' | 'code'
  const [selectedWire, setSelectedWire] = useState(null); // id của dây đang chọn highlight
  const [showPowerCircuit, setShowPowerCircuit] = useState(true); // Hiển thị mạch TP4056 & Pin

  // Checklist 6 linh kiện (Lưu vào localStorage)
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('esp32_wiring_checklist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      esp32: false,
      nrf24: false,
      breadboard: false,
      power3v3: false,
      capacitor: false,
      usbc: false,
    };
  });

  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('esp32_wiring_checklist', JSON.stringify(checklist));
    } catch (e) {}
  }, [checklist]);

  const toggleCheckItem = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 6) * 100);

  // Danh sách các đường dây nối SPI & Nguồn
  const wires = [
    {
      id: 'vcc',
      name: 'VCC (3.3V)',
      color: '#ef4444', // Red
      strokeWidth: 3.5,
      nrfPin: 'Pin 2 (VCC)',
      espPin: 'Chân 3.3V (hoặc nguồn 3.3V riêng)',
      desc: 'Nguồn 3.3V cho NRF24L01. TUYỆT ĐỐI KHÔNG CẤP 5V kẻo cháy chip!',
      type: 'power',
    },
    {
      id: 'gnd',
      name: 'GND (Mass chung)',
      color: '#71717a', // Zinc
      strokeWidth: 3.5,
      nrfPin: 'Pin 1 (GND)',
      espPin: 'Chân GND chung',
      desc: 'Nối đất chung giữa ESP32-S3, NRF24L01 và mạch sạc TP4056.',
      type: 'power',
    },
    {
      id: 'ce',
      name: 'CE (Chip Enable)',
      color: '#f97316', // Orange
      strokeWidth: 3,
      nrfPin: 'Pin 3 (CE)',
      espPin: 'GPIO 9',
      desc: 'Điều khiển kích hoạt phát (TX) hoặc lắng nghe nhận (RX).',
      type: 'spi',
    },
    {
      id: 'csn',
      name: 'CSN (SPI Chip Select)',
      color: '#a855f7', // Purple
      strokeWidth: 3,
      nrfPin: 'Pin 4 (CSN)',
      espPin: 'GPIO 10',
      desc: 'Chọn thiết bị trên bus SPI (Tích cực mức THẤP - LOW).',
      type: 'spi',
    },
    {
      id: 'sck',
      name: 'SCK (SPI Clock)',
      color: '#eab308', // Yellow
      strokeWidth: 3,
      nrfPin: 'Pin 5 (SCK)',
      espPin: 'GPIO 12',
      desc: 'Xung nhịp đồng bộ truyền nhận dữ liệu tốc độ cao.',
      type: 'spi',
    },
    {
      id: 'mosi',
      name: 'MOSI (Master Out Slave In)',
      color: '#22c55e', // Green
      strokeWidth: 3,
      nrfPin: 'Pin 6 (MOSI)',
      espPin: 'GPIO 11',
      desc: 'Đường truyền dữ liệu từ ESP32-S3 sang module NRF24L01.',
      type: 'spi',
    },
    {
      id: 'miso',
      name: 'MISO (Master In Slave Out)',
      color: '#3b82f6', // Blue
      strokeWidth: 3,
      nrfPin: 'Pin 7 (MISO)',
      espPin: 'GPIO 13',
      desc: 'Đường nhận dữ liệu từ module NRF24L01 về ESP32-S3.',
      type: 'spi',
    },
    {
      id: 'irq',
      name: 'IRQ (Ngắt - Tùy chọn)',
      color: '#06b6d4', // Cyan
      strokeWidth: 2,
      strokeDash: '4 3',
      nrfPin: 'Pin 8 (IRQ)',
      espPin: 'GPIO 14 (Không bắt buộc)',
      desc: 'Chân ngắt báo hiệu có gói tin mới nhận được (Thường để trống khi test cơ bản).',
      type: 'optional',
    },
  ];

  // Code Arduino test mẫu
  const testSketchCode = `/*
 * PrintFlow ESP32-S3 + NRF24L01+ PA/LNA Test Connection
 * Sử dụng thư viện: RF24 by TMRh20
 * Chân cấu hình:
 *   CE  -> GPIO 9
 *   CSN -> GPIO 10
 *   SCK -> GPIO 12
 *   MOSI-> GPIO 11
 *   MISO-> GPIO 13
 */

#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <printf.h>

#define PIN_CE   9
#define PIN_CSN  10
#define PIN_SCK  12
#define PIN_MISO 13
#define PIN_MOSI 11

RF24 radio(PIN_CE, PIN_CSN);

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);
  printf_begin();

  Serial.println("\\n===========================================");
  Serial.println(">>> KIEM TRA KET NOI ESP32-S3 + NRF24L01 <<<");
  Serial.println("===========================================");

  // Khoi tao bus SPI tren ESP32-S3
  SPI.begin(PIN_SCK, PIN_MISO, PIN_MOSI, PIN_CSN);

  if (!radio.begin(&SPI)) {
    Serial.println("[LOI!] Khong tim thay module NRF24L01!");
    Serial.println("-> Kiem tra lai nguon 3.3V, day Dupont va tu 10uF.");
    while (1) { delay(1000); }
  }

  // Kiem tra chip co phan hoi thuc su khong
  if (radio.isChipConnected()) {
    Serial.println("[OK] Chip NRF24L01+ da KET NOI THANH CONG!");
  } else {
    Serial.println("[CANH BAO] SPI phan hoi nhung chip chua on dinh!");
  }

  // Cau hinh an toan de test phong thi nghiem (Cong suat thap tranh gay nhiễu)
  radio.setPALevel(RF24_PA_LOW);      // PA_MIN / PA_LOW / PA_HIGH / PA_MAX
  radio.setDataRate(RF24_1MBPS);      // 250KBPS / 1MBPS / 2MBPS
  radio.setChannel(76);               // Kenh 76 (2.476 GHz)
  radio.setAutoAck(true);

  // In toan bo thanh ghi chi tiet
  Serial.println("\\n--- CHI TIET THANH GHI NRF24L01 ---");
  radio.printDetails();
  Serial.println("===========================================");
}

void loop() {
  // Chu ky kiem tra ket noi moi 3 giay
  bool connected = radio.isChipConnected();
  Serial.printf("[Trang thai] Ket noi NRF24: %s\\n", connected ? "BINH THUONG" : "MAT KET NOI");
  delay(3000);
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testSketchCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-[1550px] space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 border-zinc-800'
            : 'bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shrink-0 shadow-md shadow-indigo-500/20">
              <div
                className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                  isDark ? 'bg-zinc-900' : 'bg-white'
                }`}
              >
                <Cpu className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Sơ Đồ Đấu Nối ESP32-S3 & NRF24L01+ (PA/LNA)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Waveshare N16R8
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  2.4 GHz SPI Bus
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-3xl ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Sơ đồ trực quan đấu dây thử nghiệm an toàn giữa bộ điều khiển <strong>ESP32-S3</strong>, mô-đun thu phát{' '}
                <strong>NRF24L01+ PA/LNA</strong> và mạch sạc pin <strong>TP4056 3.7V</strong>.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div
            className={`flex items-center p-1 rounded-xl border self-start lg:self-auto shrink-0 ${
              isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'diagram'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sơ đồ trực quan</span>
            </button>
            <button
              onClick={() => setActiveTab('pinout')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pinout'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cable className="w-3.5 h-3.5" />
              <span>Bảng chân (Pinout)</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Linh kiện ({completedCount}/6)</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Code Arduino Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CẢNH BÁO QUAN TRỌNG TRƯỚC KHI ĐẤU DÂY */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs ${
          isDark
            ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm text-rose-500">CẢNH BÁO NGUỒN ĐIỆN & QUY ĐỊNH AN TOÀN:</h4>
            <p>
              <strong>1. Điện áp VCC:</strong> NRF24L01 <strong>CHỈ CHỊU 3.3V</strong>. Cấp nhầm 5V vào chân VCC sẽ làm cháy chip ngay lập tức! (Dù các chân SPI chịu được mức logic 5V).
            </p>
            <p>
              <strong>2. Tụ bù xung 10–47µF:</strong> Module PA/LNA tiêu thụ dòng đỉnh ~115mA-150mA khi phát sóng. Bắt buộc gắn 1 tụ hóa 10µF–47µF sát chân VCC & GND để tránh sụt áp gây reset module.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg font-bold bg-rose-500/20 border border-rose-500/40 text-rose-400">
            Max VCC: 3.6V
          </span>
        </div>
      </div>

      {/* 3. NỘI DUNG CHÍNH THEO TAB */}
      {activeTab === 'diagram' && (
        <div className="space-y-5">
          {/* Thanh công cụ tương tác cho Sơ đồ */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Lọc đường dây:
              </span>
              <button
                onClick={() => setSelectedWire(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedWire === null
                    ? 'bg-indigo-600 text-white font-bold'
                    : isDark
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả ({wires.length} dây)
              </button>
              {wires.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWire(selectedWire === w.id ? null : w.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 border ${
                    selectedWire === w.id
                      ? 'ring-2 ring-indigo-400 text-white'
                      : isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  style={{
                    backgroundColor: selectedWire === w.id ? w.color : undefined,
                    borderColor: selectedWire === w.id ? w.color : undefined,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                  <span>{w.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPowerCircuit(!showPowerCircuit)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${
                  showPowerCircuit
                    ? isDark
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
                }`}
              >
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>{showPowerCircuit ? 'Ẩn mạch sạc TP4056' : 'Hiện mạch sạc TP4056'}</span>
              </button>
            </div>
          </div>

          {/* VÙNG VẼ SƠ ĐỒ MẠCH TRỰC QUAN (INTERACTIVE SVG CANVAS) */}
          <div
            className={`w-full rounded-2xl border overflow-hidden p-3 sm:p-6 transition-all relative ${
              isDark ? 'bg-[#151619] border-zinc-800' : 'bg-slate-900 border-slate-700 shadow-xl'
            }`}
          >
            <div className="w-full overflow-x-auto pb-4">
              <svg
                viewBox="0 0 1100 680"
                className="w-full min-w-[900px] h-auto select-none font-sans"
              >
                <defs>
                  {/* Grid nền */}
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1" />
                  </pattern>

                  {/* Filter đổ bóng đèn LED / Dây phát sáng */}
                  <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Gradient cho Anten SMA */}
                  <linearGradient id="antenna-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="50%" stopColor="#52525b" />
                    <stop offset="100%" stopColor="#18181b" />
                  </linearGradient>

                  {/* Gradient ESP32 Chip */}
                  <linearGradient id="chip-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4d4d8" />
                    <stop offset="50%" stopColor="#a1a1aa" />
                    <stop offset="100%" stopColor="#71717a" />
                  </linearGradient>
                </defs>

                {/* Nền Grid kỹ thuật */}
                <rect width="1100" height="680" fill="url(#grid)" />

                {/* ========================================================== */}
                {/* 1. KHỐI BOARD ESP32-S3 WAVESHARE DEVKIT N16R8 (BÊN TRÁI) */}
                {/* ========================================================== */}
                <g transform="translate(60, 60)">
                  {/* PCB Board Outline */}
                  <rect
                    x="0"
                    y="0"
                    width="260"
                    height="540"
                    rx="16"
                    fill="#181920"
                    stroke="#4338ca"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="244"
                    height="524"
                    rx="10"
                    fill="#121318"
                    stroke="#27272a"
                    strokeWidth="1"
                  />

                  {/* Nhãn Board Waveshare */}
                  <text x="130" y="36" fill="#e0e7ff" fontSize="13" fontWeight="bold" textAnchor="middle">
                    ESP32-S3 DEV KIT N16R8
                  </text>
                  <text x="130" y="52" fill="#818cf8" fontSize="10" fontWeight="600" textAnchor="middle">
                    Waveshare • 16MB Flash • 8MB PSRAM
                  </text>

                  {/* Cổng USB Type-C kép trên đỉnh */}
                  <g transform="translate(45, 65)">
                    <rect x="0" y="0" width="60" height="26" rx="4" fill="#52525b" stroke="#71717a" />
                    <text x="30" y="16" fill="#f4f4f5" fontSize="8" fontWeight="bold" textAnchor="middle">
                      USB (OTG)
                    </text>
                  </g>
                  <g transform="translate(155, 65)">
                    <rect x="0" y="0" width="60" height="26" rx="4" fill="#52525b" stroke="#71717a" />
                    <text x="30" y="16" fill="#f4f4f5" fontSize="8" fontWeight="bold" textAnchor="middle">
                      UART (Nạp)
                    </text>
                  </g>

                  {/* Chip ESP32-S3 Kim loại chính giữa */}
                  <g transform="translate(50, 140)">
                    <rect
                      x="0"
                      y="0"
                      width="160"
                      height="170"
                      rx="8"
                      fill="url(#chip-metal)"
                      stroke="#52525b"
                      strokeWidth="2"
                    />
                    <rect x="6" y="6" width="148" height="158" rx="4" fill="#27272a" opacity="0.15" />
                    <text x="80" y="70" fill="#18181b" fontSize="14" fontWeight="900" textAnchor="middle">
                      Espressif
                    </text>
                    <text x="80" y="92" fill="#27272a" fontSize="12" fontWeight="bold" textAnchor="middle">
                      ESP32-S3
                    </text>
                    <text x="80" y="110" fill="#3f3f46" fontSize="9" fontWeight="600" textAnchor="middle">
                      Xtensa® 32-bit LX7
                    </text>
                    <text x="80" y="126" fill="#52525b" fontSize="8" textAnchor="middle">
                      Wi-Fi + BLE 5.0
                    </text>
                  </g>

                  {/* Nút BOOT & RESET & LED RGB */}
                  <g transform="translate(45, 330)">
                    <circle cx="20" cy="15" r="8" fill="#3f3f46" stroke="#71717a" />
                    <text x="20" y="32" fill="#a1a1aa" fontSize="8" textAnchor="middle">BOOT</text>

                    <circle cx="70" cy="15" r="6" fill="#22c55e" stroke="#86efac" />
                    <text x="70" y="32" fill="#86efac" fontSize="7" textAnchor="middle">RGB LED</text>

                    <circle cx="120" cy="15" r="8" fill="#3f3f46" stroke="#71717a" />
                    <text x="120" y="32" fill="#a1a1aa" fontSize="8" textAnchor="middle">RESET</text>
                  </g>

                  {/* Anten PCB tích hợp trên đỉnh */}
                  <path
                    d="M 90 100 L 170 100 L 170 110 L 100 110 L 100 120 L 160 120"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* ========================================= */}
                  {/* HÀNG CHÂN HEADER BÊN PHẢI (KẾT NỐI SANG NRF) */}
                  {/* ========================================= */}
                  <g transform="translate(230, 110)">
                    {/* Danh sách chân hàng phải */}
                    {[
                      { name: '3V3', y: 0, wire: 'vcc', color: '#ef4444' },
                      { name: 'GND', y: 35, wire: 'gnd', color: '#71717a' },
                      { name: 'G9 (CE)', y: 70, wire: 'ce', color: '#f97316' },
                      { name: 'G10 (CSN)', y: 105, wire: 'csn', color: '#a855f7' },
                      { name: 'G11 (MOSI)', y: 140, wire: 'mosi', color: '#22c55e' },
                      { name: 'G12 (SCK)', y: 175, wire: 'sck', color: '#eab308' },
                      { name: 'G13 (MISO)', y: 210, wire: 'miso', color: '#3b82f6' },
                      { name: 'G14 (IRQ)', y: 245, wire: 'irq', color: '#06b6d4' },
                      { name: '5V (VBUS)', y: 280, wire: null, color: '#f43f5e' },
                      { name: 'GND', y: 315, wire: null, color: '#71717a' },
                    ].map((pin, idx) => {
                      const isHighlighted = selectedWire === pin.wire;
                      return (
                        <g key={idx} transform={`translate(0, ${pin.y})`} className="cursor-pointer">
                          {/* Pin pad mạ vàng */}
                          <rect
                            x="0"
                            y="-10"
                            width="25"
                            height="20"
                            rx="4"
                            fill={isHighlighted ? pin.color : '#27272a'}
                            stroke={pin.color}
                            strokeWidth={isHighlighted ? 2.5 : 1}
                          />
                          <circle cx="12" cy="0" r="4.5" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                          <text
                            x="-8"
                            y="4"
                            fill={isHighlighted ? '#ffffff' : pin.color}
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="end"
                          >
                            {pin.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Chú thích phía dưới board */}
                  <text x="130" y="500" fill="#71717a" fontSize="9" textAnchor="middle">
                    Mức logic SPI: 3.3V CMOS
                  </text>
                </g>

                {/* ========================================================== */}
                {/* 2. KHỐI MODULE NRF24L01+ PA/LNA (BÊN PHẢI)                 */}
                {/* ========================================================== */}
                <g transform="translate(730, 80)">
                  {/* PCB Module NRF24L01 Outline */}
                  <rect
                    x="0"
                    y="0"
                    width="250"
                    height="320"
                    rx="12"
                    fill="#18181b"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="234"
                    height="304"
                    rx="8"
                    fill="#09090b"
                    stroke="#27272a"
                    strokeWidth="1"
                  />

                  {/* Tiêu đề Module */}
                  <text x="125" y="32" fill="#34d399" fontSize="12" fontWeight="bold" textAnchor="middle">
                    NRF24L01+ PA / LNA
                  </text>
                  <text x="125" y="48" fill="#a1a1aa" fontSize="9" textAnchor="middle">
                    2.4GHz RF Transceiver + Power Amp
                  </text>

                  {/* Đầu nối SMA & Anten râu ngoài */}
                  <g transform="translate(195, 60)">
                    {/* Đầu nối đồng SMA mạ vàng */}
                    <rect x="0" y="0" width="30" height="24" rx="3" fill="#eab308" stroke="#ca8a04" />
                    <rect x="30" y="4" width="12" height="16" fill="#a1a1aa" />
                    {/* Anten râu thanh dài */}
                    <rect
                      x="42"
                      y="-40"
                      width="18"
                      height="190"
                      rx="8"
                      fill="url(#antenna-grad)"
                      stroke="#27272a"
                      strokeWidth="1.5"
                    />
                    <text x="51" y="-50" fill="#eab308" fontSize="10" fontWeight="bold" textAnchor="middle">
                      ANTEN 2.4G
                    </text>
                  </g>

                  {/* Vỏ chắn kim loại (Shielding Can che IC nRF24L01 + PA chip) */}
                  <g transform="translate(25, 75)">
                    <rect
                      x="0"
                      y="0"
                      width="145"
                      height="90"
                      rx="6"
                      fill="url(#chip-metal)"
                      stroke="#71717a"
                      strokeWidth="1.5"
                    />
                    <text x="72" y="40" fill="#18181b" fontSize="11" fontWeight="bold" textAnchor="middle">
                      RFX2401C + nRF24
                    </text>
                    <text x="72" y="58" fill="#3f3f46" fontSize="9" textAnchor="middle">
                      +20dBm PA • LNA 10dB
                    </text>
                    <text x="72" y="74" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Dải phát: ~800m - 1000m
                    </text>
                  </g>

                  {/* CỤM 8 CHÂN CẮM 2x4 CHUẨN CỦA NRF24L01 */}
                  <g transform="translate(35, 195)">
                    <rect
                      x="-10"
                      y="-12"
                      width="140"
                      height="105"
                      rx="8"
                      fill="#1e1e24"
                      stroke="#3f3f46"
                      strokeWidth="1.5"
                    />
                    <text x="60" y="-18" fill="#e4e4e7" fontSize="10" fontWeight="bold" textAnchor="middle">
                      PINOUT 2x4 (Mặt sau/Header)
                    </text>

                    {/* Cột Trái: Chân lẻ (1, 3, 5, 7) */}
                    {/* Pin 1: GND */}
                    <g transform="translate(15, 10)">
                      <circle cx="8" cy="8" r="7" fill={selectedWire === 'gnd' ? '#71717a' : '#27272a'} stroke="#71717a" strokeWidth="2" />
                      <circle cx="8" cy="8" r="3" fill="#eab308" />
                      <text x="-4" y="11" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="end">1. GND</text>
                    </g>
                    {/* Pin 3: CE */}
                    <g transform="translate(15, 32)">
                      <circle cx="8" cy="8" r="7" fill={selectedWire === 'ce' ? '#f97316' : '#27272a'} stroke="#f97316" strokeWidth="2" />
                      <circle cx="8" cy="8" r="3" fill="#eab308" />
                      <text x="-4" y="11" fill="#f97316" fontSize="9" fontWeight="bold" textAnchor="end">3. CE</text>
                    </g>
                    {/* Pin 5: SCK */}
                    <g transform="translate(15, 54)">
                      <circle cx="8" cy="8" r="7" fill={selectedWire === 'sck' ? '#eab308' : '#27272a'} stroke="#eab308" strokeWidth="2" />
                      <circle cx="8" cy="8" r="3" fill="#eab308" />
                      <text x="-4" y="11" fill="#eab308" fontSize="9" fontWeight="bold" textAnchor="end">5. SCK</text>
                    </g>
                    {/* Pin 7: MISO */}
                    <g transform="translate(15, 76)">
                      <circle cx="8" cy="8" r="7" fill={selectedWire === 'miso' ? '#3b82f6' : '#27272a'} stroke="#3b82f6" strokeWidth="2" />
                      <circle cx="8" cy="8" r="3" fill="#eab308" />
                      <text x="-4" y="11" fill="#3b82f6" fontSize="9" fontWeight="bold" textAnchor="end">7. MISO</text>
                    </g>

                    {/* Cột Phải: Chân chẵn (2, 4, 6, 8) */}
                    {/* Pin 2: VCC */}
                    <g transform="translate(80, 10)">
                      <circle cx="8" cy="8" r="7" fill={selectedWire === 'vcc' ? '#ef4444' : '#27272a'} stroke="#ef4444" strokeWidth="2" />
                      <circle cx="8" cy="8" r="3" fill="#eab308" />
                      <text x="22" y="11" fill="#ef4444" fontSize="9" fontWeight="bold">2. VCC (3V3)</text>
                    </g>
                    {/* Pin 4: CSN */}
                    <g transform="translate(80, 32)">
                      <circle cx="8" cy="8" r="7" fill={selectedWire === 'csn' ? '#a855f7' : '#27272a'} stroke="#a855f7" strokeWidth="2" />
                      <circle cx="8" cy="8" r="3" fill="#eab308" />
                      <text x="22" y="11" fill="#a855f7" fontSize="9" fontWeight="bold">4. CSN</text>
                    </g>
                    {/* Pin 6: MOSI */}
                    <g transform="translate(80, 54)">
                      <circle cx="8" cy="8" r="7" fill={selectedWire === 'mosi' ? '#22c55e' : '#27272a'} stroke="#22c55e" strokeWidth="2" />
                      <circle cx="8" cy="8" r="3" fill="#eab308" />
                      <text x="22" y="11" fill="#22c55e" fontSize="9" fontWeight="bold">6. MOSI</text>
                    </g>
                    {/* Pin 8: IRQ */}
                    <g transform="translate(80, 76)">
                      <circle cx="8" cy="8" r="7" fill={selectedWire === 'irq' ? '#06b6d4' : '#27272a'} stroke="#06b6d4" strokeWidth="2" />
                      <circle cx="8" cy="8" r="3" fill="#eab308" />
                      <text x="22" y="11" fill="#06b6d4" fontSize="9" fontWeight="bold">8. IRQ</text>
                    </g>
                  </g>

                  {/* TỤ ĐIỆN HÓA 10µF - 47µF BẮC THẲNG VÀO VCC VÀ GND */}
                  <g transform="translate(190, 205)">
                    {/* Thân tụ hình trụ */}
                    <rect x="0" y="0" width="30" height="48" rx="6" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                    <rect x="0" y="32" width="30" height="10" fill="#e2e8f0" />
                    <text x="15" y="40" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">-</text>
                    <text x="15" y="22" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">22µF</text>
                    {/* Chân tụ nối vào Pin 1 và Pin 2 */}
                    <path d="M 0 15 L -20 15 L -45 10" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
                    <path d="M 0 38 L -35 38 L -85 10" fill="none" stroke="#71717a" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x="15" y="62" fill="#60a5fa" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Tụ bù 10-47µF
                    </text>
                  </g>
                </g>

                {/* ========================================================== */}
                {/* 3. KHỐI MẠCH SẠC TP4056 + PIN LI-ION 3.7V (NẾU BẬT)        */}
                {/* ========================================================== */}
                {showPowerCircuit && (
                  <g transform="translate(560, 440)">
                    {/* Khung Mạch sạc TP4056 */}
                    <rect
                      x="0"
                      y="0"
                      width="180"
                      height="190"
                      rx="10"
                      fill="#0f172a"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
                    <text x="90" y="24" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                      TP4056 USB-C + BẢO VỆ
                    </text>
                    <text x="90" y="38" fill="#94a3b8" fontSize="8" textAnchor="middle">
                      Lithium Battery Charger 1A
                    </text>

                    {/* Cổng Type-C vào */}
                    <g transform="translate(50, 48)">
                      <rect x="0" y="0" width="80" height="20" rx="4" fill="#475569" stroke="#94a3b8" />
                      <text x="40" y="13" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        Nạp USB-C 5V
                      </text>
                    </g>

                    {/* Đèn LED Báo Sạc (Đỏ: Charging / Xanh: Full) */}
                    <circle cx="35" cy="80" r="4" fill="#ef4444" />
                    <text x="45" y="83" fill="#f87171" fontSize="7">CHRG (Đỏ)</text>
                    <circle cx="105" cy="80" r="4" fill="#22c55e" />
                    <text x="115" y="83" fill="#4ade80" fontSize="7">STDBY (Xanh)</text>

                    {/* Các cọc hàn ra pin: B+, B- */}
                    <g transform="translate(15, 105)">
                      <rect x="0" y="0" width="60" height="26" rx="4" fill="#1e293b" stroke="#334155" />
                      <text x="30" y="12" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">B+ (Dương Pin)</text>
                      <text x="30" y="22" fill="#94a3b8" fontSize="7" textAnchor="middle">3.7V - 4.2V</text>
                    </g>
                    <g transform="translate(105, 105)">
                      <rect x="0" y="0" width="60" height="26" rx="4" fill="#1e293b" stroke="#334155" />
                      <text x="30" y="12" fill="#71717a" fontSize="8" fontWeight="bold" textAnchor="middle">B- (Âm Pin)</text>
                      <text x="30" y="22" fill="#94a3b8" fontSize="7" textAnchor="middle">GND Pin</text>
                    </g>

                    {/* Đầu ra tải an toàn: OUT+ & OUT- */}
                    <g transform="translate(15, 145)">
                      <rect x="0" y="0" width="60" height="26" rx="4" fill="#1e293b" stroke="#0284c7" />
                      <text x="30" y="12" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">OUT+ (Tải)</text>
                      <text x="30" y="22" fill="#38bdf8" fontSize="7" textAnchor="middle">Sang LDO 3.3V</text>
                    </g>
                    <g transform="translate(105, 145)">
                      <rect x="0" y="0" width="60" height="26" rx="4" fill="#1e293b" stroke="#64748b" />
                      <text x="30" y="12" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">OUT- (GND)</text>
                      <text x="30" y="22" fill="#94a3b8" fontSize="7" textAnchor="middle">Mass chung</text>
                    </g>

                    {/* Khối Pin 18650 Li-ion 3.7V */}
                    <g transform="translate(210, 15)">
                      <rect x="0" y="0" width="130" height="150" rx="8" fill="#14532d" stroke="#22c55e" strokeWidth="2" />
                      <rect x="15" y="-6" width="30" height="6" rx="2" fill="#e2e8f0" />
                      <text x="65" y="40" fill="#86efac" fontSize="12" fontWeight="bold" textAnchor="middle">
                        PIN LI-ION
                      </text>
                      <text x="65" y="60" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                        3.7V 18650
                      </text>
                      <text x="65" y="80" fill="#bbf7d0" fontSize="8" textAnchor="middle">
                        Dung lượng 2500mAh
                      </text>
                      <text x="25" y="130" fill="#ef4444" fontSize="10" fontWeight="bold">(+)</text>
                      <text x="105" y="130" fill="#71717a" fontSize="10" fontWeight="bold">(-)</text>

                      {/* Dây nối Pin vào TP4056 B+ và B- */}
                      <path d="M 30 140 Q 30 180 -135 120" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                      <path d="M 110 140 Q 110 180 -45 120" fill="none" stroke="#71717a" strokeWidth="2" strokeDasharray="3 3" />
                    </g>
                  </g>
                )}

                {/* ========================================================== */}
                {/* 4. CÁC ĐƯỜNG DÂY NỐI TÍN HIỆU SPI & NGUỒN (WIRING TRACES) */}
                {/* ========================================================== */}
                {/* DÂY 1: VCC (3.3V) - ĐỎ */}
                {(!selectedWire || selectedWire === 'vcc') && (
                  <g filter={selectedWire === 'vcc' ? 'url(#wire-glow)' : undefined}>
                    <path
                      d="M 290 110 C 450 110, 600 205, 810 205"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={selectedWire === 'vcc' ? 5 : 3.5}
                      strokeLinecap="round"
                    />
                    <circle cx="290" cy="110" r="5" fill="#ef4444" />
                    <circle cx="810" cy="205" r="5" fill="#ef4444" />
                    <rect x="520" y="125" width="80" height="20" rx="5" fill="#18181b" stroke="#ef4444" strokeWidth="1" />
                    <text x="560" y="139" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">
                      3.3V VCC
                    </text>
                  </g>
                )}

                {/* DÂY 2: GND - XÁM ĐẬM / ĐEN */}
                {(!selectedWire || selectedWire === 'gnd') && (
                  <g filter={selectedWire === 'gnd' ? 'url(#wire-glow)' : undefined}>
                    <path
                      d="M 290 145 C 440 145, 590 205, 745 205"
                      fill="none"
                      stroke="#71717a"
                      strokeWidth={selectedWire === 'gnd' ? 5 : 3.5}
                      strokeLinecap="round"
                    />
                    <circle cx="290" cy="145" r="5" fill="#71717a" />
                    <circle cx="745" cy="205" r="5" fill="#71717a" />
                    <rect x="480" y="160" width="60" height="20" rx="5" fill="#18181b" stroke="#71717a" strokeWidth="1" />
                    <text x="510" y="174" fill="#d4d4d8" fontSize="10" fontWeight="bold" textAnchor="middle">
                      GND
                    </text>
                  </g>
                )}

                {/* DÂY 3: CE (GPIO 9 -> PIN 3 CE) - CAM */}
                {(!selectedWire || selectedWire === 'ce') && (
                  <g filter={selectedWire === 'ce' ? 'url(#wire-glow)' : undefined}>
                    <path
                      d="M 290 180 C 430 180, 580 227, 745 227"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth={selectedWire === 'ce' ? 5 : 3}
                      strokeLinecap="round"
                    />
                    <circle cx="290" cy="180" r="4.5" fill="#f97316" />
                    <circle cx="745" cy="227" r="4.5" fill="#f97316" />
                    <rect x="420" y="190" width="85" height="18" rx="4" fill="#18181b" stroke="#f97316" strokeWidth="1" />
                    <text x="462" y="203" fill="#f97316" fontSize="9" fontWeight="bold" textAnchor="middle">
                      CE (GPIO 9)
                    </text>
                  </g>
                )}

                {/* DÂY 4: CSN (GPIO 10 -> PIN 4 CSN) - TÍM */}
                {(!selectedWire || selectedWire === 'csn') && (
                  <g filter={selectedWire === 'csn' ? 'url(#wire-glow)' : undefined}>
                    <path
                      d="M 290 215 C 440 215, 610 227, 810 227"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth={selectedWire === 'csn' ? 5 : 3}
                      strokeLinecap="round"
                    />
                    <circle cx="290" cy="215" r="4.5" fill="#a855f7" />
                    <circle cx="810" cy="227" r="4.5" fill="#a855f7" />
                    <rect x="530" y="210" width="90" height="18" rx="4" fill="#18181b" stroke="#a855f7" strokeWidth="1" />
                    <text x="575" y="223" fill="#c084fc" fontSize="9" fontWeight="bold" textAnchor="middle">
                      CSN (GPIO 10)
                    </text>
                  </g>
                )}

                {/* DÂY 5: MOSI (GPIO 11 -> PIN 6 MOSI) - XANH LÁ */}
                {(!selectedWire || selectedWire === 'mosi') && (
                  <g filter={selectedWire === 'mosi' ? 'url(#wire-glow)' : undefined}>
                    <path
                      d="M 290 250 C 450 250, 620 249, 810 249"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth={selectedWire === 'mosi' ? 5 : 3}
                      strokeLinecap="round"
                    />
                    <circle cx="290" cy="250" r="4.5" fill="#22c55e" />
                    <circle cx="810" cy="249" r="4.5" fill="#22c55e" />
                    <rect x="490" y="235" width="95" height="18" rx="4" fill="#18181b" stroke="#22c55e" strokeWidth="1" />
                    <text x="537" y="248" fill="#4ade80" fontSize="9" fontWeight="bold" textAnchor="middle">
                      MOSI (GPIO 11)
                    </text>
                  </g>
                )}

                {/* DÂY 6: SCK (GPIO 12 -> PIN 5 SCK) - VÀNG */}
                {(!selectedWire || selectedWire === 'sck') && (
                  <g filter={selectedWire === 'sck' ? 'url(#wire-glow)' : undefined}>
                    <path
                      d="M 290 285 C 440 285, 590 249, 745 249"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth={selectedWire === 'sck' ? 5 : 3}
                      strokeLinecap="round"
                    />
                    <circle cx="290" cy="285" r="4.5" fill="#eab308" />
                    <circle cx="745" cy="249" r="4.5" fill="#eab308" />
                    <rect x="420" y="270" width="90" height="18" rx="4" fill="#18181b" stroke="#eab308" strokeWidth="1" />
                    <text x="465" y="283" fill="#facc15" fontSize="9" fontWeight="bold" textAnchor="middle">
                      SCK (GPIO 12)
                    </text>
                  </g>
                )}

                {/* DÂY 7: MISO (GPIO 13 -> PIN 7 MISO) - XANH DƯƠNG */}
                {(!selectedWire || selectedWire === 'miso') && (
                  <g filter={selectedWire === 'miso' ? 'url(#wire-glow)' : undefined}>
                    <path
                      d="M 290 320 C 440 320, 580 271, 745 271"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={selectedWire === 'miso' ? 5 : 3}
                      strokeLinecap="round"
                    />
                    <circle cx="290" cy="320" r="4.5" fill="#3b82f6" />
                    <circle cx="745" cy="271" r="4.5" fill="#3b82f6" />
                    <rect x="430" y="305" width="95" height="18" rx="4" fill="#18181b" stroke="#3b82f6" strokeWidth="1" />
                    <text x="477" y="318" fill="#60a5fa" fontSize="9" fontWeight="bold" textAnchor="middle">
                      MISO (GPIO 13)
                    </text>
                  </g>
                )}

                {/* DÂY 8: IRQ (GPIO 14 -> PIN 8 IRQ) - CYAN ĐỨT NÉT */}
                {(!selectedWire || selectedWire === 'irq') && (
                  <g filter={selectedWire === 'irq' ? 'url(#wire-glow)' : undefined}>
                    <path
                      d="M 290 355 C 470 355, 630 271, 810 271"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={selectedWire === 'irq' ? 4 : 2}
                      strokeDasharray="4 3"
                      strokeLinecap="round"
                    />
                    <circle cx="290" cy="355" r="4" fill="#06b6d4" />
                    <circle cx="810" cy="271" r="4" fill="#06b6d4" />
                    <rect x="540" y="340" width="130" height="18" rx="4" fill="#18181b" stroke="#06b6d4" strokeWidth="1" />
                    <text x="605" y="353" fill="#22d3ee" fontSize="8" fontWeight="bold" textAnchor="middle">
                      IRQ (GPIO 14 - Tùy chọn)
                    </text>
                  </g>
                )}

                {/* Dây nối GND chung từ TP4056 sang ESP32-S3 khi mở mạch sạc */}
                {showPowerCircuit && (
                  <g>
                    <path
                      d="M 665 585 C 500 585, 400 425, 290 425"
                      fill="none"
                      stroke="#71717a"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                    />
                    <circle cx="665" cy="585" r="4" fill="#71717a" />
                    <circle cx="290" cy="425" r="4" fill="#71717a" />
                    <rect x="420" y="495" width="115" height="18" rx="4" fill="#18181b" stroke="#71717a" strokeWidth="1" />
                    <text x="477" y="508" fill="#a1a1aa" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Common GND (Nối Mass)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Chú giải nhanh dưới sơ đồ */}
            <div className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-800 text-slate-400'}`}>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 3.3V Nguồn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-zinc-500 inline-block" /> GND
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> SCK (Clock)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> MOSI (Data In)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> MISO (Data Out)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> CSN (Select)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> CE (Enable)
                </span>
              </div>
              <span className="text-[11px] italic">
                * Bấm vào các nút màu bên trên để làm nổi bật từng sợi dây nối.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB BẢNG PINOUT TRA CỨU */}
      {activeTab === 'pinout' && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="p-4 sm:p-5 border-b border-inherit flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base">Bảng Đối Chiếu Chân Kết Nối SPI (Pinout Matrix)</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Các chân GPIO mặc định tối ưu trên ESP32-S3 (FSPI / SPI chuẩn)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead
                  className={`border-b uppercase text-[10px] sm:text-xs font-bold tracking-wider ${
                    isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4">NRF24L01 (Header 2x4)</th>
                    <th className="py-3 px-4">ESP32-S3 Pin</th>
                    <th className="py-3 px-4">Tên tín hiệu</th>
                    <th className="py-3 px-4">Màu dây quy ước</th>
                    <th className="py-3 px-4">Điện áp logic</th>
                    <th className="py-3 px-4">Ghi chú quan trọng</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80 text-zinc-200' : 'divide-slate-200 text-slate-800'}`}>
                  {wires.map((w) => (
                    <tr
                      key={w.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                        <span>{w.nrfPin}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                        {w.espPin}
                      </td>
                      <td className="py-3 px-4 font-semibold">{w.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: w.color }}
                        >
                          {w.color}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          w.id === 'vcc'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {w.id === 'vcc' ? '3.3V DC Max' : '3.3V Logic'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        {w.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB LINH KIỆN CHECKLIST & HƯỚNG DẪN */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Checklist 6 Linh kiện cần chuẩn bị */}
          <div
            className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  Danh Sách Linh Kiện Cần Chuẩn Bị
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Đánh dấu để kiểm tra đủ trước khi bắt tay vào cắm dây trên Breadboard
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-indigo-400">
                  {completedCount} / 6
                </span>
                <span className={`text-xs block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {progressPercent}% hoàn thành
                </span>
              </div>
            </div>

            {/* Thanh tiến trình */}
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Danh sách 6 mục */}
            <div className="space-y-2.5 pt-2">
              {[
                {
                  key: 'esp32',
                  title: '1. ESP32-S3 DevKit Waveshare (N16R8)',
                  qty: '1 board',
                  note: 'Dual Type-C, 16MB Flash, 8MB PSRAM, chip ESP32-S3 Xtensa LX7.',
                },
                {
                  key: 'nrf24',
                  title: '2. NRF24L01+ PA/LNA (có Anten ngoài)',
                  qty: '1 module',
                  note: 'Tần số 2.4GHz SPI, dải công suất cao cần cấp nguồn ổn định.',
                },
                {
                  key: 'breadboard',
                  title: '3. Breadboard & Bộ dây cắm Dupont (Đực-Cái, Cái-Cái)',
                  qty: '1 bộ (khoảng 10-15 sợi)',
                  note: 'Dùng cắm thử nghiệm linh hoạt, không cần hàn thiếc.',
                },
                {
                  key: 'power3v3',
                  title: '4. Nguồn 3.3V ổn định (kèm mạch sạc TP4056 + LDO nếu dùng pin)',
                  qty: 'Dòng ra >= 250mA',
                  note: 'Tránh sụt áp khi module PA/LNA phát công suất lớn.',
                },
                {
                  key: 'capacitor',
                  title: '5. Tụ hóa lọc nguồn 10µF - 47µF (16V hoặc 25V)',
                  qty: '1 tụ (chú ý cực tính)',
                  note: 'Gắn trực tiếp vào 2 chân VCC & GND module NRF24L01 để chống nhiễu.',
                },
                {
                  key: 'usbc',
                  title: '6. Cáp USB-C truyền dữ liệu tốt (Data Cable)',
                  qty: '1 sợi',
                  note: 'Cắm cổng UART trên board để nạp code và mở Serial Monitor.',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggleCheckItem(item.key)}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                    checklist[item.key]
                      ? isDark
                        ? 'bg-indigo-950/20 border-indigo-500/40'
                        : 'bg-indigo-50/70 border-indigo-200'
                      : isDark
                      ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => {}} // Đã xử lý ở thẻ div cha
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs sm:text-sm font-bold ${checklist[item.key] ? 'line-through opacity-70 text-indigo-400' : ''}`}>
                        {item.title}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-slate-300 text-slate-700'}`}>
                        {item.qty}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {item.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Hướng dẫn kiểm tra board trước khi cấp điện */}
          <div className="space-y-4">
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Kiểm Tra Board Trước Khi Cấp Điện
              </h3>
              <ul className={`text-xs space-y-2 list-disc list-inside leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                <li>
                  <strong>Chụp ảnh xác nhận:</strong> Chụp rõ mặt trước board ESP32-S3 để thấy hàng chữ GPIO hai bên.
                </li>
                <li>
                  <strong>Đồng hồ VOM:</strong> Dùng thang đo thông mạch để kiểm tra không bị chập giữa 3.3V và GND trước khi cắm dây USB.
                </li>
                <li>
                  <strong>Đúng cực tụ điện:</strong> Chân có vạch sọc trắng/xám trên thân tụ là cực <strong>ÂM (-)</strong> cắm vào GND, chân còn lại cắm vào VCC.
                </li>
                <li>
                  <strong>Không chạm tay vào anten:</strong> Khi module PA/LNA đang phát sóng, không chạm tay vào chân anten để tránh tĩnh điện làm suy giảm tín hiệu.
                </li>
              </ul>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Quy Trình Nạp Code & Kiểm Tra
              </h4>
              <p className="text-xs leading-relaxed">
                1. Cắm cáp USB-C vào cổng <strong>UART</strong> của ESP32-S3.<br />
                2. Mở Arduino IDE, chọn Board: <strong>ESP32S3 Dev Module</strong>.<br />
                3. Cài thư viện <strong>RF24 by TMRh20</strong> từ Library Manager.<br />
                4. Nạp code ở tab bên cạnh và mở Serial Monitor tốc độ <strong>115200 baud</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB MÃ NGUỒN ARDUINO IDE TEST */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div>
              <h3 className="font-bold text-sm sm:text-base">Mã Nguồn Arduino IDE (Kiểm Tra Bắt Tay nRF24)</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Sketch dùng kiểm tra chip nRF24L01+ có nhận lệnh SPI từ ESP32-S3 không và in toàn bộ thanh ghi.
              </p>
            </div>
            <button
              onClick={copyToClipboard}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                copiedCode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép code'}</span>
            </button>
          </div>

          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#0d0e11] border-zinc-800' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono">esp32s3_nrf24_test.ino</span>
              <span>C++ / Arduino IDE</span>
            </div>
            <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto leading-relaxed">
              <code>{testSketchCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
