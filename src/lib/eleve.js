import { supabase, IS_MOCK, getSessionStatut } from './client';

// ─── Mock data ────────────────────────────────────────────────────────────

const MOCK_ELEVE = {
  id: 'eleve-1',
  prenom: 'Jean',
  nom: 'Dupont',
  email: 'jean@example.com',
  telephone: '+33 6 12 34 56 78',
  pays: 'France',
  ville: 'Paris',
  eglise: 'ETC',
  pasteur_referent: 'Pasteur Martin',
  niveau_biblique: 'intermediaire',
  motivation: 'Approfondir ma connaissance de la Bible',
  communications_ok: true,
  formule: 'echelonne',
  formule_nom: 'Echelonne',
  formule_prix_total_cents: 50000,
  formule_nombre_echeances: 10,
  formule_montant_echeance_cents: 5000,
  statut: 'actif',
  progression_pct: 33,
  date_inscription: '2026-01-15T10:00:00Z',
};

const MOCK_MODULES_PROGRESSION = [
  { id: 'p1', module_id: 'm1', numero: 1, titre: 'Introduction a la Bible', description: 'Canon, inspiration', debloque: true, complete: true, date_debloque: '2026-01-15', date_complete: '2026-02-15' },
  { id: 'p2', module_id: 'm2', numero: 2, titre: 'Ancien Testament', description: 'Pentateuque, prophetes', debloque: true, complete: false, date_debloque: '2026-02-15', date_complete: null },
  { id: 'p3', module_id: 'm3', numero: 3, titre: 'Nouveau Testament', description: 'Evangiles, epitres', debloque: false, complete: false, date_debloque: null, date_complete: null },
];

const MOCK_EVALUATIONS = [
  { id: 'e1', titre: 'Examen Module 1', type: 'final', note: 16, note_max: 20, date_eval: '2026-02-10', module: { titre: 'Introduction a la Bible' } },
];

const MOCK_PAIEMENTS = [
  { id: 'pay1', montant_cents: 5000, devise: 'EUR', type_paiement: 'mensualite', echeance_numero: 1, statut: 'reussi', methode: 'CB', reference: 'ETC-2026-001', date_paiement: '2026-01-15' },
  { id: 'pay2', montant_cents: 5000, devise: 'EUR', type_paiement: 'mensualite', echeance_numero: 2, statut: 'reussi', methode: 'CB', reference: 'ETC-2026-002', date_paiement: '2026-02-15' },
];

const MOCK_MESSAGES = [
  { id: 'msg1', eleve_id: 'eleve-1', sender_role: 'admin', contenu: 'Bienvenue dans la Formation!', lu: true, date_lu: '2026-01-16', created_at: '2026-01-15T10:00:00Z' },
  { id: 'msg2', eleve_id: 'eleve-1', sender_role: 'eleve', contenu: 'Merci beaucoup!', lu: true, created_at: '2026-01-16T09:00:00Z' },
];

const MOCK_RESSOURCES = [
  { id: 'r1', module_id: 'm1', titre: 'Syllabus Module 1', description: 'Plan detaille', type_ressource: 'pdf', storage_path: null, url: '#', taille_ko: 245, ordre: 1 },
];

// ─── Profil eleve ─────────────────────────────────────────────────────────

