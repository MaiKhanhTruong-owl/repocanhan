import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import GoogleAssistant from 'google-assistant';

const DATA_DIR = path.join(process.cwd(), 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'google_tokens.json');
const SMARTHOME_FILE = path.join(DATA_DIR, 'smarthome.json');

// Đảm bảo thư mục data tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Khởi tạo file thiết bị mẫu nếu chưa có
const DEFAULT_DEVICES = [
  {
    id: 'printer_plug',
    name: 'máy in 3D',
    type: 'plug',
    label: 'Ổ cắm Máy In 3D',
    state: false,
    autoOffOnFinish: false, // Tự động ngắt điện khi in xong
  },
  {
    id: 'desk_lamp',
    name: 'đèn bàn',
    type: 'light',
    label: 'Đèn Bàn',
    state: false,
  },
  {
    id: 'aquarium_light',
    name: 'đèn hồ cá',
    type: 'light',
    label: 'Đèn Hồ Cá',
    state: false,
  },
];

export function getSmartHomeConfig() {
  try {
    if (fs.existsSync(SMARTHOME_FILE)) {
      const content = fs.readFileSync(SMARTHOME_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    }
  } catch (e) {
    console.error('[GoogleHome] Lỗi đọc smarthome.json:', e);
  }
  return { devices: DEFAULT_DEVICES };
}

export function saveSmartHomeConfig(data) {
  try {
    fs.writeFileSync(SMARTHOME_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('[GoogleHome] Lỗi ghi smarthome.json:', e);
    return false;
  }
}

// Tìm file client_secret trong thư mục gốc
export function getCredentialsConfig() {
  try {
    const files = fs.readdirSync(process.cwd());
    const secretFile = files.find(
      (f) => f.startsWith('client_secret') && f.endsWith('.json')
    );
    if (secretFile) {
      const content = fs.readFileSync(path.join(process.cwd(), secretFile), 'utf-8');
      const parsed = JSON.parse(content);
      const creds = parsed.installed || parsed.web;
      if (creds) {
        return {
          filename: secretFile,
          clientId: creds.client_id,
          clientSecret: creds.client_secret,
          projectId: creds.project_id || 'printflow-smarthome',
          redirectUris: creds.redirect_uris || ['http://localhost'],
        };
      }
    }
  } catch (e) {
    console.error('[GoogleHome] Lỗi đọc file credentials:', e);
  }
  return null;
}

// Lấy OAuth2Client
export function getOAuth2Client(redirectUri = 'http://localhost:5173/api/google/callback') {
  const creds = getCredentialsConfig();
  if (!creds) return null;
  return new OAuth2Client(creds.clientId, creds.clientSecret, redirectUri);
}

// Kiểm tra trạng thái đăng nhập
export function getGoogleAuthStatus() {
  const creds = getCredentialsConfig();
  if (!creds) {
    return {
      hasCredentialsFile: false,
      connected: false,
      message: 'Chưa tìm thấy file credentials JSON.',
    };
  }

  let hasTokens = false;
  let tokens = null;
  if (fs.existsSync(TOKENS_FILE)) {
    try {
      tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
      hasTokens = !!(tokens && (tokens.access_token || tokens.refresh_token));
    } catch (_) {}
  }

  return {
    hasCredentialsFile: true,
    projectId: creds.projectId,
    connected: hasTokens,
    tokensSavedAt: tokens?.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
  };
}

// Tạo URL xác thực OAuth Google
export function generateAuthUrl(redirectUri = 'http://localhost:5173/api/google/callback') {
  const oauth2Client = getOAuth2Client(redirectUri);
  if (!oauth2Client) {
    throw new Error('Chưa tìm thấy file credentials JSON trong thư mục PrintFlow!');
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/assistant-sdk-prototype',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
  });
}

// Lưu Token khi Google redirect về với ?code=
export async function handleAuthCallback(code, redirectUri = 'http://localhost:5173/api/google/callback') {
  const oauth2Client = getOAuth2Client(redirectUri);
  if (!oauth2Client) {
    throw new Error('Không thể khởi tạo OAuth client.');
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Lưu tokens ra file
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));

  // Tự động đăng ký Device Model và Device Instance nếu chưa có
  try {
    await registerDeviceModelAndInstance(tokens.access_token);
  } catch (e) {
    console.warn('[GoogleHome] Đăng ký Device Model nền:', e.message);
  }

  return tokens;
}

