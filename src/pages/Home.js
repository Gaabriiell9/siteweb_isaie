import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnnouncements } from '../lib/public';
import Icon from '../components/Icon';
import './Home.css';

const sections = [
  { to: '/cultes', icon: 'cross', label: 'Cultes', titre: 'Culte du Dimanche', desc: '10h - 11h30 - En ligne' },
  { to: '/montagne-priere', icon: 'star', label: 'Prière', titre: 'Montagne de Prière', desc: 'Les 12 familles de Jacob' },
  { to: '/predication', icon: 'target', label: 'Parole', titre: 'Chaîne de Prédication', desc: 'Vidéos et prédications' },
  { to: '/cellule', icon: 'diamond-outline', label: 'Communauté', titre: 'Cellule Bethel', desc: 'Réunions hebdomadaires' },
  { to: '/formation', icon: 'graduation', label: 'Formation', titre: 'Théologie Biblique', desc: 'Formation chrétienne' },
  { to: '/pasteur', icon: 'star-outline', label: 'Pastoral', titre: 'Notre Pasteur', desc: 'Le couple pastoral' },
];

export default function Home() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const annoncesData = await getAnnouncements();
        setAnnonces((annoncesData || []).slice(0, 3));
      } catch (err) {
        console.error('[Home] Erreur chargement:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="home">

      {/* ── HERO PASTEUR ── */}
      <section className="hero-pasteur">
        <img src="/pr_img.png" alt="Pasteur et Première Dame" className="hero-pasteur-img" />
        <div className="hero-pasteur-overlay">
          <div className="hero-pasteur-content">
            <p className="hero-pasteur-label">PASTEURS PRINCIPAUX</p>
            <h2 className="hero-pasteur-nom">Pasteur & Première Dame</h2>
            <p className="hero-pasteur-devise">
              "Instruments de Dieu pour transformer des vies"
            </p>
            <a href="/pasteur" className="hero-pasteur-btn">En savoir plus</a>
          </div>
        </div>
      </section>

      <div style={{ background: '#FFF8F0', position: 'relative', zIndex: 1, paddingTop: '15px' }}>

        {/* Section Annonces - affichee uniquement s'il y a des annonces (Home.js:46) */}
        {!loading && !error && annonces.length > 0 && (
          <section className="home-annonces">
            <div className="container">
              <p className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Actualités</p>
              <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 28 }}>Annonces de <em>l'église</em></h2>
              <div className="annonces-grid">
                {annonces.map(a => (
                  <div key={a.id} className="annonce-card carte">
                    {a.image_url && (
                      <div className="annonce-img-wrap">
                        <img src={a.image_url} alt="" className="annonce-img" />
                      </div>
                    )}
                    <div className="annonce-body">
                      <div className="annonce-date">{formatDate(a.date_publi)}</div>
                      <h3 className="annonce-titre">{a.titre}</h3>
                      <p className="annonce-contenu">{a.contenu}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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
            <p className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Notre église</p>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 36 }}>Découvrez notre <em>communauté</em></h2>
            <div className="sections-grid">
              {sections.map(s => (
                <Link to={s.to} className="section-card carte" key={s.to}>
                  <div className="sc-icon"><Icon name={s.icon} size={20} /></div>
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
