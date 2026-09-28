import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { getServiceStatut, getServiceStartTime } from '../lib/dateUtils';
import {
  Hero,
  Annonces,
  Semaine,
  Activites,
  CelluleBanner,
  CarteFrance,
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
      <CelluleBanner cellules={data.cellules.items} />
      <Hero serviceEnCours={serviceEnCours} prochainService={prochainService} />

      <div className="carte-france-bandeau">
        <CarteFrance />
      </div>

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
    </main>
  );
}
