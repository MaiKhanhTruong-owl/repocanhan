import mqtt from 'mqtt';
import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { execFileSync, spawn } from 'child_process';
import {
  getSmartHomeConfig,
  saveSmartHomeConfig,
  getGoogleAuthStatus,
  generateAuthUrl,
  handleAuthCallback,
  disconnectGoogle,
  sendGoogleAssistantQuery,
  getGoogleUserProfile,
} from './googleHomeBridge.js';

const PRINTERS_FILE = path.join(process.cwd(), 'data', 'printers.json');
const HISTORY_FILE = path.join(process.cwd(), 'data', 'history.json');
const SNAPSHOTS_DIR = path.join(process.cwd(), 'public', 'snapshots');
const WALLPAPERS_DIR = path.join(process.cwd(), 'public', 'wallpapers');
const WALLPAPERS_FILE = path.join(process.cwd(), 'data', 'wallpapers.json');

// Đảm bảo các thư mục tồn tại
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}
if (!fs.existsSync(WALLPAPERS_DIR)) {
  fs.mkdirSync(WALLPAPERS_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(HISTORY_FILE))) {
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
}
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(WALLPAPERS_FILE)) {
  fs.writeFileSync(WALLPAPERS_FILE, JSON.stringify([], null, 2));
}

// Lấy danh sách ảnh nền tự tải lên trong thư mục public/wallpapers
export function getCustomWallpapers() {
  try {
    let list = [];
    if (fs.existsSync(WALLPAPERS_FILE)) {
      const content = fs.readFileSync(WALLPAPERS_FILE, 'utf-8');
      list = JSON.parse(content.replace(/^\uFEFF/, '') || '[]');
    }

    // Lọc trùng lặp file ngay từ đầu
    const seen = new Set();
    const cleanList = [];
    for (const item of list) {
      if (item && item.filename && !seen.has(item.filename)) {
        seen.add(item.filename);
        cleanList.push(item);
      }
    }
    list = cleanList;

    // Tự động quét và phát hiện các file được copy/thả trực tiếp vào thư mục public/wallpapers
    if (fs.existsSync(WALLPAPERS_DIR)) {
      const files = fs.readdirSync(WALLPAPERS_DIR);
      let changed = false;
      const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (validExts.includes(ext) && !seen.has(file)) {
          const stats = fs.statSync(path.join(WALLPAPERS_DIR, file));
          seen.add(file);
          list.push({
            id: `local_${file.replace(/[^a-zA-Z0-9]/g, '_')}`,
            title: path.basename(file, ext),
            filename: file,
            url: `/wallpapers/${file}`,
            category: 'Đã tải lên',
            size: stats.size,
            uploadedAt: stats.mtime.toISOString(),
          });
          changed = true;
        }
      }

      if (changed) {
        saveCustomWallpapers(list);
      }
    }
    return list;
  } catch (e) {
    console.error('[Wallpaper] Lỗi đọc danh sách wallpapers:', e);
    return [];
  }
}

// Lưu danh sách ảnh nền vào file JSON
export function saveCustomWallpapers(list) {
  try {
    fs.writeFileSync(WALLPAPERS_FILE, JSON.stringify(list, null, 2));
    return true;
  } catch (e) {
    console.error('[Wallpaper] Lỗi lưu wallpapers.json:', e);
    return false;
  }
}

