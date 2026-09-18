import { supabase, getTodayParis } from './client';

// ─── Videos ───────────────────────────────────────────────────────────────

export async function getVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('id, titre, legende, description, youtube_url, date_publi, is_live')
    .eq('visible', true)
    .order('date_publi', { ascending: false });
  if (error) console.error('[getVideos]', error);
  return data || [];
}

// ─── Services ─────────────────────────────────────────────────────────────

export async function getServices(type = 'culte') {
  const todayParis = getTodayParis();
  const { data, error } = await supabase
    .from('services')
    .select('id, type, titre, description, date_service, heure_debut, heure_fin, lieu, predicateur, theme, lien_live, replay_url')
    .eq('visible', true)
    .eq('type', type)
    .gte('date_service', todayParis)
    .order('date_service');
  if (error) console.error('[getServices]', error);
  return data || [];
}

export async function getAnciensServices() {
  const todayParis = getTodayParis();
  const { data, error } = await supabase
    .from('services')
    .select('id, titre, date_service, heure_debut, heure_fin, replay_url, lien_live')
    .eq('visible', true)
    .eq('type', 'culte')
    .lt('date_service', todayParis)
    .or('replay_url.neq.,lien_live.neq.')
    .order('date_service', { ascending: false });
  if (error) console.error('[getAnciensServices]', error);
  return data || [];
}

export async function getProchainService() {
  const todayParis = getTodayParis();
  const { data, error } = await supabase
    .from('services')
    .select('id, type, titre, date_service, heure_debut, heure_fin, lien_live')
    .eq('visible', true)
    .eq('type', 'culte')
    .gte('date_service', todayParis)
    .order('date_service')
    .limit(1)
    .maybeSingle();
  if (error) console.error('[getProchainService]', error);
  return data;
}

// ─── Cell groups ──────────────────────────────────────────────────────────

export async function getCellGroups() {
  const { data, error } = await supabase
    .from('cell_groups')
    .select('id, nom, lieu, adresse, jour_semaine, heure_debut, heure_fin, responsable_nom, responsable_contact, description, capacite')
    .eq('visible', true)
    .order('jour_semaine');
  if (error) console.error('[getCellGroups]', error);
  return data || [];
}

// ─── Messages priere ──────────────────────────────────────────────────────

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export async function getMessageDuJour() {
  const jour = JOURS[new Date().getDay()];
  const { data, error } = await supabase
    .from('messages_priere')
    .select('id, famille, jour_semaine, semaine, titre, contenu, verset')
    .eq('visible', true)
    .eq('jour_semaine', jour)
    .limit(1)
    .maybeSingle();
  if (error) console.error('[getMessageDuJour]', error);
  return data;
}

export async function getAllMessagesPriere() {
  const { data, error } = await supabase
    .from('messages_priere')
    .select('id, famille, fils, jour_semaine, semaine, titre, contenu, verset')
    .eq('visible', true)
    .order('semaine')
    .order('jour_semaine');
  if (error) console.error('[getAllMessagesPriere]', error);
  return data || [];
}

// ─── Announcements ────────────────────────────────────────────────────────

export async function getAnnouncements() {
  const todayParis = getTodayParis();
  const { data, error } = await supabase
    .from('announcements')
    .select('id, titre, contenu, image_url, pinned, date_publi')
    .eq('visible', true)
    .or(`date_fin.is.null,date_fin.gte.${todayParis}`)
    .order('pinned', { ascending: false })
    .order('date_publi', { ascending: false });
  if (error) console.error('[getAnnouncements]', error);
  return data || [];
}

export async function getAnnouncementsPinned(limit = 3) {
  const todayParis = getTodayParis();
  const { data, error } = await supabase
    .from('announcements')
    .select('id, titre, contenu, image_url, date_publi')
    .eq('visible', true)
    .eq('pinned', true)
    .or(`date_fin.is.null,date_fin.gte.${todayParis}`)
    .order('date_publi', { ascending: false })
    .limit(limit);
  if (error) console.error('[getAnnouncementsPinned]', error);
  return data || [];
}

// ─── Site settings ────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('cle, valeur');
  if (error) console.error('[getSiteSettings]', error);
  const settings = {};
  (data || []).forEach(row => {
    settings[row.cle] = row.valeur || '';
  });
  return settings;
}

export async function getSiteSetting(cle) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('valeur')
    .eq('cle', cle)
    .maybeSingle();
  if (error) console.error('[getSiteSetting]', error);
  return data?.valeur || '';
}

// ─── Formules de paiement ─────────────────────────────────────────────────

export async function getFormulesPaiement() {
  const { data, error } = await supabase
    .from('formules_paiement')
    .select('id, nom, type, prix_total_cents, nombre_echeances, montant_echeance_cents, description, avantages, ordre_affichage')
    .eq('actif', true)
    .order('ordre_affichage');
  if (error) console.error('[getFormulesPaiement]', error);
  return data || [];
}

export async function getFormuleById(id) {
  const { data, error } = await supabase
    .from('formules_paiement')
    .select('id, nom, type, prix_total_cents, nombre_echeances, montant_echeance_cents, description, avantages')
    .eq('id', id)
    .maybeSingle();
  if (error) console.error('[getFormuleById]', error);
  return data;
}

// ─── Modules (count pour affichage public) ────────────────────────────────

export async function getModulesCount() {
  const { count, error } = await supabase
    .from('modules_formation')
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error('[getModulesCount]', error);
    return 6;
  }
  return count || 6;
}

export async function getModulesPublic() {
  const { data, error } = await supabase
    .from('modules_formation')
    .select('id, numero, titre, description, duree_semaines')
    .order('numero');
  if (error) console.error('[getModulesPublic]', error);
  return data || [];
}
