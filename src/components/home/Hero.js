import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

export default function Hero({ serviceEnCours, prochainService }) {
  const hasLive = serviceEnCours?.lien_live?.trim();

  return (
    <section className="hero-pasteur">
      <img src="/pr_img.png" alt="Pasteur et Premiere Dame" className="hero-pasteur-img" />
      <div className="hero-pasteur-overlay">
        <div className="hero-pasteur-content">
          <p className="hero-pasteur-label">PASTEURS PRINCIPAUX</p>
          <h2 className="hero-pasteur-nom">Pasteur &amp; Premiere Dame</h2>
          <p className="hero-pasteur-devise">
            "Instruments de Dieu pour transformer des vies"
          </p>
          <div className="hero-pasteur-btns">
            {hasLive ? (
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
            ) : (
              <Link to="/pasteur" className="hero-pasteur-btn">
                En savoir plus
              </Link>
            )}
            <Link to="/formation" className="hero-pasteur-btn hero-pasteur-btn--outline">
              Decouvrir la formation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