// Đọc danh sách máy in từ file JSON
export function getPrintersConfig() {
  try {
    if (fs.existsSync(PRINTERS_FILE)) {
      const content = fs.readFileSync(PRINTERS_FILE, 'utf-8');
      const parsed = JSON.parse(content.replace(/^\uFEFF/, '') || '{}');
      if (Array.isArray(parsed.printers) && parsed.printers.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[BambuBridge] Lỗi đọc printers.json:', e);
  }
  return {
    activePrinterId: 'p1s_1',
    printers: [
      {
        id: 'p1s_1',
        name: 'Bambu P1S - Máy 1 (QT)',
        model: 'Bambu Lab P1S',
        ip: '192.168.0.105',
        accessCode: '10416028',
        serial: '01P00C591301162',
        wifi: 'mh 2.4g',
        lanOnlyMode: false,
        enabled: true,
      },
      {
        id: 'p1s_2',
        name: 'Bambu P1S - Máy 2 (RF)',
        model: 'Bambu Lab P1S',
        ip: '192.168.0.107',
        accessCode: '2f41a31e',
        serial: '01P199611800016',
        wifi: 'mh 2.4g',
        lanOnlyMode: false,
        enabled: true,
      },
    ],
  };
}

// Lưu danh sách máy in vào file JSON
export function savePrintersConfig(data) {
  try {
    fs.writeFileSync(PRINTERS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('[BambuBridge] Lỗi ghi printers.json:', e);
    return false;
  }
}

function formatHexColor(colorStr) {
  if (!colorStr) return '#999999';
  if (colorStr.length === 8) {
    return '#' + colorStr.slice(0, 6);
  }
  if (!colorStr.startsWith('#')) return '#' + colorStr;
  return colorStr;
}

// ================= MULTI-PRINTER POOL MANAGEMENT =================
// Lưu pool máy in trên globalThis để không mất kết nối khi Vite HMR reload
if (!globalThis.__bambu_printers_pool__) {
  globalThis.__bambu_printers_pool__ = new Map();
}
const printersPool = globalThis.__bambu_printers_pool__;

function createDefaultState(p) {
  return {
    connected: false,
    model: p.name || p.model || 'Bambu Lab P1S',
    name: p.name || p.model || 'Bambu Lab P1S',
    serial: p.serial,
    ip: p.ip,
    gcode_state: 'IDLE',
    subtask_name: '',
    progress: 0,
    remaining_time: 0,
    layer_num: 0,
    total_layer_num: 0,
    nozzle_temper: 0,
    nozzle_target_temper: 0,
    bed_temper: 0,
    bed_target_temper: 0,
    chamber_temper: 0,
    cooling_fan_speed: 0,
    big_fan1_speed: 0,
    big_fan2_speed: 0,
    spd_mag: 100,
    spd_lvl: 2,
    chamber_light: 'off',
    ams: {
      temp: 0,
      humidity: 0,
      active_tray: -1,
      trays: [],
    },
    cameraAvailable: true,
    s_obj: [],
    raw: null,
  };
}

export function getOrCreatePrinterInstance(p) {
  let instance = printersPool.get(p.id);
  if (!instance) {
    instance = {
      id: p.id,
      config: { ...p },
      mqttClient: null,
      connected: false,
      lastError: null,
      lastUpdated: null,
      state: createDefaultState(p),
      camera: {
        socket: null,
        connected: false,
        latestFrame: null,
        clients: new Set(),
        buffer: Buffer.alloc(0),
        idleTimer: null,
      },
      activeJobTracker: {
        taskName: '',
        startTime: null,
        totalLayers: 0,
        lastState: 'IDLE',
        recorded: false,
      },
    };
    printersPool.set(p.id, instance);
  } else {
    instance.config = { ...instance.config, ...p };
    instance.state.name = p.name || p.model;
    instance.state.ip = p.ip;
    instance.state.serial = p.serial;
  }
  return instance;
}

export function connectPrinterInstance(instance) {
  if (instance.config.enabled === false) {
    if (instance.mqttClient) {
      try {
        instance.mqttClient.removeAllListeners();
        instance.mqttClient.end(true);
      } catch (e) {}
      instance.mqttClient = null;
    }
    instance.connected = false;
    instance.state.connected = false;
    return;
  }

  if (instance.mqttClient && instance.mqttClient.connected) {
    return;
  }

  const { ip, port = 8883, accessCode, serial, name } = instance.config;
  console.log(`[BambuBridge] 🔄 Khởi tạo kết nối tới ${name || ip} (${ip}:${port})...`);

  try {
    const client = mqtt.connect(`mqtts://${ip}:${port}`, {
      username: 'bblp',
      password: accessCode,
      rejectUnauthorized: false,
      clientId: `printflow_${serial || Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      keepalive: 45,
      reconnectPeriod: 5000,
      connectTimeout: 8000,
    });

    instance.mqttClient = client;

    client.on('connect', () => {
      instance.connected = true;
      instance.lastError = null;
      instance.state.connected = true;
      console.log(`[BambuBridge] ✅ Đã kết nối MQTT tới ${name || ip} (${ip})!`);

      const reportTopic = `device/${serial}/report`;
      client.subscribe(reportTopic, { qos: 0 }, (err) => {
        if (!err) {
          sendPrinterInstanceCommand(instance, {
            pushing: { sequence_id: '0', command: 'pushall' },
          });
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        processInstanceTelemetry(instance, data);
      } catch (e) {}
    });

    client.on('error', (err) => {
      instance.lastError = err.message;
      console.error(`[BambuBridge] Lỗi MQTT [${name || ip}]:`, err.message);
    });

    client.on('close', () => {
      instance.connected = false;
      instance.state.connected = false;
    });
  } catch (err) {
    console.error(`[BambuBridge] Lỗi khởi tạo MQTT client cho ${name || ip}:`, err);
  }
}

function processInstanceTelemetry(instance, data) {
  if (!data || !data.print) return;
  const p = data.print;
  instance.lastUpdated = new Date().toISOString();
  const s = instance.state;
  const prevGcodeState = s.gcode_state;

  if (p.gcode_state !== undefined) s.gcode_state = p.gcode_state;
  if (p.subtask_name !== undefined) s.subtask_name = p.subtask_name;
  if (p.gcode_file !== undefined && !s.subtask_name) s.subtask_name = p.gcode_file;
  if (p.mc_percent !== undefined) s.progress = Number(p.mc_percent);
  if (p.mc_remaining_time !== undefined) s.remaining_time = Number(p.mc_remaining_time);
  if (p.layer_num !== undefined) s.layer_num = Number(p.layer_num);
  if (p.total_layer_num !== undefined) s.total_layer_num = Number(p.total_layer_num);

  if (p.nozzle_temper !== undefined) s.nozzle_temper = Math.round(Number(p.nozzle_temper));
  if (p.nozzle_target_temper !== undefined) s.nozzle_target_temper = Math.round(Number(p.nozzle_target_temper));
  if (p.bed_temper !== undefined) s.bed_temper = Math.round(Number(p.bed_temper));
  if (p.bed_target_temper !== undefined) s.bed_target_temper = Math.round(Number(p.bed_target_temper));
  if (p.chamber_temper !== undefined) s.chamber_temper = Math.round(Number(p.chamber_temper));

  if (p.cooling_fan_speed !== undefined) s.cooling_fan_speed = Number(p.cooling_fan_speed);
  if (p.big_fan1_speed !== undefined) s.big_fan1_speed = Number(p.big_fan1_speed);
  if (p.big_fan2_speed !== undefined) s.big_fan2_speed = Number(p.big_fan2_speed);
  if (p.spd_mag !== undefined) s.spd_mag = Number(p.spd_mag);
  if (p.spd_lvl !== undefined) s.spd_lvl = Number(p.spd_lvl);
  if (Array.isArray(p.s_obj)) s.s_obj = p.s_obj;

  if (Array.isArray(p.lights_report)) {
    const chamberLight = p.lights_report.find((l) => l.node === 'chamber_light');
    if (chamberLight) {
      s.chamber_light = chamberLight.mode;
    }
  }

  if (p.ams && Array.isArray(p.ams.ams) && p.ams.ams.length > 0) {
    const mainAms = p.ams.ams[0];
    s.ams.temp = parseFloat(mainAms.temp || 0);
    s.ams.humidity = parseInt(mainAms.humidity_raw || mainAms.humidity || 0, 10);
    s.ams.active_tray = p.ams.tray_now ? parseInt(p.ams.tray_now, 10) : -1;

    if (Array.isArray(mainAms.tray)) {
      s.ams.trays = mainAms.tray.map((t) => ({
        id: t.id,
        type: t.tray_type || 'Unknown',
        colorHex: formatHexColor(t.tray_color || (t.cols && t.cols[0])),
        remain: t.remain,
        tag_uid: t.tag_uid,
      }));
    }
  }

  // Quản lý lưu lịch sử khi in xong
  const tracker = instance.activeJobTracker;
  if (s.gcode_state === 'RUNNING') {
    if (!tracker.startTime) {
      tracker.startTime = Date.now();
    }
    if (s.subtask_name) {
      tracker.taskName = s.subtask_name;
    }
    if (s.total_layer_num > 0) {
      tracker.totalLayers = s.total_layer_num;
    }
    tracker.recorded = false;
  } else if (prevGcodeState === 'RUNNING' || prevGcodeState === 'PAUSE') {
    if (!tracker.recorded && tracker.startTime) {
      if (s.gcode_state === 'FINISH') {
        handleInstanceJobTerminated(instance, 'SUCCESS');
      } else if (
        s.gcode_state === 'IDLE' ||
        s.gcode_state === 'FAILED' ||
        s.gcode_state === 'STOP'
      ) {
        handleInstanceJobTerminated(instance, 'STOPPED');
      }
    }
  }

  instance.connected = true;
  s.connected = true;
}

export function sendPrinterInstanceCommand(instance, payloadObj) {
  if (!instance || !instance.mqttClient || !instance.connected) {
    return false;
  }
  try {
    const topic = `device/${instance.config.serial}/request`;
    instance.mqttClient.publish(topic, JSON.stringify(payloadObj));
    return true;
  } catch (e) {
    console.error(`[BambuBridge] Lỗi gửi lệnh tới ${instance.config.name}:`, e);
    return false;
  }
}

export function sendPrinterCommand(printerId, payloadObj) {
  if (typeof printerId === 'object' && !payloadObj) {
    payloadObj = printerId;
    printerId = null;
  }
  const data = getPrintersConfig();
  const targetId = printerId || data.activePrinterId || data.printers[0]?.id;
  const instance = printersPool.get(targetId);
  if (!instance) {
    console.warn(`[BambuBridge] Không tìm thấy máy in ${targetId}`);
    return false;
  }
  return sendPrinterInstanceCommand(instance, payloadObj);
}

export function requestPushAll(printerId) {
  if (printerId) {
    const inst = printersPool.get(printerId);
    if (inst) {
      sendPrinterInstanceCommand(inst, { pushing: { sequence_id: '0', command: 'pushall' } });
    }
  } else {
    for (const inst of printersPool.values()) {
      if (inst.connected) {
        sendPrinterInstanceCommand(inst, { pushing: { sequence_id: '0', command: 'pushall' } });
      }
    }
  }
}

// 1. Tạm dừng in
export function pausePrint(printerId) {
  return sendPrinterCommand(printerId, {
    print: { sequence_id: String(Date.now()), command: 'pause' },
  });
}

// 2. Tiếp tục in
export function resumePrint(printerId) {
  return sendPrinterCommand(printerId, {
    print: { sequence_id: String(Date.now()), command: 'resume' },
  });
}

// 3. Hủy lệnh in
export function stopPrint(printerId) {
  const data = getPrintersConfig();
  const targetId = printerId || data.activePrinterId || data.printers[0]?.id;
  const inst = printersPool.get(targetId);
  if (inst && !inst.activeJobTracker.recorded && (inst.state.gcode_state === 'RUNNING' || inst.state.gcode_state === 'PAUSE')) {
    handleInstanceJobTerminated(inst, 'STOPPED');
  }
  return sendPrinterCommand(printerId, {
    print: { sequence_id: String(Date.now()), command: 'stop' },
  });
}

// 4. Chuyển đổi tốc độ in
export function setPrintSpeed(printerId, level) {
  const lvl = String(level);
  const success = sendPrinterCommand(printerId, {
    print: { sequence_id: String(Date.now()), command: 'print_speed', param: lvl },
  });
  if (success) {
    const inst = printersPool.get(printerId);
    if (inst) inst.state.spd_lvl = Number(level);
  }
  return success;
}

// 5. Làm nóng trước
export function preheatPrinter(printerId, nozzleTemp, bedTemp) {
  const gcodes = [];
  if (typeof nozzleTemp === 'number') gcodes.push(`M104 S${nozzleTemp}`);
  if (typeof bedTemp === 'number') gcodes.push(`M140 S${bedTemp}`);
  if (gcodes.length === 0) return false;

  return sendPrinterCommand(printerId, {
    print: { sequence_id: String(Date.now()), command: 'gcode_line', param: gcodes.join('\n') + '\n' },
  });
}

// 6. Điều khiển đèn buồng in
export function toggleChamberLight(printerId, mode) {
  const targetMode = mode === 'on' ? 'on' : 'off';
  const success = sendPrinterCommand(printerId, {
    system: { sequence_id: '0', command: 'ledctrl', led_node: 'chamber_light', led_mode: targetMode },
  });
  if (success) {
    const inst = printersPool.get(printerId);
    if (inst) inst.state.chamber_light = targetMode;
  }
  return success;
}

// 7. Bỏ qua các vật thể bị hỏng
export function skipObjects(printerId, objList) {
  const ids = Array.isArray(objList) ? objList.map(Number) : [Number(objList)];
  return sendPrinterCommand(printerId, {
    print: { sequence_id: String(Date.now()), command: 'skip_objects', obj_list: ids },
  });
}

// 8. Lấy danh sách các vật thể có trên bàn in từ file .3mf
export function getPrintableObjects(printerId) {
  const data = getPrintersConfig();
  const targetId = printerId || data.activePrinterId || data.printers[0]?.id;
  const inst = printersPool.get(targetId);
  const taskName = (inst?.state?.subtask_name || '').trim();

  if (!taskName) {
    return { filename: '', objects: [], skipped: inst?.state?.s_obj || [] };
  }

  const cleanTask = taskName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const searchDirs = [
    path.join(process.env.USERPROFILE || '', 'Downloads'),
    path.join(process.env.APPDATA || '', 'BambuStudio'),
    process.cwd(),
  ];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (!f.toLowerCase().endsWith('.3mf')) continue;
        const baseName = f.replace(/\.3mf$/i, '').toLowerCase();
        const cleanBase = baseName.replace(/[^a-z0-9]/g, '');

        if (cleanBase && (cleanTask.includes(cleanBase) || cleanBase.includes(cleanTask))) {
          const fullPath = path.join(dir, f);
          try {
            const out = execFileSync('tar', ['-xOf', fullPath, 'Metadata/plate_1.json'], {
              encoding: 'utf-8',
              windowsHide: true,
              stdio: ['pipe', 'pipe', 'ignore'],
            });
            const parsed = JSON.parse(out);
            if (Array.isArray(parsed.bbox_objects)) {
              return {
                filename: f,
                objects: parsed.bbox_objects.map((o) => ({
                  id: o.id,
                  name: o.name || `Vật thể #${o.id}`,
                  area: o.area,
                  bbox: o.bbox,
                  isSkipped: (inst?.state?.s_obj || []).includes(o.id),
                })),
                skipped: inst?.state?.s_obj || [],
              };
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  return {
    filename: taskName,
    objects: [],
    skipped: inst?.state?.s_obj || [],
  };
}

// Bật / Tắt kết nối của một máy in
export function togglePrinterEnabled(printerId, enabled) {
  const data = getPrintersConfig();
  const printer = data.printers?.find((p) => p.id === printerId);
  if (!printer) return false;

  printer.enabled = enabled;
  savePrintersConfig(data);

  const inst = printersPool.get(printerId);
  if (inst) {
    inst.config.enabled = enabled;
    if (enabled) {
      connectPrinterInstance(inst);
    } else {
      if (inst.mqttClient) {
        try {
          instance.mqttClient.removeAllListeners();
          inst.mqttClient.end(true);
        } catch (e) {}
        inst.mqttClient = null;
      }
      if (inst.camera.socket) {
        try { inst.camera.socket.destroy(); } catch (e) {}
        inst.camera.socket = null;
        inst.camera.connected = false;
      }
      inst.connected = false;
      inst.state.connected = false;
    }
  }
  return true;
}

// ================= CAMERA ENGINE PER PRINTER =================
function getCameraAuthPacket(code, user = 'bblp') {
  const pkt = Buffer.alloc(80);
  pkt.writeUInt32LE(0x40, 0);
  pkt.writeUInt32LE(0x3000, 4);
  Buffer.from(user, 'ascii').copy(pkt, 16);
  Buffer.from(code, 'ascii').copy(pkt, 48);
  return pkt;
}

export function startCameraPump(printerId) {
  const data = getPrintersConfig();
  const targetId = printerId || data.activePrinterId || data.printers[0]?.id;
  const instance = printersPool.get(targetId);
  if (!instance) return;

  const cam = instance.camera;
  if (cam.idleTimer) {
    clearTimeout(cam.idleTimer);
    cam.idleTimer = null;
  }
  if (cam.socket) return;

  const { ip, cameraPort = 6000, accessCode, name } = instance.config;
  console.log(`[BambuCamera] Đang mở kết nối camera tới ${name || ip}:${cameraPort}...`);
  cam.buffer = Buffer.alloc(0);

  cam.socket = tls.connect(
    {
      host: ip,
      port: cameraPort,
      rejectUnauthorized: false,
      timeout: 6000,
    },
    () => {
      cam.connected = true;
      console.log(`[BambuCamera] ✅ Đã kết nối TLS cổng 6000 [${name || ip}], gửi gói auth...`);
      const pkt = getCameraAuthPacket(accessCode);
      cam.socket.write(pkt);
    }
  );

  cam.socket.on('data', (chunk) => {
    cam.buffer = Buffer.concat([cam.buffer, chunk]);
    while (cam.buffer.length >= 16) {
      const payloadLen = cam.buffer.readUInt32LE(0);
      if (payloadLen <= 0 || payloadLen > 2 * 1024 * 1024) {
        const idx = cam.buffer.indexOf(Buffer.from([0xff, 0xd8]));
        if (idx >= 16) {
          cam.buffer = cam.buffer.slice(idx - 16);
          continue;
        }
        break;
      }
      const totalLen = 16 + payloadLen;
      if (cam.buffer.length < totalLen) break;
      const frame = cam.buffer.slice(16, totalLen);
      cam.buffer = cam.buffer.slice(totalLen);
      cam.latestFrame = frame;

      if (cam.clients.size > 0) {
        const header = `--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`;
        const footer = '\r\n';
        for (const clientRes of cam.clients) {
          try {
            clientRes.write(header);
            clientRes.write(frame);
            clientRes.write(footer);
          } catch (e) {
            cam.clients.delete(clientRes);
          }
        }
      }
    }
  });

  cam.socket.on('error', (err) => {
    console.error(`[BambuCamera] Lỗi socket camera [${name || ip}]:`, err.message);
  });

  cam.socket.on('close', () => {
    console.log(`[BambuCamera] Socket camera [${name || ip}] đã đóng.`);
    cam.socket = null;
    cam.connected = false;
  });
}

export function scheduleCameraStop(printerId) {
  const data = getPrintersConfig();
  const targetId = printerId || data.activePrinterId || data.printers[0]?.id;
  const instance = printersPool.get(targetId);
  if (!instance) return;

  const cam = instance.camera;
  if (cam.clients.size === 0 && !cam.idleTimer) {
    cam.idleTimer = setTimeout(() => {
      if (cam.clients.size === 0 && cam.socket) {
        console.log(`[BambuCamera] Tự động đóng camera [${instance.config.name}] do không có người xem.`);
        cam.socket.destroy();
        cam.socket = null;
        cam.connected = false;
      }
      cam.idleTimer = null;
    }, 4000);
  }
}

// Chụp ảnh nhanh và lưu vào ổ cứng
export async function captureAndSaveSnapshot(printerId, prefix = 'finish') {
  startCameraPump(printerId);
  const data = getPrintersConfig();
  const targetId = printerId || data.activePrinterId || data.printers[0]?.id;
  const instance = printersPool.get(targetId);
  if (!instance) return null;

  let attempts = 0;
  while (!instance.camera.latestFrame && attempts < 18) {
    await new Promise((r) => setTimeout(r, 200));
    attempts++;
  }

  if (!instance.camera.latestFrame) {
    console.warn(`[BambuBridge] Không lấy được frame camera của ${targetId} để lưu snapshot.`);
    scheduleCameraStop(printerId);
    return null;
  }

  const filename = `${prefix}_${targetId}_${Date.now()}.jpg`;
  const destPath = path.join(SNAPSHOTS_DIR, filename);
  try {
    fs.writeFileSync(destPath, instance.camera.latestFrame);
    console.log(`[BambuBridge] 📸 Đã lưu ảnh chụp camera thành công: ${filename}`);
    scheduleCameraStop(printerId);
    return `/snapshots/${filename}`;
  } catch (e) {
    console.error('[BambuBridge] Lỗi ghi file ảnh snapshot:', e);
    scheduleCameraStop(printerId);
    return null;
  }
}

// Xử lý khi in xong
export async function handleInstanceJobTerminated(instance, status = 'SUCCESS') {
  if (!instance) return;
  const tracker = instance.activeJobTracker;
  if (tracker.recorded) return;
  tracker.recorded = true;

  try {
    const isSuccess = status === 'SUCCESS';
    console.log(
      `[BambuBridge] 📸 [${instance.config.name}] ${isSuccess ? '🎉 IN XONG (SUCCESS)' : '⏹️ ĐÃ DỪNG IN (STOPPED)'}!`
    );

    const prefix = isSuccess ? 'finish' : 'stopped';
    const snapshotUrl = await captureAndSaveSnapshot(instance.id, prefix);

    const durationMin = tracker.startTime
      ? Math.round((Date.now() - tracker.startTime) / 60000)
      : 0;

    const historyItem = {
      id: `job_${instance.id}_${Date.now()}`,
      printerId: instance.id,
      printerName: instance.config.name || instance.config.model,
      taskName: tracker.taskName || instance.state.subtask_name || 'Vật thể in',
      status: isSuccess ? 'SUCCESS' : 'STOPPED',
      completedAt: new Date().toISOString(),
      durationMinutes: durationMin,
      totalLayers: instance.state.total_layer_num || tracker.totalLayers || 0,
      currentLayer: instance.state.layer_num || 0,
      progress: isSuccess ? 100 : (instance.state.progress || 0),
      snapshotUrl: snapshotUrl || '',
      nozzleTemp: instance.state.nozzle_temper,
      bedTemp: instance.state.bed_temper,
    };

    addHistoryEntry(historyItem);

    if (isSuccess) {
      checkAndTriggerAutoPowerOff();
    }
  } catch (err) {
    console.error(`[BambuBridge] Lỗi khi lưu lịch sử cho ${instance.config.name}:`, err);
  } finally {
    tracker.taskName = '';
    tracker.startTime = null;
    tracker.totalLayers = 0;
    tracker.lastState = status;
  }
}

// Đọc lịch sử in
export function getHistoryList() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return JSON.parse(content || '[]');
    }
  } catch (e) {
    console.error('[BambuBridge] Lỗi đọc lịch sử:', e);
  }
  return [];
}

