import { useState, useEffect } from 'react';
import {
  getAnnouncements,
  getServices,
  getCellGroups,
  getMessageDuJour,
  getVideos,
  getSiteSettings,
} from '../lib/public';

/**
 * Hook pour charger toutes les donnees de la page d'accueil en parallele
 * Chaque section a son propre etat de chargement et d'erreur
 */
export function useHomeData() {
  const [data, setData] = useState({
    annonces: { items: [], loading: true, error: null },
    services: { items: [], loading: true, error: null },
    cellules: { items: [], loading: true, error: null },
    messageDuJour: { item: null, loading: true, error: null },
    derniereVideo: { item: null, loading: true, error: null },
    settings: { data: {}, loading: true, error: null },
  });

  useEffect(() => {
    const loadAll = async () => {
      const results = await Promise.allSettled([
        getAnnouncements(),
        getServices('culte'),
        getCellGroups(),
        getMessageDuJour(),
        getVideos(),
        getSiteSettings(),
      ]);

      const [annonces, services, cellules, message, videos, settings] = results;

      setData({
        annonces: {
          items: annonces.status === 'fulfilled'
            ? (annonces.value || []).slice(0, 4)
            : [],
          loading: false,
          error: annonces.status === 'rejected' ? annonces.reason?.message : null,
        },
        services: {
          items: services.status === 'fulfilled'
            ? (services.value || []).slice(0, 6)
            : [],
          loading: false,
          error: services.status === 'rejected' ? services.reason?.message : null,
        },
        cellules: {
          items: cellules.status === 'fulfilled' ? (cellules.value || []) : [],
          loading: false,
          error: cellules.status === 'rejected' ? cellules.reason?.message : null,
        },
        messageDuJour: {
          item: message.status === 'fulfilled' ? message.value : null,
          loading: false,
          error: message.status === 'rejected' ? message.reason?.message : null,
        },
        derniereVideo: {
          item: videos.status === 'fulfilled' && videos.value?.length > 0
            ? videos.value[0]
            : null,
          loading: false,
          error: videos.status === 'rejected' ? videos.reason?.message : null,
        },
        settings: {
          data: settings.status === 'fulfilled' ? (settings.value || {}) : {},
          loading: false,
          error: settings.status === 'rejected' ? settings.reason?.message : null,
        },
      });
    };

    loadAll();
  }, []);

  return data;
}
