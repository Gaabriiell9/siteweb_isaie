import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

export default function Hero({ serviceEnCours, prochainService }) {
  const hasLive = serviceEnCours?.lien_live?.trim();
  const hasFbLive = serviceEnCours?.facebook_live_url?.trim();
  const hasAnyLive = hasLive || hasFbLive;

  return (
    <section className="hero-pasteur">
      <img src="/pr_img.png" alt="Dr. Asa Esaie et Prophétesse Déborah Alice" className="hero-pasteur-img" />
      <div className="hero-pasteur-overlay">
        <div className="hero-pasteur-content">
          <p className="hero-pasteur-label">Temple de la Célébration, Temple Béthel</p>
          <h2 className="hero-pasteur-nom">Dr. Asa Esaie<br />Prophétesse Déborah Alice</h2>
          <p className="hero-pasteur-devise">
            "Instruments de Dieu pour transformer des vies"
          </p>
          <div className="hero-pasteur-btns">
            {hasAnyLive ? (
              <>
                {hasLive && (
                  <a
                    href={serviceEnCours.lien_live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-pasteur-btn hero-pasteur-btn--live"
                    aria-live="polite"
                  >
                    <span className="hero-btn-dot" aria-hidden="true" />
                    Regarder le live
                  </a>
                )}
                {hasFbLive && (
                  <a
                    href={serviceEnCours.facebook_live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hero-pasteur-btn ${hasLive ? 'hero-pasteur-btn--fb' : 'hero-pasteur-btn--live hero-pasteur-btn--fb-primary'}`}
                  >
                    {!hasLive && <span className="hero-btn-dot" aria-hidden="true" />}
                    {hasLive ? 'Sur Facebook' : 'Regarder sur Facebook'}
                  </a>
                )}
              </>
            ) : (
              <Link to="/pasteur" className="hero-pasteur-btn">
                En savoir plus
              </Link>
            )}
            <Link to="/formation" className="hero-pasteur-btn hero-pasteur-btn--outline">
              Découvrir la formation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