// Lưu 1 mục vào lịch sử in
export function addHistoryEntry(entry) {
  try {
    const list = getHistoryList();
    list.unshift(entry);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2));
    console.log('[BambuBridge] 📜 Đã lưu lượt in vào lịch sử:', entry.taskName);
    return true;
  } catch (e) {
    console.error('[BambuBridge] Lỗi ghi lịch sử:', e);
    return false;
  }
}

// Xóa 1 mục khỏi lịch sử in
export function deleteHistoryEntry(id) {
  try {
    let list = getHistoryList();
    const itemToDelete = list.find((item) => item.id === id);
    if (itemToDelete && itemToDelete.snapshotUrl) {
      const imgPath = path.join(process.cwd(), 'public', itemToDelete.snapshotUrl);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }
    list = list.filter((item) => item.id !== id);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2));
    return true;
  } catch (e) {
    console.error('[BambuBridge] Lỗi xóa lịch sử:', e);
    return false;
  }
}

// Tự động ngắt điện máy in qua Google Home nếu được bật
function checkAndTriggerAutoPowerOff() {
  try {
    const smarthome = getSmartHomeConfig();
    const printerPlug = smarthome.devices?.find((d) => d.id === 'printer_plug');
    if (printerPlug && printerPlug.autoOffOnFinish) {
      console.log('[GoogleHome] ⏳ Phát hiện đã in xong! Chờ 3 phút để quạt hạ nhiệt độ trước khi ngắt nguồn máy in 3D...');
      setTimeout(async () => {
        try {
          console.log('[GoogleHome] 🔌 Đang tự động tắt máy in 3D qua Google Home...');
          await sendGoogleAssistantQuery('tắt máy in 3D');
          printerPlug.state = false;
          saveSmartHomeConfig(smarthome);
        } catch (e) {
          console.error('[GoogleHome] Lỗi tự động ngắt điện máy in:', e.message);
        }
      }, 180000);
    }
  } catch (e) {
    console.error('[GoogleHome] Lỗi kiểm tra tự động ngắt điện:', e);
  }
}

