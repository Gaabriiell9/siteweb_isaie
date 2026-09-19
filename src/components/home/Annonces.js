import React from 'react';
import './Annonces.css';

function formatDate(dateStr) {
  if (!dateStr) return { jour: '', mois: '' };
  const d = new Date(dateStr);
  const jour = d.getDate();
  const mois = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'][d.getMonth()];
  return { jour, mois };
}

function AnnonceCard({ annonce, size = 'normal' }) {
  const { jour, mois } = formatDate(annonce.date_publi);
  const hasImage = annonce.image_url?.trim();

  return (
    <article className={`annonce-card annonce-card--${size}`}>
      {hasImage ? (
        <div className="annonce-card-img">
          <img src={annonce.image_url} alt="" loading="lazy" />
        </div>
      ) : (
        <div className="annonce-card-date-big">
          <span className="annonce-card-jour">{jour}</span>
          <span className="annonce-card-mois">{mois}</span>
        </div>
      )}
      <div className="annonce-card-body">
        {annonce.pinned && <span className="annonce-badge">À la une</span>}
        <h3 className="annonce-card-titre">{annonce.titre}</h3>
        {annonce.contenu && (
          <p className="annonce-card-contenu">{annonce.contenu}</p>
        )}
        <span className="annonce-card-date-small">
          {jour} {mois}
        </span>
      </div>
    </article>
  );
}

export default function Annonces({ annonces = [], loading = false }) {
  if (loading) {
    return (
      <section className="annonces-section">
        <div className="annonces-container">
          <div className="annonces-skeleton">
            <div className="skeleton-card skeleton-card--main" />
            <div className="skeleton-list">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!annonces || annonces.length === 0) {
    return null;
  }

  const [main, ...rest] = annonces;
  const hasRest = rest.length > 0;

  return (
    <section className="annonces-section">
      <div className="annonces-container">
        <p className="section-label">Actualités</p>
        <h2 className="section-title">À la <em>une</em></h2>

        {annonces.length === 1 ? (
          <div className="annonces-single">
            <AnnonceCard annonce={main} size="main" />
          </div>
        ) : (
          <div className="annonces-grid">
            <div className="annonces-main">
              <AnnonceCard annonce={main} size="main" />
            </div>
            {hasRest && (
              <div className="annonces-list">
                {rest.map(a => (
                  <AnnonceCard key={a.id} annonce={a} size="small" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
