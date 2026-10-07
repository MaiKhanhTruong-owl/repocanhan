import { createClient } from '@supabase/supabase-js';

let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Tự động chuẩn hóa URL nếu người dùng copy kèm đuôi /rest/v1/
if (rawUrl.includes('/rest/v1')) {
  rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
}
rawUrl = rawUrl.replace(/\/+$/, '');

const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawAnonKey &&
  !rawUrl.includes('your-project-id') &&
  !rawAnonKey.includes('your-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawAnonKey)
  : null;