// Lấy trạng thái tổng hợp của TẤT CẢ các máy in
export function getBambuStatus() {
  const printersData = getPrintersConfig();
  const printersList = [];

  for (const p of printersData.printers) {
    const inst = printersPool.get(p.id) || getOrCreatePrinterInstance(p);
    inst.config.name = p.name || p.model;
    inst.state.name = p.name || p.model;
    printersList.push({
      id: p.id,
      name: p.name || p.model,
      model: p.model || 'Bambu Lab P1S',
      ip: p.ip,
      serial: p.serial,
      wifi: p.wifi || 'mh 2.4g',
      lanOnlyMode: p.lanOnlyMode !== undefined ? p.lanOnlyMode : false,
      enabled: p.enabled !== false,
      connected: Boolean(inst.connected),
      lastUpdated: inst.lastUpdated,
      lastError: inst.lastError,
      printer: {
        ...inst.state,
        name: p.name || p.model,
        cameraConnected: Boolean(inst.camera.connected || inst.camera.clients.size > 0),
      },
    });
  }

  const p1 = printersList[0];
  return {
    success: true,
    activePrinterId: printersData.activePrinterId || p1?.id,
    printers: printersList,
    // Legacy fields for backward compatibility
    connected: Boolean(p1?.connected),
    lastUpdated: p1?.lastUpdated,
    lastError: p1?.lastError,
    printerEnabled: p1 ? p1.enabled !== false : true,
    printer: p1?.printer || null,
  };
}

