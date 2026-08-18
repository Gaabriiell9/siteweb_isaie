import { parseDateParis } from './supabase';

/**
 * Calcule l'état d'un culte/cellule par rapport à l'heure actuelle (Europe/Paris)
 * @param {Object} event - Objet avec date_culte, heure_debut, heure_fin
 * @param {Object} options - Options de marge (margeAvant en min, margeApres en min)
 * @returns {'a_venir' | 'en_cours' | 'termine'}
 */
export function getEventEtat(event, options = {}) {
  const { margeAvant = 15, margeApres = 30 } = options;

  const now = new Date();
  const heureDeb = event.heure_debut || '10:00';
  const heureFin = event.heure_fin || '11:30';

  const debut = parseDateParis(event.date_culte, heureDeb);
  const fin = parseDateParis(event.date_culte, heureFin);

  const debutAvecMarge = new Date(debut.getTime() - margeAvant * 60 * 1000);
  const finAvecMarge = new Date(fin.getTime() + margeApres * 60 * 1000);

  if (now < debutAvecMarge) return 'a_venir';
  if (now > finAvecMarge) return 'termine';
  return 'en_cours';
}
