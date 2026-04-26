import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const sections = [
  { to: '/cultes', icon: '✝', label: 'Cultes', titre: 'Culte du Dimanche', desc: '10h – 11h30 · En ligne' },
  { to: '/montagne-priere', icon: '✦', label: 'Prière', titre: 'Montagne de Prière', desc: 'Les 12 familles de Jacob' },
  { to: '/predication', icon: '◈', label: 'Parole', titre: 'Chaîne de Prédication', desc: 'Vidéos & prédications' },
  { to: '/cellule', icon: '◇', label: 'Communauté', titre: 'Cellule Bethel', desc: 'Réunions hebdomadaires' },
  { to: '/formation', icon: '◎', label: 'Formation', titre: 'Théologie Biblique', desc: 'Formation chrétienne' },
  { to: '/pasteur', icon: '✧', label: 'Pastoral', titre: 'Notre Pasteur', desc: 'Le couple pastoral' },
];

export default function Home() {
  useEffect(() => {
  }, []);

  return (
    <div className="home">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg-text">ETC</div>
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-line" />
            Dieu par l'adoration et la louange
            <span className="hero-eyebrow-line" />
          </div>
          <div className="hero-titles">
            <p className="hero-pre">Bienvenue à l'</p>
            <h1 className="hero-main">Église<br /><em>Temple</em></h1>
            <p className="hero-sub">de la Célébration</p>
          </div>
          <div className="hero-ornament">
            <span className="h-line" /><span className="h-diamond" /><span className="h-text">E · T · C</span><span className="h-diamond" /><span className="h-line" />
          </div>
          <div className="hero-live">
            <span className="dot-live" />
            Culte en ligne &nbsp;·&nbsp; Dimanche 10h – 11h30
          </div>
          <Link to="/cultes" className="hero-cta">Voir le programme</Link>
        </div>
      </section>

      <div style={{ background: '#FFF8F0', position: 'relative', zIndex: 1, paddingTop: '15px' }}>

        {/* ── SÉPARATEUR ── */}
        <div className="ornament-sep container">
          <div className="ornament-line" />
          <div className="ornament-diamond" />
          <div className="ornament-diamond" style={{ margin: '0 4px' }} />
          <div className="ornament-diamond" />
          <div className="ornament-line r" />
        </div>

        {/* ── GRILLE SECTIONS ── */}
        <section className="home-sections">
          <div className="container">
            <p className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Notre Église</p>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 36 }}>Découvrez notre <em>communauté</em></h2>
            <div className="sections-grid">
              {sections.map(s => (
                <Link to={s.to} className="section-card carte" key={s.to}>
                  <div className="sc-icon">{s.icon}</div>
                  <div className="sc-label">{s.label}</div>
                  <h3 className="sc-titre">{s.titre}</h3>
                  <p className="sc-desc">{s.desc}</p>
                  <span className="sc-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>{/* fin wrapper crème */}


    </div>
  );
}
