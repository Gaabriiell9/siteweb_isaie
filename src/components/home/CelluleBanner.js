import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';
import './CelluleBanner.css';

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const STORAGE_KEY = 'celluleBannerDismissed';

function getJoinLabel(url) {
  if (!url) return 'Rejoindre';
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('zoom')) return 'Rejoindre sur Zoom';
    if (hostname.includes('whatsapp') || hostname.includes('wa.me')) return 'Rejoindre sur WhatsApp';
    if (hostname.includes('meet.google')) return 'Rejoindre sur Google Meet';
    if (hostname.includes('teams')) return 'Rejoindre sur Teams';
    return 'Rejoindre';
  } catch {
    return 'Rejoindre';
  }
}

export default function CelluleBanner({ cellules }) {
  const [dismissed, setDismissed] = useState(false);
  const [celluleDuJour, setCelluleDuJour] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setDismissed(true);
      return;
    }

    const jourActuel = JOURS_FR[new Date().getDay()];
    const match = (cellules || []).find(
      c => c.visible !== false && c.jour_semaine === jourActuel && c.lien_reunion
    );
    setCelluleDuJour(match || null);
  }, [cellules]);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  if (dismissed || !celluleDuJour) return null;

  return (
    <div className="cellule-banner">
      <div className="cellule-banner-content">
        <Icon name="users" size={18} className="cellule-banner-icon" />
        <div className="cellule-banner-text">
          <span className="cellule-banner-label">Cellule Bethel aujourd'hui</span>
          <strong>{celluleDuJour.nom}</strong>
          <span className="cellule-banner-time">
            {celluleDuJour.heure_debut?.slice(0, 5)} - {celluleDuJour.heure_fin?.slice(0, 5)}
          </span>
        </div>
        <div className="cellule-banner-actions">
          <a
            href={celluleDuJour.lien_reunion}
            target="_blank"
            rel="noopener noreferrer"
            className="cellule-banner-join"
          >
            <Icon name="video" size={14} />
            {getJoinLabel(celluleDuJour.lien_reunion)}
          </a>
          <Link to="/cellule" className="cellule-banner-link">
            Voir tous les groupes
          </Link>
        </div>
      </div>
      <button
        type="button"
        className="cellule-banner-close"
        onClick={handleDismiss}
        aria-label="Fermer"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
