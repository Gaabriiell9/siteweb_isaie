import React from 'react';
import { Link } from 'react-router-dom';
import { EGLISE } from '../../config/eglise';
import './Hero.css';

export default function Hero({ serviceEnCours, prochainService }) {
  const hasLive = serviceEnCours?.lien_live?.trim();

  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-content">
        <div className="hero-text">
          <p className="hero-label">{EGLISE.hero.label}</p>
          <h1 className="hero-titre">
            {EGLISE.hero.titre} <em>{EGLISE.hero.titreEmphase}</em>
          </h1>
          <p className="hero-soustitre">{EGLISE.hero.sousTitre}</p>
          <div className="hero-btns">
            {hasLive ? (
              <a
                href={serviceEnCours.lien_live}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-btn hero-btn--live"
                aria-live="polite"
              >
                <span className="hero-btn-dot" aria-hidden="true" />
                Regarder le live
              </a>
            ) : (
              <Link to="/cultes" className="hero-btn hero-btn--primary">
                Voir le programme
              </Link>
            )}
            <Link to="/formation" className="hero-btn hero-btn--secondary">
              Découvrir la formation
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-arche">
            <picture>
              <source
                srcSet="/pr_img_800.webp 800w, /pr_img_1200.webp 1200w, /pr_img_1600.webp 1600w"
                sizes="(max-width: 768px) 280px, (max-width: 1024px) 360px, 420px"
                type="image/webp"
              />
              <img
                src="/pr_img.png"
                alt="Pasteur et Première Dame du Temple de la Célébration"
                className="hero-img"
                width="600"
                height="750"
                fetchpriority="high"
              />
            </picture>
            <div className="hero-arche-cadre" aria-hidden="true" />
          </div>
          <div className="hero-sceau" aria-hidden="true">
            <svg viewBox="0 0 200 200" className="hero-sceau-svg">
              <defs>
                <path id="sceau-cercle" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
              </defs>
              <text className="hero-sceau-text">
                <textPath href="#sceau-cercle" startOffset="0%">
                  TEMPLE DE LA CÉLÉBRATION · DIEU PAR L'ADORATION ET LA LOUANGE ·
                </textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
