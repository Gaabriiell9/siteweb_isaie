import React, { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getCultes } from '../lib/supabase';
import './Cellule.css';

const PROG = [
  {n:'1',titre:'Accueil & louange',duree:'15 min',desc:'Temps de louange et d\'adoration en commun'},
  {n:'2',titre:'Étude de la Parole',duree:'45 min',desc:'Étude biblique préparée par le service de prédication'},
  {n:'3',titre:'Prière & intercession',duree:'20 min',desc:'Prière collective pour les membres et l\'église'},
  {n:'4',titre:'Annonces & clôture',duree:'10 min',desc:'Activités de l\'église et bénédiction finale'},
];
const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function Cellule() {
  const [cellules, setCellules] = useState([]);
  const [tab, setTab] = useState('groupes');
  useEffect(() => { getCultes('cellule').then(setCellules); }, []);
  return (
    <div>
      <SectionHeader label="Communauté" title="Cellule" titleEm="Bethel" subtitle="Réunions hebdomadaires · Programme de la semaine" />
      <div className="cellule-wrap">
        <div className="container">
          <div className="cellule-tabs">
            <button className={`c-tab ${tab==='groupes'?'active':''}`} onClick={()=>setTab('groupes')}>Groupes</button>
            <button className={`c-tab ${tab==='programme'?'active':''}`} onClick={()=>setTab('programme')}>Programme type</button>
          </div>
          {tab==='groupes' && (
            <div className="cellule-list">
              {cellules.length===0 && <p style={{color:'var(--texte-doux)',fontFamily:'var(--font-display)',fontStyle:'italic',padding:'20px 0'}}>Le programme des cellules sera publié prochainement.</p>}
              {cellules.map(c => (
                <div className="cellule-row carte" key={c.id}>
                  <div className="cellule-icon">◇</div>
                  <div className="cellule-info">
                    <h4>{c.titre}</h4>
                    <div className="cellule-meta">
                      <span>◈ {new Date(c.date_culte).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span>
                      <span>◈ {c.heure_debut?.slice(0,5)} – {c.heure_fin?.slice(0,5)}</span>
                      {c.groupe && <span>◈ {c.groupe}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="encart-or">
                <span>✦</span>
                Le programme des cellules suit le même système que les cultes dominicaux.
              </div>
            </div>
          )}
          {tab==='programme' && (
            <div className="prog-list">
              {PROG.map(p => (
                <div className="prog-item" key={p.n}>
                  <div className="prog-num">{p.n}</div>
                  <div className="prog-body">
                    <div className="prog-head"><h4>{p.titre}</h4><span className="prog-duree">{p.duree}</span></div>
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
