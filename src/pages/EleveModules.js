import React, { useEffect, useState } from 'react';
import { useEleve } from './EleveLayout';
import { getModulesAvecProgression, getRessourcesEleve } from '../lib/supabase';
import Icon from '../components/Icon';

const IcoLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IcoCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function getStatut(m) {
  if (m.complete)  return { label: 'Complété',   css: 'eleve-badge--green' };
  if (m.debloque)  return { label: 'En cours',   css: 'eleve-badge--blue' };
  return              { label: 'Verrouillé', css: 'eleve-badge--grey' };
}

export default function EleveModules() {
  const { eleve } = useEleve();
  const [modules, setModules] = useState([]);
  const [ressourcesMap, setRessourcesMap] = useState({});
  const [openRessources, setOpenRessources] = useState({});

  useEffect(() => {
    if (!eleve) return;
    getModulesAvecProgression(eleve.id).then(setModules);
    getRessourcesEleve(eleve.id).then(data => {
      const map = {};
      data.forEach(r => {
        const key = r.module_id;
        if (!map[key]) map[key] = [];
        map[key].push(r);
      });
      setRessourcesMap(map);
    });
  }, [eleve]);

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>modules</em></h1>
      <p className="eleve-page-sub">Programme · 6 modules · 12 mois</p>

      <div className="eleve-modules-list">
        {modules.map(m => {
          const statut = getStatut(m);
          return (
            <div className={`eleve-module-card${!m.debloque ? ' eleve-module-card--locked' : ''}`} key={m.id}>
              <span className="eleve-module-num">{String(m.numero).padStart(2, '0')}</span>
              <div className="eleve-module-info">
                <div className="eleve-module-titre">{m.titre}</div>
                <div className="eleve-module-desc">{m.description}</div>
                {m.date_debloque && (
                  <div style={{ fontSize: 10, color: 'var(--texte-doux)', marginTop: 4, fontFamily: 'var(--font-ui)', letterSpacing: '0.5px' }}>
                    Débloqué le {new Date(m.date_debloque).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
                {m.date_complete && (
                  <div style={{ fontSize: 10, color: '#27500A', marginTop: 2, fontFamily: 'var(--font-ui)' }}>
                    Complété le {new Date(m.date_complete).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
              <div className="eleve-module-right">
                <span className={`eleve-badge ${statut.css}`}>{statut.label}</span>
                {m.complete && <span style={{ color: '#27500A' }}><IcoCheck /></span>}
                {!m.debloque && <span className="eleve-module-lock"><IcoLock /></span>}
              </div>
              {/* Ressources */}
              {m.debloque && (ressourcesMap[m.module_id] || []).length > 0 && (
                <div className="eleve-module-ressources">
                  <button
                    className="eleve-module-ressources-toggle"
                    onClick={() => setOpenRessources(prev => ({...prev, [m.id]: !prev[m.id]}))}
                  >
                    <Icon name="books" size={13} style={{marginRight:5}} />{(ressourcesMap[m.module_id] || []).length} ressource{(ressourcesMap[m.module_id] || []).length > 1 ? 's' : ''} disponible{(ressourcesMap[m.module_id] || []).length > 1 ? 's' : ''}
                    <Icon name={openRessources[m.id] ? 'chevron-up' : 'chevron-down'} size={14} />
                  </button>
                  {openRessources[m.id] && (
                    <div className="eleve-module-ressources-list">
                      {(ressourcesMap[m.module_id] || []).map(r => (
                        <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="eleve-ressource-item">
                          <span className="eleve-ressource-type">
                            <Icon name={r.type_ressource === 'pdf' ? 'file' : r.type_ressource === 'video' ? 'video' : r.type_ressource === 'audio' ? 'audio' : r.type_ressource === 'image' ? 'image' : 'link'} size={16} />
                          </span>
                          <div>
                            <div className="eleve-ressource-titre">{r.titre}</div>
                            {r.description && <div className="eleve-ressource-desc">{r.description}</div>}
                          </div>
                          {r.taille_ko && <span className="eleve-ressource-size">{r.taille_ko < 1024 ? `${r.taille_ko} Ko` : `${(r.taille_ko/1024).toFixed(1)} Mo`}</span>}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {eleve?.formule === 'echelonne' && (
        <div style={{ marginTop: 28, padding: '16px 20px', background: 'var(--or-pale)', border: '1px solid rgba(200,134,10,0.2)', borderLeft: '3px solid var(--or)' }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bordeaux-clair)', lineHeight: 1.6 }}>
            <strong>Formule échelonnée</strong> — Les modules se débloquent au fur et à mesure de vos mensualités.
            Chaque paiement validé débloque le module correspondant.
          </p>
        </div>
      )}
    </div>
  );
}
