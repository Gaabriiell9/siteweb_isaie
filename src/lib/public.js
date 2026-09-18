import { supabase, IS_MOCK, getTodayParis } from './client';

// ─── Mock data ────────────────────────────────────────────────────────────

const MOCK_VIDEOS = [
  { id: '1', titre: 'Culte du 15 septembre', legende: 'Culte du Dimanche', youtube_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', date_publi: '2026-09-15', is_live: false },
  { id: '2', titre: 'Culte du 8 septembre', legende: 'Culte du Dimanche', youtube_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', date_publi: '2026-09-08', is_live: false },
];

const MOCK_SERVICES = [
  { id: '1', type: 'culte', titre: 'Culte du Dimanche', date_service: '2026-09-22', heure_debut: '10:00', heure_fin: '11:30', lien_live: null, replay_url: null },
  { id: '2', type: 'culte', titre: 'Culte du Dimanche', date_service: '2026-09-29', heure_debut: '10:00', heure_fin: '11:30', lien_live: null, replay_url: null },
];

const MOCK_CELL_GROUPS = [
  { id: '1', nom: 'Cellule Bethel', lieu: 'En ligne', jour_semaine: 'Mercredi', heure_debut: '19:00', heure_fin: '20:30', responsable_nom: 'Equipe pastorale' },
];

const MOCK_MESSAGES_PRIERE = [
  { id: '1', famille: 'Ruben', jour_semaine: 'Lundi', semaine: 1, titre: 'La benediction du premier-ne', contenu: 'Prions pour...', verset: 'Genese 49:3' },
];

const MOCK_ANNOUNCEMENTS = [
  { id: '1', titre: 'Bienvenue', contenu: 'Bienvenue sur le site de l\'Eglise Temple de la Celebration', pinned: true, date_publi: '2026-09-01' },
];

const MOCK_SITE_SETTINGS = {
  nom_eglise: 'Eglise Temple de la Celebration',
  facebook_url: '',
  youtube_url: '',
};

const MOCK_FORMULES = [
  { id: 'f1', nom: 'Integral', type: 'integral', prix_total_cents: 45000, nombre_echeances: 1, montant_echeance_cents: 45000, avantages: ['Acces immediat a tous les modules', 'Economisez 10%'], actif: true, ordre_affichage: 1 },
  { id: 'f2', nom: 'Echelonne', type: 'echelonne', prix_total_cents: 50000, nombre_echeances: 10, montant_echeance_cents: 5000, avantages: ['Paiement en plusieurs fois', 'Deblocage progressif'], actif: true, ordre_affichage: 2 },
];

// ─── Videos ───────────────────────────────────────────────────────────────

export async function getVideos() {
  if (IS_MOCK) return MOCK_VIDEOS;
  const { data, error } = await supabase
    .from('videos')
    .select('id, titre, legende, description, youtube_url, date_publi, is_live')
    .eq('visible', true)
    .order('date_publi', { ascending: false });
  if (error) console.error('[getVideos]', error);
  return data || [];
}

// ─── Services (ex-cultes) ─────────────────────────────────────────────────

export async function getServices(type = 'culte') {
  if (IS_MOCK) return MOCK_SERVICES.filter(s => s.type === type);
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
  if (IS_MOCK) return [];
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
  if (IS_MOCK) return MOCK_SERVICES[0] || null;
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

// ─── Cell groups (ex-cellules) ────────────────────────────────────────────

export async function getCellGroups() {
  if (IS_MOCK) return MOCK_CELL_GROUPS;
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
  if (IS_MOCK) {
    const jour = JOURS[new Date().getDay()];
    return MOCK_MESSAGES_PRIERE.find(m => m.jour_semaine === jour) || null;
  }
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
  if (IS_MOCK) return MOCK_MESSAGES_PRIERE;
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
  if (IS_MOCK) return MOCK_ANNOUNCEMENTS;
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

export async function getAnnouncementsPinned() {
  if (IS_MOCK) return MOCK_ANNOUNCEMENTS.filter(a => a.pinned);
  const todayParis = getTodayParis();
  const { data, error } = await supabase
    .from('announcements')
    .select('id, titre, contenu, image_url, date_publi')
    .eq('visible', true)
    .eq('pinned', true)
    .or(`date_fin.is.null,date_fin.gte.${todayParis}`)
    .order('date_publi', { ascending: false })
    .limit(3);
  if (error) console.error('[getAnnouncementsPinned]', error);
  return data || [];
}

// ─── Site settings ────────────────────────────────────────────────────────

export async function getSiteSettings() {
  if (IS_MOCK) return MOCK_SITE_SETTINGS;
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
  if (IS_MOCK) return MOCK_SITE_SETTINGS[cle] || '';
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
  if (IS_MOCK) return MOCK_FORMULES;
  const { data, error } = await supabase
    .from('formules_paiement')
    .select('id, nom, type, prix_total_cents, nombre_echeances, montant_echeance_cents, description, avantages, ordre_affichage')
    .eq('actif', true)
    .order('ordre_affichage');
  if (error) console.error('[getFormulesPaiement]', error);
  return data || [];
}

export async function getFormuleById(id) {
  if (IS_MOCK) return MOCK_FORMULES.find(f => f.id === id) || null;
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
  if (IS_MOCK) return 6;
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
  if (IS_MOCK) {
    return [
      { id: 'mock-1', numero: 1, titre: 'Introduction a la Bible', description: 'Canon, inspiration, interpretation biblique', duree_semaines: 8 },
      { id: 'mock-2', numero: 2, titre: 'Ancien Testament', description: 'Pentateuque, prophetes, ecrits', duree_semaines: 8 },
      { id: 'mock-3', numero: 3, titre: 'Nouveau Testament', description: 'Evangiles, epitres, Apocalypse', duree_semaines: 8 },
      { id: 'mock-4', numero: 4, titre: 'Theologie systematique', description: 'Doctrines fondamentales de la foi', duree_semaines: 8 },
      { id: 'mock-5', numero: 5, titre: 'Histoire de l\'Eglise', description: 'Des apotres a nos jours', duree_semaines: 8 },
      { id: 'mock-6', numero: 6, titre: 'Vie chretienne et ministere', description: 'Spiritualite, ethique, service', duree_semaines: 8 },
    ];
  }
  const { data, error } = await supabase
    .from('modules_formation')
    .select('id, numero, titre, description, duree_semaines')
    .order('numero');
  if (error) console.error('[getModulesPublic]', error);
  return data || [];
}
