import React, { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getCellGroups } from '../lib/supabase';
import './Cellule.css';

const PROG = [
  { n: '1', titre: 'Accueil et louange', duree: '15 min', desc: 'Temps de louange et d\'adoration en commun' },
  { n: '2', titre: 'Etude de la Parole', duree: '45 min', desc: 'Etude biblique preparee par le service de predication' },
  { n: '3', titre: 'Priere et intercession', duree: '20 min', desc: 'Priere collective pour les membres et l\'eglise' },
  { n: '4', titre: 'Annonces et cloture', duree: '10 min', desc: 'Activites de l\'eglise et benediction finale' },
];

const JOURS_ORDRE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function Cellule() {
  const [cellGroups, setCellGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('groupes');

  useEffect(() => {
    getCellGroups().then(data => {
      const sorted = [...(data || [])].sort((a, b) => {
        return JOURS_ORDRE.indexOf(a.jour_semaine) - JOURS_ORDRE.indexOf(b.jour_semaine);
      });
      setCellGroups(sorted);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <SectionHeader
        label="Communaute"
        title="Cellule"
        titleEm="Bethel"
        subtitle="Reunions hebdomadaires par groupe"
      />
      <div className="cellule-wrap">
        <div className="container">
          <div className="cellule-tabs">
            <button
              className={`c-tab ${tab === 'groupes' ? 'active' : ''}`}
              onClick={() => setTab('groupes')}
            >
              Groupes
            </button>
            <button
              className={`c-tab ${tab === 'programme' ? 'active' : ''}`}
              onClick={() => setTab('programme')}
            >
              Programme type
            </button>
          </div>

          {tab === 'groupes' && (
            <div className="cellule-list">
              {loading && (
                <p style={{ color: 'var(--texte-doux)', fontFamily: 'var(--font-display)', fontStyle: 'italic', padding: '20px 0' }}>
                  Chargement...
                </p>
              )}
              {!loading && cellGroups.length === 0 && (
                <p style={{ color: 'var(--texte-doux)', fontFamily: 'var(--font-display)', fontStyle: 'italic', padding: '20px 0' }}>
                  Le programme des cellules sera publie prochainement.
                </p>
              )}
              {cellGroups.map(group => (
                <div className="cellule-row carte" key={group.id}>
                  <div className="cellule-icon">&#9671;</div>
                  <div className="cellule-info">
                    <h4>{group.nom}</h4>
                    <div className="cellule-meta">
                      <span>&#9672; {group.jour_semaine}</span>
                      <span>&#9672; {group.heure_debut?.slice(0, 5)} - {group.heure_fin?.slice(0, 5)}</span>
                      {group.lieu && <span>&#9672; {group.lieu}</span>}
                    </div>
                    {group.description && (
                      <p className="cellule-desc">{group.description}</p>
                    )}
                    {group.responsable_nom && (
                      <div className="cellule-responsable">
                        Responsable: {group.responsable_nom}
                        {group.responsable_contact && (
                          <span> ({group.responsable_contact})</span>
                        )}
                      </div>
                    )}
                    {group.capacite && (
                      <span className="cellule-capacite">
                        Capacite: {group.capacite} personnes
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="encart-or">
                <span>&#10022;</span>
                Les cellules se reunissent chaque semaine au jour et a l'heure indiques.
              </div>
            </div>
          )}

          {tab === 'programme' && (
            <div className="prog-list">
              {PROG.map(p => (
                <div className="prog-item" key={p.n}>
                  <div className="prog-num">{p.n}</div>
                  <div className="prog-body">
                    <div className="prog-head">
                      <h4>{p.titre}</h4>
                      <span className="prog-duree">{p.duree}</span>
                    </div>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
