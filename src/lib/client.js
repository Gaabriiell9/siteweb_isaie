import { createClient } from '@supabase/supabase-js';

// ─── Configuration ────────────────────────────────────────────────────────
export const TIMEZONE = 'Europe/Paris';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const IS_MOCK =
  !SUPABASE_URL ||
  SUPABASE_URL.includes('placeholder') ||
  !SUPABASE_ANON_KEY ||
  SUPABASE_ANON_KEY.includes('placeholder');

// ─── Client Supabase ──────────────────────────────────────────────────────
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);

// ─── Utilitaires timezone Paris ───────────────────────────────────────────

export function getNowParis() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

export function getTodayParis() {
  const now = getNowParis();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function parseDateParis(dateStr, timeStr = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  const dateInParis = new Date(Date.UTC(y, m - 1, d, h, min, 0));
  const offset = getParisOffset(dateInParis);
  return new Date(dateInParis.getTime() - offset * 60 * 1000);
}

function getParisOffset(date) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const parisDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
  return (utcDate - parisDate) / 60000;
}

export function formatDateParis(date, options = {}) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TIMEZONE, ...options }).format(date);
}

export function formatTimeParis(date) {
  return formatDateParis(date, { hour: '2-digit', minute: '2-digit' });
}

// ─── Utilitaires statut session live ──────────────────────────────────────

export function getSessionStatut(session) {
  const now = new Date();
  const debut = new Date(session.date_session);
  const fin = new Date(debut.getTime() + (session.duree_minutes || 60) * 60 * 1000);
  if (now < debut) return 'programme';
  if (now >= debut && now <= fin) return 'en_cours';
  return 'termine';
}

export const isSessionActive = s => getSessionStatut(s) === 'en_cours';
export const isSessionAVenir = s => getSessionStatut(s) === 'programme';
export const isSessionTermine = s => getSessionStatut(s) === 'termine';
