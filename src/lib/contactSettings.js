// contactSettings.js — مدیریت لینک‌های ارتباطی قابل تنظیم (واتساپ/تلگرام/ایمیل/تلفن)
import { createSupabaseEntity } from './supabaseApi';

const sbAppSettings = createSupabaseEntity('AppSetting');

const DEFAULT_CONTACTS = [
  { type: 'whatsapp', label: 'واتساپ', value: '', icon: 'MessageCircle', sort_order: 0, is_active: true },
  { type: 'telegram', label: 'تلگرام', value: '', icon: 'Send', sort_order: 1, is_active: true },
  { type: 'email', label: 'ایمیل', value: '', icon: 'Mail', sort_order: 2, is_active: true },
  { type: 'phone', label: 'تلفن', value: '', icon: 'Phone', sort_order: 3, is_active: true },
  { type: 'website', label: 'وب‌سایت', value: '', icon: 'Globe', sort_order: 4, is_active: true },
  { type: 'instagram', label: 'اینستاگرام', value: '', icon: 'Instagram', sort_order: 5, is_active: false },
  { type: 'facebook', label: 'فیسبوک', value: '', icon: 'Facebook', sort_order: 6, is_active: false },
];

const SETTING_KEY = 'contact_settings';

export async function getContactSettings() {
  try {
    const res = await fetch('/functions/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getPublicContactSettings' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) {
      console.error('[contactSettings] Backend error:', data.error || 'unknown');
      return [];
    }
    if (!data.contacts || !Array.isArray(data.contacts) || data.contacts.length === 0) {
      return [];
    }
    // Merge with defaults to ensure new types appear
    const merged = DEFAULT_CONTACTS.map(def => {
      const found = data.contacts.find(c => c.type === def.type);
      return found ? { ...def, ...found } : def;
    });
    return merged.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  } catch (err) {
    console.error('[contactSettings] getContactSettings error:', err);
    return [];
  }
}

export async function saveContactSettings(contacts) {
  const jsonValue = JSON.stringify({ contacts, updated_at: new Date().toISOString() });
  const existing = await sbAppSettings.filter({ key: SETTING_KEY });
  if (existing && existing.length > 0) {
    await sbAppSettings.update(existing[0].id, { value: jsonValue });
    return existing[0].id;
  }
  const created = await sbAppSettings.create({ key: SETTING_KEY, value: jsonValue });
  return created?.id;
}

export async function updateContact(type, updates) {
  const contacts = await getContactSettings();
  const idx = contacts.findIndex(c => c.type === type);
  if (idx === -1) return;
  contacts[idx] = { ...contacts[idx], ...updates };
  await saveContactSettings(contacts);
}

export function getContactUrl(type, value) {
  if (!value) return '#';
  const v = value.trim();
  switch (type) {
    case 'whatsapp':
      return v.startsWith('http') ? v : `https://wa.me/${v.replace(/[^0-9]/g, '')}`;
    case 'telegram':
      return v.startsWith('http') ? v : (v.startsWith('@') ? `https://t.me/${v.slice(1)}` : `https://t.me/${v}`);
    case 'email':
      return `mailto:${v}`;
    case 'phone':
      return `tel:${v}`;
    case 'website':
      return v.startsWith('http') ? v : `https://${v}`;
    case 'instagram':
      return v.startsWith('http') ? v : `https://instagram.com/${v.replace('@', '')}`;
    case 'facebook':
      return v.startsWith('http') ? v : `https://facebook.com/${v}`;
    default:
      return v;
  }
}

export function getActiveContacts(contacts) {
  return (contacts || []).filter(c => c.is_active && c.value);
}