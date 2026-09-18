import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProchainService } from '../lib/public';
import { getServiceStatut, getServiceStartTime, formatInTimezone } from '../lib/dateUtils';
import './LiveBanner.css';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function LiveBanner() {
  const [service, setService] = useState(null);
  const [statut, setStatut] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const load = async () => {
      const data = await getProchainService();
      setService(data);
      if (data) {
        setStatut(getServiceStatut(data));
        const dismissedId = sessionStorage.getItem('liveBannerDismissed');
        if (dismissedId === data.id) {
          setDismissed(true);
        }
      }
    };
    load();
  }, []);

  // Rafraichir le statut toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (service) {
        setStatut(getServiceStatut(service));
      }
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [service]);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (service?.id) {
      sessionStorage.setItem('liveBannerDismissed', service.id);
    }
    setDismissed(true);
  };

  // Ne pas afficher si pas de service ou si ferme
  if (!service || dismissed) return null;

  // Verifier si dans les 7 jours
  const startTime = getServiceStartTime(service);
  const now = new Date();
  const diff = startTime.getTime() - now.getTime();

  // Ne pas afficher si termine ou trop loin
  if (statut === 'termine') return null;
  if (statut === 'a_venir' && diff > SEVEN_DAYS_MS) return null;

  const isLive = statut === 'en_cours';
  const hasLive = service.lien_live && service.lien_live.trim();

  // Formater la date
  const dateFormatted = formatInTimezone(startTime, 'Europe/Paris', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`live-banner ${isLive ? 'live-banner--live' : ''}`}>
      <Link to="/cultes#live" className="live-banner-content">
        {isLive ? (
          <>
            <span className="live-banner-dot" />
            <span className="live-banner-label">EN DIRECT</span>
            <span className="live-banner-title">{service.titre}</span>
            {hasLive && <span className="live-banner-cta">Regarder</span>}
          </>
        ) : (
          <>
            <span className="live-banner-label">PROCHAIN CULTE</span>
            <span className="live-banner-title">{dateFormatted}</span>
            <span className="live-banner-cta">Voir</span>
          </>
        )}
      </Link>
      <button
        className="live-banner-close"
        onClick={handleDismiss}
        aria-label="Fermer le bandeau"
      >
        &times;
      </button>
    </div>
  );
}
