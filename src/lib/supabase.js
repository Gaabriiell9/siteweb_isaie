/**
 * Point d'entree principal pour la compatibilite
 * Re-exporte toutes les fonctions depuis les modules specifiques
 */

// ─── Client et utilitaires ────────────────────────────────────────────────
export {
  supabase,
  IS_MOCK,
  TIMEZONE,
  getNowParis,
  getTodayParis,
  parseDateParis,
  formatDateParis,
  formatTimeParis,
  getSessionStatut,
  isSessionActive,
  isSessionAVenir,
  isSessionTermine,
} from './client';

// ─── Money utils ──────────────────────────────────────────────────────────
export { formatEuros, formatEurosShort, eurosVersCents, centsVersEuros } from './money';

// ─── Auth ─────────────────────────────────────────────────────────────────
export {
  signInEleve,
  signOutEleve,
  getEleveSession,
  signIn,
  signOut,
  getSession,
  checkIsAdmin,
  finalizeInscription,
} from './auth';

// ─── Public (lectures sans auth) ──────────────────────────────────────────
export {
  getVideos,
  getServices,
  getAnciensServices,
  getProchainService,
  getCellGroups,
  getMessageDuJour,
  getAllMessagesPriere,
  getAnnouncements,
  getAnnouncementsPinned,
  getSiteSettings,
  getSiteSetting,
  getFormulesPaiement,
  getFormuleById,
  getModulesCount,
  getModulesPublic,
} from './public';

// ─── Eleve ────────────────────────────────────────────────────────────────
export {
  getEleveProfil,
  getEleveStatut,
  updateEleveProfil,
  getModulesAvecProgression,
  getEvaluations,
  getPaiements,
  getMessagesEleve,
  getConversationResume,
  envoyerMessageEleve,
  marquerMessagesLusEleve,
  getMessagesNonLus,
  getRessourcesEleve,
  getSignedUrlRessource,
  getMesSessionsLive,
  marquerSessionRejointe,
} from './eleve';

// ─── Admin ────────────────────────────────────────────────────────────────
export {
  addVideo,
  deleteVideo,
  upsertMessagePriere,
  deleteMessagePriere,
  getAllServices,
  addService,
  updateService,
  deleteService,
  getAllCellGroups,
  addCellGroup,
  updateCellGroup,
  deleteCellGroup,
  getAllAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  updateSiteSetting,
  updateSiteSettings,
  getAllElevesAvecStats,
  suspendreEleve,
  reactiverEleve,
  updateNotesAdmin,
  ajouterEvaluation,
  getEvaluationsAdmin,
  getPaiementsAdmin,
  ajouterPaiement,
  getProgressionAdmin,
  updateProgressionModule,
  getModulesFormation,
  createModuleFormation,
  updateModuleFormation,
  swapModuleOrdre,
  deleteModuleFormation,
  getAllRessourcesParModule,
  createRessource,
  updateRessource,
  deleteRessource,
  uploadRessourceFile,
  getFormulesPaiementAdmin,
  createFormulePaiement,
  updateFormulePaiement,
  deleteFormulePaiement,
  getSessionsLive,
  createSessionLive,
  updateSessionLive,
  deleteSessionLive,
  inviteParticipantsToSession,
  getParticipantsSession,
  getAllElevesAvecDernierMessage,
  getMessagesConversation,
  envoyerMessageAdmin,
  marquerMessagesLusAdmin,
  broadcastMessage,
  getDonations,
  getStatistiquesFormation,
  getElevesParPays,
  exportElevesCSV,
} from './admin';

// ─── Aliases pour compatibilite avec code existant ────────────────────────

// getCultes -> getServices (avec adaptation du parametre)
export async function getCultes(type = 'culte') {
  const { getServices } = await import('./public');
  return getServices(type);
}

// getAnciensCultes -> getAnciensServices
export async function getAnciensCultes() {
  const { getAnciensServices } = await import('./public');
  return getAnciensServices();
}

// addCulte -> addService
export async function addCulte(culte) {
  const { addService } = await import('./admin');
  return addService({
    type: culte.type || 'culte',
    titre: culte.titre,
    date_service: culte.date_service || culte.date_culte,
    heure_debut: culte.heure_debut,
    heure_fin: culte.heure_fin,
    description: culte.description,
    lien_live: culte.lien_live,
  });
}

// deleteCulte -> deleteService
export async function deleteCulte(id) {
  const { deleteService } = await import('./admin');
  return deleteService(id);
}

// getAllMessages -> getAllMessagesPriere
export async function getAllMessages() {
  const { getAllMessagesPriere } = await import('./public');
  return getAllMessagesPriere();
}

// upsertMessage -> upsertMessagePriere
export async function upsertMessage(msg) {
  const { upsertMessagePriere } = await import('./admin');
  return upsertMessagePriere(msg);
}

// deleteMessage -> deleteMessagePriere
export async function deleteMessage(id) {
  const { deleteMessagePriere } = await import('./admin');
  return deleteMessagePriere(id);
}

// getMessagesDuJour -> getMessageDuJour
export async function getMessagesDuJour() {
  const { getMessageDuJour } = await import('./public');
  return getMessageDuJour();
}

// Ancien getConversations (eleve)
export async function getConversations(eleveId) {
  const { getConversationResume } = await import('./eleve');
  const resume = await getConversationResume(eleveId);
  return [resume];
}

// Ancien getMessagesWithEleve
export async function getMessagesWithEleve(eleveId) {
  const { getMessagesEleve } = await import('./eleve');
  return getMessagesEleve(eleveId);
}

// Ancien marquerMessagesLus (eleve)
export async function marquerMessagesLus(eleveId) {
  const { marquerMessagesLusEleve } = await import('./eleve');
  return marquerMessagesLusEleve(eleveId);
}

// Ancien getConversationsAdmin
export async function getConversationsAdmin() {
  const { getAllElevesAvecDernierMessage } = await import('./admin');
  return getAllElevesAvecDernierMessage();
}

// getRessourcesModule (depuis public ou eleve selon contexte)
export async function getRessourcesModule(moduleId) {
  const { supabase, IS_MOCK } = await import('./client');
  if (IS_MOCK) return [];
  const { data, error } = await supabase
    .from('ressources_module').select('*').eq('module_id', moduleId)
    .order('ordre');
  if (error) console.error('[getRessourcesModule]', error);
  return data || [];
}

// Alias envoyerMessage (admin) pour compatibilite
export async function envoyerMessage(destinataireId, contenu, sujet = null) {
  const { envoyerMessageAdmin } = await import('./admin');
  return envoyerMessageAdmin(destinataireId, contenu);
}

// Alias pour getFormulesPaiement avec parametre includeInactive
export async function getFormulesPaiementCompat(includeInactive = false) {
  if (includeInactive) {
    const { getFormulesPaiementAdmin } = await import('./admin');
    return getFormulesPaiementAdmin(true);
  }
  const { getFormulesPaiement } = await import('./public');
  return getFormulesPaiement();
}

// Ancien getFormulePaiementById
export async function getFormulePaiementById(id) {
  const { getFormuleById } = await import('./public');
  return getFormuleById(id);
}

// Ancien getFormulePaiementByType (plus utilise mais garde pour compat)
export async function getFormulePaiementByType(type) {
  const { getFormulesPaiement } = await import('./public');
  const formules = await getFormulesPaiement();
  return formules.find(f => f.type === type) || null;
}

// Note: createInscriptionAutoSave est supprime (table inscriptions_formation n'existe plus)
// L'inscription passe directement par finalizeInscription