// Khởi tạo kết nối MQTT cho tất cả máy in trong config
export function initBambuBridge() {
  const data = getPrintersConfig();
  console.log(`[BambuBridge] 🚀 Khởi động dịch vụ kết nối đồng thời ${data.printers.length} máy in...`);

  for (const p of data.printers) {
    const instance = getOrCreatePrinterInstance(p);
    connectPrinterInstance(instance);
  }

  if (globalThis.__bambu_push_interval__) {
    clearInterval(globalThis.__bambu_push_interval__);
  }
  globalThis.__bambu_push_interval__ = setInterval(() => {
    requestPushAll();
  }, 10000);
}

// ================= VITE PLUGIN EXPORT =================
export function bambuVitePlugin() {
  return {
    name: 'bambu-bridge-plugin',
    configureServer(server) {
      initBambuBridge();

      server.middlewares.use(async (req, res, next) => {
        const fullUrl = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
        const url = fullUrl.pathname;
        const queryPrinterId = fullUrl.searchParams.get('printerId');

        // Phục vụ tĩnh trực tiếp các tệp trong public/wallpapers và public/snapshots
        // Đảm bảo ảnh tải lên mới lập tức hiển thị được ngay mà không bị Vite SPA fallback trả về index.html
        if (req.method === 'GET' && (url.startsWith('/wallpapers/') || url.startsWith('/snapshots/'))) {
          const isWallpaper = url.startsWith('/wallpapers/');
          const dir = isWallpaper ? WALLPAPERS_DIR : SNAPSHOTS_DIR;
          const fileName = path.basename(decodeURIComponent(url));
          const filePath = path.join(dir, fileName);

          if (fs.existsSync(filePath)) {
            const ext = path.extname(fileName).toLowerCase();
            const mimeTypes = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.webp': 'image/webp',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            return;
          }
        }

        // 1. API Telemetry Trạng thái tất cả máy in
        if (url === '/api/bambu/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify(getBambuStatus()));
          return;
        }

        // 2. Yêu cầu làm mới tức thì
        if (url === '/api/bambu/refresh' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            const { printerId } = JSON.parse(body || '{}');
            requestPushAll(printerId || queryPrinterId);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          });
          return;
        }

        // 3. ĐIỀU KHIỂN TÁC VỤ: PAUSE / RESUME / STOP
        if (url === '/api/bambu/job' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { printerId, action } = JSON.parse(body || '{}');
              const targetId = printerId || queryPrinterId;
              let success = false;
              if (action === 'pause') success = pausePrint(targetId);
              else if (action === 'resume') success = resumePrint(targetId);
              else if (action === 'stop') success = stopPrint(targetId);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success, action, printerId: targetId }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 4. ĐIỀU KHIỂN TỐC ĐỘ IN
        if (url === '/api/bambu/speed' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { printerId, level } = JSON.parse(body || '{}');
              const targetId = printerId || queryPrinterId;
              const success = setPrintSpeed(targetId, level);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success, level, printerId: targetId }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 5. ĐIỀU KHIỂN NHIỆT ĐỘ LÀM NÓNG TRƯỚC (PREHEAT)
        if (url === '/api/bambu/preheat' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { printerId, nozzle, bed } = JSON.parse(body || '{}');
              const targetId = printerId || queryPrinterId;
              const success = preheatPrinter(targetId, nozzle, bed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success, nozzle, bed, printerId: targetId }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 6. ĐIỀU KHIỂN ĐÈN BUỒNG IN
        if (url === '/api/bambu/light' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { printerId, mode } = JSON.parse(body || '{}');
              const targetId = printerId || queryPrinterId;
              const success = toggleChamberLight(targetId, mode);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success, mode, printerId: targetId }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 7. LẤY DANH SÁCH LỊCH SỬ IN ẤN
        if (url === '/api/bambu/history' && req.method === 'GET') {
          const list = getHistoryList();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify({ success: true, history: list }));
          return;
        }

        // 8. TỰ TAY CHỤP ẢNH SNAPSHOT LƯU VÀO LỊCH SỬ NGAY LẬP TỨC
        if (url === '/api/bambu/history/snapshot' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const { printerId } = JSON.parse(body || '{}');
              const targetId = printerId || queryPrinterId || 'p1s_1';
              const inst = printersPool.get(targetId);
              const snapshotUrl = await captureAndSaveSnapshot(targetId, 'manual');
              const historyItem = {
                id: `manual_${targetId}_${Date.now()}`,
                printerId: targetId,
                printerName: inst?.config?.name || 'Bambu Lab P1S',
                taskName: inst?.state?.subtask_name || 'Ảnh chụp thủ công',
                status: inst?.state?.gcode_state === 'RUNNING' ? 'IN_PROGRESS' : 'MANUAL',
                completedAt: new Date().toISOString(),
                durationMinutes: 0,
                totalLayers: inst?.state?.layer_num || 0,
                snapshotUrl: snapshotUrl || '',
                nozzleTemp: inst?.state?.nozzle_temper || 0,
                bedTemp: inst?.state?.bed_temper || 0,
              };
              addHistoryEntry(historyItem);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, entry: historyItem }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 9. XÓA 1 MỤC TRONG LỊCH SỬ IN
        if (url?.startsWith('/api/bambu/history/') && req.method === 'DELETE') {
          const id = url.split('/').pop();
          const success = deleteHistoryEntry(id);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success, id }));
          return;
        }

        // 10. LUỒNG CAMERA VIDEO TRỰC TIẾP (MJPEG STREAM)
        if (url === '/api/bambu/camera/mjpeg' && req.method === 'GET') {
          const targetId = queryPrinterId || 'p1s_1';
          const inst = printersPool.get(targetId) || Array.from(printersPool.values())[0];

          if (!inst) {
            res.statusCode = 404;
            res.end('Printer not found');
            return;
          }

          res.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'close',
            'Pragma': 'no-cache',
            'Access-Control-Allow-Origin': '*',
          });

          inst.camera.clients.add(res);
          startCameraPump(targetId);

          if (inst.camera.latestFrame) {
            try {
              res.write(
                `--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${inst.camera.latestFrame.length}\r\n\r\n`
              );
              res.write(inst.camera.latestFrame);
              res.write('\r\n');
            } catch (e) {}
          }

          req.on('close', () => {
            inst.camera.clients.delete(res);
            scheduleCameraStop(targetId);
          });
          return;
        }

        // 11. ẢNH SNAPSHOT ĐƠN
        if (url === '/api/bambu/camera/snapshot' && req.method === 'GET') {
          const targetId = queryPrinterId || 'p1s_1';
          const inst = printersPool.get(targetId) || Array.from(printersPool.values())[0];
          if (!inst) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Không tìm thấy máy in' }));
            return;
          }

          startCameraPump(targetId);
          if (inst.camera.latestFrame) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(inst.camera.latestFrame);
            scheduleCameraStop(targetId);
          } else {
            setTimeout(() => {
              if (inst.camera.latestFrame) {
                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('Cache-Control', 'no-cache');
                res.end(inst.camera.latestFrame);
              } else {
                res.statusCode = 503;
                res.end(JSON.stringify({ error: 'Đang tải camera...' }));
              }
              scheduleCameraStop(targetId);
            }, 1200);
          }
          return;
        }

        // 12. LẤY DANH SÁCH VẬT THỂ TRÊN BÀN IN (CHO TÍNH NĂNG SKIP OBJECTS)
        if (url === '/api/bambu/objects' && req.method === 'GET') {
          const targetId = queryPrinterId || 'p1s_1';
          const data = getPrintableObjects(targetId);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify({ success: true, ...data }));
          return;
        }

        // 13. GỬI LỆNH BỎ QUA VẬT THỂ BỊ HỎNG (SKIP OBJECTS)
        if (url === '/api/bambu/skip' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { printerId, obj_list, id } = JSON.parse(body || '{}');
              const targetId = printerId || queryPrinterId || 'p1s_1';
              const targetList = obj_list || (id !== undefined ? [id] : []);
              const success = skipObjects(targetId, targetList);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success, skipped: targetList, printerId: targetId }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 14. LẤY DANH SÁCH MÁY IN
        if (url === '/api/bambu/printers' && req.method === 'GET') {
          const data = getPrintersConfig();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify({ success: true, ...data }));
          return;
        }

        // 15. BẬT / TẮT KẾT NỐI MÁY IN
        if (url === '/api/bambu/printers/toggle' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { id, enabled } = JSON.parse(body || '{}');
              const data = getPrintersConfig();
              const targetId = id || data.activePrinterId || 'p1s_1';
              const printer = data.printers.find((p) => p.id === targetId);
              if (!printer) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Không tìm thấy máy in' }));
                return;
              }
              const newEnabled = enabled !== undefined ? Boolean(enabled) : !printer.enabled;
              togglePrinterEnabled(targetId, newEnabled);
              const updatedData = getPrintersConfig();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, enabled: newEnabled, ...updatedData }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // ================= GOOGLE HOME & SMART DEVICES API =================

        // 16. TRẠNG THÁI KẾT NỐI GOOGLE HOME
        if (url === '/api/google/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify(getGoogleAuthStatus()));
          return;
        }

        // 17. LẤY URL XÁC THỰC OAUTH GOOGLE
        if (url === '/api/google/auth-url' && req.method === 'GET') {
          try {
            const host = req.headers.host || 'localhost:5173';
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const redirectUri = `${protocol}://${host}/api/google/callback`;
            const authUrl = generateAuthUrl(redirectUri);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, url: authUrl, redirectUri }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        // 18. CALLBACK NHẬN CODE TỪ GOOGLE OAUTH
        if (url === '/api/google/callback' && req.method === 'GET') {
          const code = fullUrl.searchParams.get('code');
          const error = fullUrl.searchParams.get('error');

          if (error) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(`
              <div style="font-family:sans-serif; text-align:center; padding:50px;">
                <h2 style="color:#ef4444;">❌ Lỗi xác thực Google: ${error}</h2>
                <p>Vui lòng đóng tab này và thử lại từ PrintFlow.</p>
              </div>
            `);
            return;
          }

          if (code) {
            try {
              const host = req.headers.host || 'localhost:5173';
              const protocol = req.headers['x-forwarded-proto'] || 'http';
              const redirectUri = `${protocol}://${host}/api/google/callback`;
              await handleAuthCallback(code, redirectUri);
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>Kết nối Google Home Thành Công</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: #1e293b; padding: 40px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center; max-width: 480px; border: 1px solid #334155; }
                    .icon { font-size: 54px; margin-bottom: 16px; }
                    h2 { margin: 0 0 12px; color: #38bdf8; }
                    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
                    .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; transition: 0.2s; }
                    .btn:hover { background: #4f46e5; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="icon">🎉</div>
                    <h2>Đã Kết Nối Google Home!</h2>
                    <p>PrintFlow đã được cấp quyền điều khiển thiết bị thông minh qua Google Assistant. Bạn có thể đóng tab này để quay lại trang điều khiển.</p>
                    <a href="/" class="btn">Quay lại PrintFlow</a>
                  </div>
                  <script>
                    setTimeout(() => {
                      if (window.opener) {
                        window.close();
                      } else {
                        window.location.href = '/';
                      }
                    }, 2500);
                  </script>
                </body>
                </html>
              `);
            } catch (e) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(`
                <div style="font-family:sans-serif; text-align:center; padding:50px;">
                  <h2 style="color:#ef4444;">❌ Lỗi lưu token: ${e.message}</h2>
                  <p>Vui lòng thử lại.</p>
                </div>
              `);
            }
            return;
          }
        }

        // 19. HỦY KẾT NỐI GOOGLE
        if (url === '/api/google/disconnect' && req.method === 'POST') {
          const result = disconnectGoogle();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
          return;
        }

        // 20. LẤY DANH SÁCH THIẾT BỊ GOOGLE HOME
        if (url === '/api/google/devices' && req.method === 'GET') {
          const config = getSmartHomeConfig();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify(config));
          return;
        }

        // 21. GỬI LỆNH ĐIỀU KHIỂN GOOGLE HOME
        if (url === '/api/google/command' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const { query, deviceId, newState } = JSON.parse(body || '{}');
              if (!query) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Thiếu câu lệnh query' }));
                return;
              }

              console.log(`[GoogleHome] 🎙️ Gửi lệnh tới Google Assistant: "${query}"`);
              const result = await sendGoogleAssistantQuery(query);

              if (deviceId) {
                const smarthome = getSmartHomeConfig();
                const dev = smarthome.devices?.find((d) => d.id === deviceId);
                if (dev) {
                  if (newState !== undefined) {
                    dev.state = Boolean(newState);
                  } else {
                    dev.state = !dev.state;
                  }
                  saveSmartHomeConfig(smarthome);
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, ...result }));
            } catch (e) {
              console.error('[GoogleHome] Lỗi thực thi lệnh:', e);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 22. CÀI ĐẶT TỰ ĐỘNG TẮT NGUỒN KHI IN XONG
        if (url === '/api/google/devices/auto-off' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { enabled } = JSON.parse(body || '{}');
              const smarthome = getSmartHomeConfig();
              const plug = smarthome.devices?.find((d) => d.id === 'printer_plug');
              if (plug) {
                plug.autoOffOnFinish = Boolean(enabled);
                saveSmartHomeConfig(smarthome);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, autoOffOnFinish: Boolean(enabled) }));
            } catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 23. LẤY THÔNG TIN TÀI KHOẢN GOOGLE
        if (url === '/api/google/userinfo' && req.method === 'GET') {
          try {
            const profile = await getGoogleUserProfile();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(JSON.stringify({ success: !!profile, user: profile }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        // ================= CUSTOM WALLPAPERS STORAGE API =================

        // 24. LẤY DANH SÁCH ẢNH NỀN TẢI LÊN TRONG THƯ MỤC PUBLIC/WALLPAPERS
        if (url === '/api/wallpapers' && req.method === 'GET') {
          const list = getCustomWallpapers();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify({ success: true, wallpapers: list, folder: WALLPAPERS_DIR }));
          return;
        }

        // 25. TẢI LÊN ẢNH NỀN MỚI VÀ LƯU VÀO THƯ MỤC PUBLIC/WALLPAPERS
        if (url === '/api/wallpapers/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { filename, name, dataBase64 } = JSON.parse(body || '{}');
              if (!dataBase64) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Thiếu dữ liệu hình ảnh (Base64)' }));
                return;
              }

              const matches = dataBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
              const rawBase64 = matches ? matches[2] : dataBase64;
              const ext = (path.extname(filename || '').toLowerCase()) || '.jpg';
              const cleanBase = path.basename(filename || 'wallpaper', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
              const safeFileName = `${cleanBase}_${Date.now()}${ext}`;
              const targetPath = path.join(WALLPAPERS_DIR, safeFileName);

              const buffer = Buffer.from(rawBase64, 'base64');
              fs.writeFileSync(targetPath, buffer);

              const newWallpaper = {
                id: `custom_${Date.now()}`,
                title: name || cleanBase || 'Ảnh nền đã tải lên',
                filename: safeFileName,
                url: `/wallpapers/${safeFileName}`,
                category: 'Đã tải lên',
                size: buffer.length,
                uploadedAt: new Date().toISOString(),
              };

              const list = getCustomWallpapers();
              const existingIdx = list.findIndex((w) => w.filename === safeFileName);
              if (existingIdx >= 0) {
                list[existingIdx] = newWallpaper;
              } else {
                list.unshift(newWallpaper);
              }
              saveCustomWallpapers(list);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, wallpaper: newWallpaper, wallpapers: list }));
            } catch (e) {
              console.error('[Wallpaper] Lỗi upload ảnh:', e);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 26. XÓA ẢNH NỀN KHỎI THƯ MỤC
        if (url?.startsWith('/api/wallpapers') && req.method === 'DELETE') {
          const id = fullUrl.searchParams.get('id') || url.split('/').pop();
          const list = getCustomWallpapers();
          const item = list.find((w) => w.id === id);
          if (item && item.filename) {
            const filePath = path.join(WALLPAPERS_DIR, item.filename);
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (err) {
                console.error('[Wallpaper] Không thể xóa file:', err);
              }
            }
          }
          const updated = list.filter((w) => w.id !== id);
          saveCustomWallpapers(updated);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, wallpapers: updated }));
          return;
        }

        // 27. MỞ THƯ MỤC PUBLIC/WALLPAPERS TRÊN MÁY TÍNH (WINDOWS EXPLORER)
        if (url === '/api/wallpapers/open-folder' && req.method === 'POST') {
          try {
            if (process.platform === 'win32') {
              spawn('explorer.exe', [WALLPAPERS_DIR], { detached: true, stdio: 'ignore' }).unref();
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, folder: WALLPAPERS_DIR }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        next();
      });
    },
  };
}
