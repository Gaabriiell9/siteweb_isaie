import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';
import { LABELS } from '../../lib/constants';
import './Activites.css';

const ACTIVITES = [
  {
    num: '01',
    icon: 'cross',
    titre: 'Cultes',
    lien: '/cultes',
    getDynamique: (data) => {
      if (data.services?.items?.[0]) {
        const s = data.services.items[0];
        const d = new Date(s.date_service);
        return `${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
      }
      return 'Chaque dimanche';
    },
  },
  {
    num: '02',
    icon: 'mountain',
    titre: 'Montagne de Prière',
    lien: '/montagne-priere',
    getDynamique: (data) => {
      if (data.messageDuJour?.item?.titre) {
        return data.messageDuJour.item.titre;
      }
      return 'Message du jour';
    },
  },
  {
    num: '03',
    icon: 'users',
    titre: LABELS.CELLULE_BETHEL,
    lien: '/cellule',
    getDynamique: (data) => {
      const count = data.cellules?.items?.length || 0;
      return count > 0 ? `${count} cellule${count > 1 ? 's' : ''} actives` : 'Rejoindre un groupe';
    },
  },
  {
    num: '04',
    icon: 'play',
    titre: 'Prédications',
    lien: '/predication',
    getDynamique: (data) => {
      if (data.derniereVideo?.item?.titre) {
        const t = data.derniereVideo.item.titre;
        return t.length > 40 ? t.slice(0, 40) + '...' : t;
      }
      return 'Dernières vidéos';
    },
  },
  {
    num: '05',
    icon: 'graduation',
    titre: 'Formation',
    lien: '/formation',
    getDynamique: () => 'Inscriptions ouvertes',
  },
  {
    num: '06',
    icon: 'user',
    titre: 'Notre Pasteur',
    lien: '/pasteur',
    getDynamique: () => 'Couple pastoral',
  },
];

function ActiviteTuile({ activite, data, index }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      to={activite.lien}
      className="activite-tuile"
      ref={ref}
      style={{ '--delay': `${index * 0.1}s` }}
    >
      <span className="activite-num">{activite.num}</span>
      <div className="activite-icon">
        <Icon name={activite.icon} size={24} />
      </div>
      <h3 className="activite-titre">{activite.titre}</h3>
      <p className="activite-dynamique">{activite.getDynamique(data)}</p>
      <span className="activite-arrow">
        <Icon name="arrow-right" size={18} />
      </span>
    </Link>
  );
}

export default function Activites({ data = {}, loading = false }) {
  if (loading) {
    return (
      <section className="activites-section">
        <div className="activites-container">
          <div className="activites-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="activite-skeleton" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="activites-section">
      <div className="activites-container">
        <p className="section-label">Nos activités</p>
        <h2 className="section-title">Rejoignez la <em>communauté</em></h2>

        <div className="activites-grid">
          {ACTIVITES.map((a, idx) => (
            <ActiviteTuile key={a.num} activite={a} data={data} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
