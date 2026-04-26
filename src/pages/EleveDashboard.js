import React, { useEffect, useState } from 'react';
import { useEleve } from './EleveLayout';
import { getModulesAvecProgression, getEvaluations, getPaiements, getMesSessionsLive, getMessagesNonLus, getSessionStatut } from '../lib/supabase';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

function useCountdown(targetDate) {
  const [remaining, setRemaining] = React.useState('');
  React.useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setRemaining('En cours'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setRemaining(`Dans ${d}j ${h}h`);
      else if (h > 0) setRemaining(`Dans ${h}h ${m}min`);
      else setRemaining(`Dans ${m} min`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [targetDate]);
  return remaining;
}

function ProchainCoursCard({ cours }) {
  const statut = getSessionStatut(cours);
  const isLive = statut === 'en_cours';
  const countdown = useCountdown(statut === 'programme' ? cours.date_session : null);
  const date = new Date(cours.date_session);
  const canJoin = isLive || (statut === 'programme' && (date - Date.now()) < 15 * 60 * 1000);

  return (
    <div className={`eleve-cours-card${isLive ? ' eleve-cours-card--live' : ''}`}>
      <div className="eleve-cours-card-eyebrow">
        {isLive ? (
          <span className="eleve-cours-live-badge"><span className="eleve-cours-pulse" />Cours en cours</span>
        ) : (
          'Prochain cours en live'
        )}
      </div>
      <div className="eleve-cours-card-titre">{cours.titre}</div>
      <div className="eleve-cours-card-meta">
        <Icon name="calendar" size={13} style={{marginRight:4}} />{date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        &nbsp;·&nbsp;
        <Icon name="clock" size={13} style={{marginRight:4}} />{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        &nbsp;·&nbsp;
        <Icon name="timer" size={13} style={{marginRight:4}} />{cours.duree_minutes || 60} min
      </div>
      {countdown && !isLive && <div className="eleve-cours-countdown"><Icon name="alarm" size={14} style={{marginRight:5}} />{countdown}</div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <a
          href={canJoin ? cours.lien_zoom : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="eleve-cours-join-btn"
          style={canJoin ? {} : { opacity: 0.45, pointerEvents: 'none' }}
        >
          <Icon name="camera" size={15} style={{marginRight:6}} />Rejoindre sur Zoom
        </a>
        {!canJoin && (
          <span style={{ fontSize: '0.78rem', color: 'var(--texte-doux)', alignSelf: 'center', fontStyle: 'italic' }}>
            Disponible 15 min avant le début
          </span>
        )}
      </div>
    </div>
  );
}

export default function EleveDashboard() {
  const { eleve } = useEleve();
  const [modules, setModules] = useState([]);
  const [evals, setEvals] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [prochainCours, setProchainCours] = useState(null);
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  const [, setTick] = useState(0); // force re-render toutes les 60s pour statut live

  useEffect(() => {
    if (!eleve) return;
    getModulesAvecProgression(eleve.id).then(setModules);
    getEvaluations(eleve.id).then(setEvals);
    getPaiements(eleve.id).then(setPaiements);
    getMesSessionsLive(eleve.id).then(sessions => {
      // getMesSessionsLive retourne déjà en_cours en premier grâce au tri
      const prochain = sessions.find(s => {
        const st = getSessionStatut(s);
        return st === 'en_cours' || st === 'programme';
      }) || null;
      setProchainCours(prochain);
    });
    getMessagesNonLus(eleve.id).then(msgs => setMessagesNonLus(msgs.length));
  }, [eleve]);

  // Rafraîchit le statut toutes les 60s sans recharger depuis la DB
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const prenom = eleve?.prenom || eleve?.nom?.split(' ')[0] || 'Étudiant';
  const modulesDebloques = modules.filter(m => m.debloque).length;
  const modulesCompletes = modules.filter(m => m.complete).length;
  const moyenne = evals.length
    ? (evals.reduce((s, e) => s + (e.note / e.note_max * 20), 0) / evals.length).toFixed(1)
    : null;

  const prochainModule = modules.find(m => m.debloque && !m.complete)
    || modules.find(m => !m.debloque);

  const prochainPaiement = paiements.find(p => p.statut === 'en_attente');

  return (
    <div>
      <h1 className="eleve-greeting">
        Bonjour, <em>{prenom}</em>
      </h1>
      <p className="eleve-page-sub">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {/* ── Prochain cours en live ── */}
      {prochainCours && (
        <ProchainCoursCard cours={prochainCours} />
      )}

      {/* ── Messages non lus ── */}
      {messagesNonLus > 0 && (
        <div className="eleve-msg-banner">
          <span className="eleve-msg-banner-icon"><Icon name="message" size={18} /></span>
          <div>
            <strong>{messagesNonLus} message{messagesNonLus > 1 ? 's' : ''} non lu{messagesNonLus > 1 ? 's' : ''}</strong>
            <span> de l'équipe pastorale</span>
          </div>
          <Link to="/eleve/messages" className="eleve-msg-banner-btn">Voir mes messages →</Link>
        </div>
      )}

      {/* ── 4 stats ── */}
      <div className="eleve-stats-grid">
        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Progression globale</div>
          <div className="eleve-stat-value">
            {eleve?.progression_pct ?? 0}<span className="eleve-stat-unit"> %</span>
          </div>
          <div className="eleve-progress-wrap">
            <div className="eleve-progress-bar">
              <div className="eleve-progress-fill" style={{ width: `${eleve?.progression_pct ?? 0}%` }} />
            </div>
            <div className="eleve-progress-pct">{eleve?.progression_pct ?? 0} %</div>
          </div>
        </div>

        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Modules débloqués</div>
          <div className="eleve-stat-value">
            {modulesDebloques}<span className="eleve-stat-unit"> / {modules.length || 6}</span>
          </div>
          {modulesCompletes > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--texte-doux)' }}>
              {modulesCompletes} complété{modulesCompletes > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Note moyenne</div>
          <div className="eleve-stat-value">
            {moyenne ? <>{moyenne}<span className="eleve-stat-unit"> /20</span></> : <span style={{ fontSize: 18, color: 'var(--texte-doux)' }}>—</span>}
          </div>
        </div>

        <div className="eleve-stat-card">
          <div className="eleve-stat-label">{eleve?.formule === 'echelonne' ? 'Prochain paiement' : 'Formule'}</div>
          {eleve?.formule === 'echelonne' ? (
            prochainPaiement ? (
              <>
                <div className="eleve-stat-value">
                  {prochainPaiement.montant}<span className="eleve-stat-unit"> €</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--texte-doux)', marginTop: 6 }}>
                  {new Date(prochainPaiement.date_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--texte-doux)', fontStyle: 'italic', marginTop: 8 }}>Aucun paiement en attente</div>
            )
          ) : (
            <div style={{ marginTop: 8 }}>
              <span className="eleve-badge eleve-badge--gold">Intégral</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Prochain module + Dernières évaluations ── */}
      <div className="eleve-dash-grid">
        {prochainModule && (
          <div className="eleve-next-module">
            <div className="eleve-next-eyebrow">
              {prochainModule.complete ? 'Module suivant' : prochainModule.debloque ? 'Module en cours' : 'Prochain module'}
            </div>
            <div className="eleve-next-num">
              {String(prochainModule.numero).padStart(2, '0')}
            </div>
            <h3 className="eleve-next-titre">{prochainModule.titre}</h3>
            <p className="eleve-next-desc">{prochainModule.description}</p>
          </div>
        )}

        <div className="eleve-last-evals">
          <div className="eleve-section-titre">Dernières <em>évaluations</em></div>
          {evals.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--texte-doux)', fontSize: 14 }}>
              Aucune évaluation pour l'instant.
            </p>
          ) : (
            evals.slice(0, 3).map(ev => (
              <div className="eleve-eval-row" key={ev.id}>
                <div className="eleve-eval-info">
                  <span className="eleve-eval-titre">{ev.titre}</span>
                  <span className="eleve-eval-module">{ev.module_titre}</span>
                </div>
                <div className="eleve-eval-note">
                  {ev.note}<small>/{ev.note_max}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
