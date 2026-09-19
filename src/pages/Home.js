import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { getServiceStatut, getServiceStartTime } from '../lib/dateUtils';
import {
  Hero,
  Annonces,
  Semaine,
  Activites,
  DernierePredication,
  MessageDuJour,
  BandePasteurs,
  Rejoindre,
} from '../components/home';
import './Home.css';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export default function Home() {
  const data = useHomeData();
  const location = useLocation();

  useEffect(() => {
    // Desactive la restauration automatique du navigateur
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    // Scroll en haut sauf si hash present
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'auto' });
      }
    } else {
      window.scrollTo(0, 0);
    }
    return () => {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, [location.pathname, location.hash]);

  const fuseau = data.settings.data?.fuseau_horaire || 'Europe/Paris';
  const prochainService = data.services.items?.[0] || null;

  let serviceEnCours = null;
  if (prochainService) {
    const statut = getServiceStatut(prochainService, fuseau);
    const startTime = getServiceStartTime(prochainService, fuseau);
    const timeToStart = startTime.getTime() - Date.now();

    if (statut === 'en_cours' || (statut === 'a_venir' && timeToStart <= FIFTEEN_MIN_MS && timeToStart > 0)) {
      serviceEnCours = prochainService;
    }
  }

  return (
    <main className="home">
      <Hero serviceEnCours={serviceEnCours} prochainService={prochainService} />

      <Annonces
        annonces={data.annonces.items}
        loading={data.annonces.loading}
      />

      <Semaine
        services={data.services.items}
        cellules={data.cellules.items}
        fuseau={fuseau}
        loading={data.services.loading || data.cellules.loading}
      />

      <Activites data={data} loading={data.services.loading} />

      <DernierePredication
        video={data.derniereVideo.item}
        loading={data.derniereVideo.loading}
      />

      <MessageDuJour
        message={data.messageDuJour.item}
        loading={data.messageDuJour.loading}
      />

      <BandePasteurs />

      <Rejoindre
        settings={data.settings.data}
        serviceEnCours={serviceEnCours}
      />
    </main>
  );
}