export async function getEleveProfil(authUserId) {
  if (IS_MOCK) return MOCK_ELEVE;
  if (!authUserId) {
    console.error('[getEleveProfil] No authUserId provided');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('eleves')
      .select(`
        id, auth_user_id, prenom, nom, email, telephone, date_naissance,
        pays, ville, eglise, pasteur_referent, niveau_biblique, motivation, communications_ok,
        formule, formule_id, formule_nom, formule_prix_total_cents, formule_nombre_echeances, formule_montant_echeance_cents, formule_avantages,
        statut, progression_pct, date_inscription, derniere_connexion
      `)
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    if (error) {
      console.error('[getEleveProfil] Error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[getEleveProfil] Exception:', err);
    return null;
  }
}

export async function getEleveStatut(authUserId) {
  if (IS_MOCK) return 'actif';
  try {
    const { data, error } = await supabase
      .from('eleves')
      .select('statut')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    if (error) {
      console.error('[getEleveStatut] Error:', error);
      return 'actif';
    }
    return data?.statut || 'actif';
  } catch (err) {
    console.error('[getEleveStatut] Exception:', err);
    return 'actif';
  }
}

/**
 * Met a jour le profil eleve (champs autorises uniquement)
 * Champs autorises: prenom, nom, telephone, date_naissance, pays, ville, eglise, pasteur_referent, niveau_biblique, motivation, communications_ok
 */
export async function updateEleveProfil(eleveId, updates) {
  if (IS_MOCK) return { error: null };

  const allowedFields = ['prenom', 'nom', 'telephone', 'date_naissance', 'pays', 'ville', 'eglise', 'pasteur_referent', 'niveau_biblique', 'motivation', 'communications_ok'];
  const safeUpdates = {};
  for (const key of allowedFields) {
    if (key in updates) {
      safeUpdates[key] = updates[key];
    }
  }

  const { error } = await supabase
    .from('eleves')
    .update(safeUpdates)
    .eq('id', eleveId);

  if (error) {
    console.error('[updateEleveProfil] Error:', error);
  }
  return { error };
}

// ─── Modules et progression ───────────────────────────────────────────────

export async function getModulesAvecProgression(eleveId) {
  if (IS_MOCK) return MOCK_MODULES_PROGRESSION;

  const { data, error } = await supabase
    .from('progression_eleve')
    .select(`
      id, module_id, debloque, complete, date_debloque, date_complete,
      modules_formation (id, numero, titre, description, duree_semaines)
    `)
    .eq('eleve_id', eleveId)
    .order('modules_formation(numero)');

  if (error) {
    console.error('[getModulesAvecProgression]', error);
    return [];
  }

  return (data || []).map(p => ({
    ...p,
    numero: p.modules_formation?.numero,
    titre: p.modules_formation?.titre,
    description: p.modules_formation?.description,
    duree_semaines: p.modules_formation?.duree_semaines,
  }));
}

// ─── Evaluations ──────────────────────────────────────────────────────────

export async function getEvaluations(eleveId) {
  if (IS_MOCK) return MOCK_EVALUATIONS;
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, titre, type, note, note_max, commentaire, date_eval, module:modules_formation(titre)')
    .eq('eleve_id', eleveId)
    .order('date_eval', { ascending: false });
  if (error) console.error('[getEvaluations]', error);
  return data || [];
}

// ─── Paiements ────────────────────────────────────────────────────────────

export async function getPaiements(eleveId) {
  if (IS_MOCK) return MOCK_PAIEMENTS;
  const { data, error } = await supabase
    .from('paiements')
    .select('id, montant_cents, devise, type_paiement, echeance_numero, statut, methode, reference, date_paiement')
    .eq('eleve_id', eleveId)
    .order('date_paiement', { ascending: false });
  if (error) console.error('[getPaiements]', error);
  return data || [];
}

// ─── Messages (nouveau modele) ────────────────────────────────────────────

export async function getMessagesEleve(eleveId) {
  if (IS_MOCK) return MOCK_MESSAGES;
  const { data, error } = await supabase
    .from('messages')
    .select('id, eleve_id, sender_role, sujet, contenu, lu, date_lu, created_at')
    .eq('eleve_id', eleveId)
    .order('created_at', { ascending: true });
  if (error) console.error('[getMessagesEleve]', error);
  return data || [];
}

export async function getConversationResume(eleveId) {
  if (IS_MOCK) {
    const adminMsgs = MOCK_MESSAGES.filter(m => m.sender_role === 'admin' && !m.lu);
    const last = MOCK_MESSAGES[MOCK_MESSAGES.length - 1];
    return {
      partner_id: 'admin',
      partner_name: 'Administration E.T.C',
      last_message: last?.contenu?.slice(0, 60) || null,
      last_at: last?.created_at || null,
      unread_count: adminMsgs.length,
    };
  }

  const { data, error } = await supabase
    .from('messages')
    .select('sender_role, contenu, created_at, lu')
    .eq('eleve_id', eleveId)
    .order('created_at', { ascending: false });

  if (error) console.error('[getConversationResume]', error);

  const msgs = data || [];
  const unread = msgs.filter(m => m.sender_role === 'admin' && !m.lu).length;
  const last = msgs[0];

  return {
    partner_id: 'admin',
    partner_name: 'Administration E.T.C',
    last_message: last?.contenu?.slice(0, 60) || null,
    last_at: last?.created_at || null,
    unread_count: unread,
  };
}

export async function envoyerMessageEleve(eleveId, contenu) {
  if (IS_MOCK) {
    return { data: { id: `mock-${Date.now()}`, contenu, sender_role: 'eleve', created_at: new Date().toISOString() }, error: null };
  }

  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  if (!userId) return { data: null, error: { message: 'Non connecte' } };

  const { data, error } = await supabase
    .from('messages')
    .insert([{
      eleve_id: eleveId,
      sender_role: 'eleve',
      sender_auth_id: userId,
      contenu,
    }])
    .select()
    .single();

  if (error) console.error('[envoyerMessageEleve]', error);
  return { data, error };
}

export async function marquerMessagesLusEleve(eleveId) {
  if (IS_MOCK) return { error: null };
  return supabase
    .from('messages')
    .update({ lu: true, date_lu: new Date().toISOString() })
    .eq('eleve_id', eleveId)
    .eq('sender_role', 'admin')
    .eq('lu', false);
}

export async function getMessagesNonLus(eleveId) {
  if (IS_MOCK) return MOCK_MESSAGES.filter(m => m.sender_role === 'admin' && !m.lu);
  const { data, error } = await supabase
    .from('messages')
    .select('id, contenu, created_at')
    .eq('eleve_id', eleveId)
    .eq('sender_role', 'admin')
    .eq('lu', false)
    .order('created_at', { ascending: false });
  if (error) console.error('[getMessagesNonLus]', error);
  return data || [];
}

// ─── Ressources (avec URL signees) ────────────────────────────────────────

export async function getRessourcesEleve(eleveId) {
  if (IS_MOCK) return MOCK_RESSOURCES;

  const { data: progression } = await supabase
    .from('progression_eleve')
    .select('module_id')
    .eq('eleve_id', eleveId)
    .eq('debloque', true);

  if (!progression?.length) return [];

  const moduleIds = progression.map(p => p.module_id);
  const { data, error } = await supabase
    .from('ressources_module')
    .select('id, module_id, titre, description, type_ressource, url, storage_path, taille_ko, ordre, module:modules_formation(numero, titre)')
    .in('module_id', moduleIds)
    .order('ordre');

  if (error) console.error('[getRessourcesEleve]', error);
  return data || [];
}

/**
 * Genere une URL signee pour une ressource stockee dans le bucket prive
 */
export async function getSignedUrlRessource(storagePath) {
  if (IS_MOCK || !storagePath) return null;

  const { data, error } = await supabase.storage
    .from('ressources')
    .createSignedUrl(storagePath, 3600);

  if (error) {
    console.error('[getSignedUrlRessource]', error);
    return null;
  }

  return data?.signedUrl || null;
}

// ─── Sessions live ────────────────────────────────────────────────────────

export async function getMesSessionsLive(eleveId) {
  if (IS_MOCK) {
    return [
      { id: 's1', titre: 'Session Module 1', date_session: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(), duree_minutes: 60, lien_zoom: 'https://zoom.us/j/123', statut_calcule: 'programme' },
    ];
  }

  const { data, error } = await supabase
    .from('sessions_participants')
    .select('session:sessions_live(*, module:modules_formation(numero, titre))')
    .eq('eleve_id', eleveId)
    .order('session(date_session)');

  if (error) console.error('[getMesSessionsLive]', error);

  return (data || [])
    .map(r => ({
      ...r.session,
      module_titre: r.session?.module ? `Module ${String(r.session.module.numero).padStart(2, '0')}` : null,
      statut_calcule: r.session ? getSessionStatut(r.session) : 'termine',
    }))
    .filter(Boolean)
    .sort((a, b) => {
      const order = { en_cours: 0, programme: 1, termine: 2 };
      const oa = order[a.statut_calcule] ?? 3;
      const ob = order[b.statut_calcule] ?? 3;
      if (oa !== ob) return oa - ob;
      return new Date(a.date_session) - new Date(b.date_session);
    });
}

export async function marquerSessionRejointe(sessionId, eleveId) {
  if (IS_MOCK) return { error: null };
  return supabase
    .from('sessions_participants')
    .update({ a_rejoint: true, date_rejoint: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('eleve_id', eleveId);
}