// Đăng xuất Google
export function disconnectGoogle() {
  if (fs.existsSync(TOKENS_FILE)) {
    fs.unlinkSync(TOKENS_FILE);
  }
  return { success: true };
}

// Lấy thông tin tài khoản Google của người dùng
export async function getGoogleUserProfile() {
  const creds = getCredentialsConfig();
  if (!creds || !fs.existsSync(TOKENS_FILE)) {
    return null;
  }

  try {
    const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
    const oauth2Client = new OAuth2Client(creds.clientId, creds.clientSecret);
    oauth2Client.setCredentials(tokens);

    // Tự động làm mới access token nếu hết hạn
    const { token } = await oauth2Client.getAccessToken();
    if (!token) return null;

    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: data.email,
        email: data.email,
        username: data.email?.split('@')[0] || 'google_user',
        name: data.name || data.email?.split('@')[0],
        picture: data.picture,
        provider: 'google',
      };
    }
  } catch (err) {
    console.error('[GoogleAuth] Lỗi lấy user profile:', err);
  }
  return null;
}

// Tự động đăng ký Device Model & Instance với Google Assistant API
async function registerDeviceModelAndInstance(accessToken) {
  const creds = getCredentialsConfig();
  if (!creds || !creds.projectId) return;

  const modelId = `${creds.projectId}-printflow-hub`;
  const deviceId = `printflow-hub-instance-01`;

  // 1. Tạo Model
  try {
    const res = await fetch(
      `https://embeddedassistant.googleapis.com/v1alpha2/projects/${creds.projectId}/deviceModels/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceModelId: modelId,
          projectId: creds.projectId,
          deviceType: 'action.devices.types.SWITCH',
          clientType: 'SDK_SERVICE',
          manifest: {
            manufacturer: 'PrintFlow',
            productName: 'PrintFlow Hub',
            deviceDescription: 'PrintFlow 3D Smart Hub Controller',
          },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.log('[GoogleHome] Đăng ký model status:', res.status, err);
    }
  } catch (e) {
    console.warn('[GoogleHome] Bỏ qua đăng ký model nếu đã tồn tại:', e.message);
  }

  // 2. Tạo Instance
  try {
    await fetch(
      `https://embeddedassistant.googleapis.com/v1alpha2/projects/${creds.projectId}/devices/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: deviceId,
          modelId: modelId,
          clientType: 'SDK_SERVICE',
        }),
      }
    );
  } catch (e) {
    console.warn('[GoogleHome] Bỏ qua đăng ký device instance:', e.message);
  }
}

// Chuyển lệnh tiếng Việt sang dạng tiếng Anh chuẩn mà Google Assistant SDK hiểu
function normalizeQueryForAssistant(text) {
  let q = String(text || '').trim();
  if (/^(bật|mở|khởi động)\s+/i.test(q)) {
    q = q.replace(/^(bật|mở|khởi động)\s+/i, 'turn on ');
  } else if (/^(tắt|ngắt|đóng)\s+/i.test(q)) {
    q = q.replace(/^(tắt|ngắt|đóng)\s+/i, 'turn off ');
  }
  return q;
}

