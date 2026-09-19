import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buildWeek } from '../../lib/week';
import Icon from '../Icon';
import './Semaine.css';

export default function Semaine({ services = [], cellules = [], fuseau = 'Europe/Paris', loading = false }) {
  const scrollRef = useRef(null);

  const week = buildWeek({ services, cellules, fuseau });

  useEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector('.jour-card--today');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [week]);

  if (loading) {
    return (
      <section className="semaine-section">
        <div className="semaine-container">
          <div className="semaine-skeleton">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="skeleton-jour" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="semaine-section">
      <div className="semaine-container">
        <div className="semaine-header">
          <div>
            <p className="section-label">Programme</p>
            <h2 className="section-title">Cette <em>semaine</em></h2>
          </div>
          <Link to="/montagne-priere" className="semaine-priere-link">
            <Icon name="mountain" size={16} />
            <span>Chaque jour : Montagne de prière</span>
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>

        <div className="semaine-scroll" ref={scrollRef}>
          {week.map((jour, idx) => (
            <article
              key={jour.date}
              className={`jour-card ${jour.estAujourdhui ? 'jour-card--today' : ''}`}
            >
              <div className="jour-card-header">
                <span className="jour-card-nom">{jour.nom}</span>
                <span className="jour-card-date">{jour.dateFormatee}</span>
              </div>

              <div className="jour-card-events">
                {jour.cultes.length === 0 && jour.cellules.length === 0 && (
                  <p className="jour-card-empty">Pas d'événement</p>
                )}

                {jour.cultes.map(c => (
                  <div key={c.id} className="jour-event jour-event--culte">
                    <Icon name="cross" size={14} />
                    <div>
                      <span className="jour-event-heure">{c.heure}</span>
                      <span className="jour-event-titre">{c.titre}</span>
                    </div>
                  </div>
                ))}

                {jour.cellules.map(c => (
                  <div key={c.id} className="jour-event jour-event--cellule">
                    <Icon name="users" size={14} />
                    <div>
                      <span className="jour-event-heure">{c.heure}</span>
                      <span className="jour-event-titre">{c.nom}</span>
                      {c.lieu && <span className="jour-event-lieu">{c.lieu}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
