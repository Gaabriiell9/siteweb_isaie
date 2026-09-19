/**
 * Configuration de la navigation admin
 * Pour ajouter une rubrique : ajouter une entree dans le groupe approprie
 */

import { LABELS } from '../../lib/constants';
import { TabServices, TabPriere, TabCellules, TabVideos, TabAnnonces, TabFormation, TabSettings } from './index';

export const ADMIN_NAV = [
  {
    id: 'eglise',
    label: 'Eglise',
    icon: 'church',
    roles: ['editor', 'admin', 'super_admin'],
    items: [
      { id: 'direct', label: 'En direct', icon: 'live', component: TabServices },
      { id: 'priere', label: LABELS.MONTAGNE_PRIERE, icon: 'mountain', component: TabPriere },
      { id: 'cellules', label: LABELS.CELLULE_BETHEL, icon: 'users', component: TabCellules },
      { id: 'videos', label: 'Videos', icon: 'play', component: TabVideos },
      { id: 'annonces', label: 'Annonces', icon: 'megaphone', component: TabAnnonces },
    ],
  },
  {
    id: 'formation',
    label: 'Formation',
    icon: 'graduation',
    roles: ['admin', 'super_admin'],
    items: [
      { id: 'formation', label: 'Formation', icon: 'graduation', component: TabFormation },
    ],
  },
  {
    id: 'parametres',
    label: 'Parametres',
    icon: 'settings',
    roles: ['editor', 'admin', 'super_admin'],
    items: [
      { id: 'reglages', label: 'Reglages du site', icon: 'settings', component: TabSettings },
    ],
  },
];

/**
 * Trouve un item par son chemin (groupId/itemId)
 */
export function findItemByPath(path, userRole) {
  if (!path) return null;
  const [groupId, itemId] = path.split('/');
  const group = ADMIN_NAV.find(g => g.id === groupId && g.roles.includes(userRole));
  if (!group) return null;
  const item = group.items.find(i => i.id === itemId);
  if (!item) return null;
  return { group, item };
}

/**
 * Obtient le premier item autorise pour un role
 */
export function getFirstAuthorizedItem(userRole) {
  for (const group of ADMIN_NAV) {
    if (group.roles.includes(userRole) && group.items.length > 0) {
      return `${group.id}/${group.items[0].id}`;
    }
  }
  return null;
}

/**
 * Filtre les groupes et items par role
 */
export function getAuthorizedNav(userRole) {
  return ADMIN_NAV
    .filter(g => g.roles.includes(userRole))
    .map(g => ({
      ...g,
      items: g.items.filter(i => !i.roles || i.roles.includes(userRole)),
    }))
    .filter(g => g.items.length > 0);
}