// Gửi câu lệnh văn bản tới Google Assistant
export async function sendGoogleAssistantQuery(queryText) {
  const creds = getCredentialsConfig();
  if (!creds) {
    throw new Error('Chưa cấu hình Google credentials.');
  }

  if (!fs.existsSync(TOKENS_FILE)) {
    throw new Error('Chưa đăng nhập Google Home. Vui lòng bấm Kết nối tài khoản Google.');
  }

  const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
  const oauth2Client = new OAuth2Client(creds.clientId, creds.clientSecret);
  oauth2Client.setCredentials(tokens);

  // Lắng nghe nếu token được tự động làm mới
  oauth2Client.on('tokens', (newTokens) => {
    const updated = { ...tokens, ...newTokens };
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(updated, null, 2));
  });

  const modelId = `${creds.projectId}-printflow-hub`;
  const deviceId = `printflow-hub-instance-01`;

  const normalizedQuery = normalizeQueryForAssistant(queryText);
  console.log(`[GoogleAssistant] Thực thi query: "${normalizedQuery}" (gốc: "${queryText}")`);

  return new Promise((resolve, reject) => {
    let assistant;
    try {
      assistant = new GoogleAssistant({ oauth2Client });
    } catch (err) {
      return reject(new Error('Khởi tạo Google Assistant thất bại: ' + err.message));
    }

    const conversationConfig = {
      textQuery: normalizedQuery,
      lang: 'en-US',
      deviceModelId: modelId,
      deviceId: deviceId,
      isNew: true,
    };

    let responseText = '';
    let isFinished = false;
    const audioChunks = [];

    assistant.start(conversationConfig, (conversation) => {
      conversation.on('response', (text) => {
        if (text) responseText = text;
      });

      conversation.on('audio-data', (data) => {
        if (data) audioChunks.push(data);
      });

      conversation.on('device-action', (action) => {
        console.log('[GoogleAssistant] Device Action:', action);
      });

      conversation.on('ended', (error, continueConversation) => {
        if (isFinished) return;
        isFinished = true;
        if (error) {
          console.error('[GoogleAssistant] Lỗi cuộc hội thoại:', error);
          return reject(error);
        }

        // Tạo file WAV âm thanh phản hồi từ Google Assistant để web tự động phát
        let audioUrl = null;
        if (audioChunks.length > 0) {
          try {
            const raw = Buffer.concat(audioChunks);
            const sampleRate = 24000;
            const numChannels = 1;
            const bitsPerSample = 16;
            const header = Buffer.alloc(44);
            header.write('RIFF', 0);
            header.writeUInt32LE(36 + raw.length, 4);
            header.write('WAVE', 8);
            header.write('fmt ', 12);
            header.writeUInt32LE(16, 16);
            header.writeUInt16LE(1, 20); // PCM
            header.writeUInt16LE(numChannels, 22);
            header.writeUInt32LE(sampleRate, 24);
            header.writeUInt32LE(sampleRate * numChannels * 2, 28);
            header.writeUInt16LE(numChannels * 2, 32);
            header.writeUInt16LE(bitsPerSample, 34);
            header.write('data', 36);
            header.writeUInt32LE(raw.length, 40);

            const wavBuffer = Buffer.concat([header, raw]);
            const wavPath = path.join(process.cwd(), 'public', 'assistant_response.wav');
            fs.writeFileSync(wavPath, wavBuffer);
            audioUrl = `/assistant_response.wav?t=${Date.now()}`;
          } catch (e) {
            console.error('[GoogleAssistant] Lỗi ghi file âm thanh WAV:', e);
          }
        }

        resolve({
          query: queryText,
          response: responseText || `Đã gửi lệnh "${queryText}" tới Google Home.`,
          audioUrl,
          continueConversation,
        });
      });

      conversation.on('error', (err) => {
        if (isFinished) return;
        isFinished = true;
        console.error('[GoogleAssistant] Lỗi stream:', err);
        reject(err);
      });
    });

    // Timeout phòng ngừa sau 12 giây
    setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        resolve({
          query: queryText,
          response: responseText || `Đã gửi lệnh "${queryText}" tới Google Home.`,
        });
      }
    }, 12000);
  });
}
