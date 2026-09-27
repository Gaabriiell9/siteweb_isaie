import React, { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getMessageDuJour, getJourSemaine, getSemaineDuMois } from '../lib/public';
import './MontagnePriere.css';

export default function MontagnePriere() {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMessageDuJour().then(m => {
      setMessage(m);
      setLoading(false);
    });
  }, []);

  const jour = getJourSemaine();
  const semaine = getSemaineDuMois();

  return (
    <div>
      <SectionHeader
        dark
        label="Priere"
        title="Montagne de"
        titleEm="Priere"
        subtitle="Les 12 familles des fils de Jacob"
      />
      <div className="mp-wrap">
        <div className="container">
          {loading && (
            <div className="mp-loading">Chargement...</div>
          )}

          {!loading && message && (
            <article className="mp-message">
              <div className="mp-message-meta">
                <span className="mp-message-jour">{jour}</span>
                <span className="mp-message-sep"></span>
                <span className="mp-message-semaine">Semaine {semaine}</span>
              </div>

              <div className="mp-message-famille">{message.famille}</div>

              {message.verset && (
                <blockquote className="mp-message-verset">
                  {message.verset}
                </blockquote>
              )}

              {message.titre && (
                <h2 className="mp-message-titre">{message.titre}</h2>
              )}

              <div className="mp-message-contenu">
                {message.contenu}
              </div>
            </article>
          )}

          {!loading && !message && (
            <div className="mp-empty">
              <div className="mp-empty-icon">&#10022;</div>
              <p className="mp-empty-text">Aucun message pour aujourd'hui</p>
              <p className="mp-empty-sub">
                {jour}, semaine {semaine} du mois
              </p>
            </div>
          )}

          <div className="encart-or mp-footer">
            <span>&#10022;</span>
            Les messages de priere sont prepares par le service de predication de l'Eglise Temple de la Celebration.
          </div>
        </div>
      </div>
    </div>
  );
}
