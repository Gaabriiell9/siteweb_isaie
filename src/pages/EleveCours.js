import React, { useEffect, useState } from 'react';
import { useEleve } from './EleveLayout';
import { getMesSessionsLive, marquerSessionRejointe, getSessionStatut } from '../lib/supabase';
import './EleveCours.css';
import Icon from '../components/Icon';

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setRemaining(''); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setRemaining(`Dans ${d}j ${h}h`);
      else if (h > 0) setRemaining(`Dans ${h}h ${m}min`);
      else setRemaining(`Dans ${m} min`);
    };
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return remaining;
}

function SessionCard({ session, onJoin }) {
  const statut = getSessionStatut(session);
  const isLive = statut === 'en_cours';
  const isPast = statut === 'termine';
  const date = new Date(session.date_session);
  const countdown = useCountdown(statut === 'programme' ? session.date_session : null);
  const canJoin = isLive || (statut === 'programme' && (date - Date.now()) < 15 * 60 * 1000);

  const downloadICS = () => {
    const start = date.toISOString().replace(/[-:]/g, '').replace('.000', '');
    const endDate = new Date(date.getTime() + (session.duree_minutes || 60) * 60000);
    const end = endDate.toISOString().replace(/[-:]/g, '').replace('.000', '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:${session.titre}`,
      session.description ? `DESCRIPTION:${session.description}` : '',
      `URL:${session.lien_zoom}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `cours-${session.titre.replace(/\s+/g, '-').toLowerCase()}.ics`; a.click();
  };

  return (
    <div className={`ec-session-card${isLive ? ' ec-session-card--live' : ''}${isPast ? ' ec-session-card--past' : ''}`}>
      <div className="ec-session-date-bloc">
        <div className="ec-session-date-day">{date.getDate()}</div>
        <div className="ec-session-date-month">
          {date.toLocaleDateString('fr-FR', { month: 'short' })}
        </div>
      </div>

      <div className="ec-session-info">
        <div className="ec-session-titre">{session.titre}</div>
        <div className="ec-session-meta">
          <span><Icon name="clock" size={13} style={{marginRight:4}} />{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span><Icon name="timer" size={13} style={{marginRight:4}} />{session.duree_minutes || 60} min</span>
          {session.type_session === 'recurrent' && <span><Icon name="refresh" size={13} style={{marginRight:4}} />Récurrent</span>}
        </div>
        <div className="ec-session-badges">
          {session.module_titre && (
            <span className="ec-badge ec-badge--module">{session.module_titre}</span>
          )}
          {isLive && <span className="ec-badge ec-badge--live"><span className="ec-live-dot" />En cours</span>}
          {!isLive && !isPast && <span className="ec-badge ec-badge--coming">À venir</span>}
          {isPast && <span className="ec-badge ec-badge--done">Terminé</span>}
        </div>

        {countdown && <div className="ec-countdown"><Icon name="alarm" size={14} style={{marginRight:5}} />{countdown}</div>}

        <div className="ec-session-actions">
          {!isPast && (
            <a
              href={canJoin ? session.lien_zoom : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="ec-btn-zoom"
              style={canJoin ? {} : { opacity: 0.4, pointerEvents: 'none' }}
              onClick={() => canJoin && onJoin(session.id)}
            >
              <Icon name="camera" size={15} style={{marginRight:6}} />Rejoindre sur Zoom
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EleveCours() {
  const { eleve } = useEleve();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('avenir');
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!eleve) return;
    getMesSessionsLive(eleve.id).then(data => {
      setSessions(data);
      setLoading(false);
    });
  }, [eleve]);

  // Rafraîchit le statut toutes les 60s sans requête DB
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const filtered = sessions.filter(s => {
    const st = getSessionStatut(s);
    if (filter === 'avenir') return st === 'en_cours' || st === 'programme';
    if (filter === 'passes') return st === 'termine';
    return true;
  }).sort((a, b) => {
    const order = { en_cours: 0, programme: 1, termine: 2 };
    const oa = order[getSessionStatut(a)] ?? 3;
    const ob = order[getSessionStatut(b)] ?? 3;
    if (oa !== ob) return oa - ob;
    return new Date(a.date_session) - new Date(b.date_session);
  });

  const handleJoin = async (sessionId) => {
    if (eleve) await marquerSessionRejointe(sessionId, eleve.id);
  };

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>cours en live</em></h1>
      <p className="eleve-page-sub">Sessions Zoom avec l'équipe pastorale</p>

      <div className="ec-filters">
        {[
          { id: 'avenir', label: 'À venir' },
          { id: 'passes', label: 'Passés' },
          { id: 'tous', label: 'Tous' },
        ].map(f => (
          <button key={f.id}
            className={`ec-filter-btn${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="ec-empty">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="ec-empty">
          {filter === 'avenir'
            ? 'Aucun cours à venir pour le moment. Revenez bientôt !'
            : 'Aucune session dans cette catégorie.'}
        </div>
      ) : (
        <div className="ec-sessions">
          {filtered.map(s => (
            <SessionCard key={s.id} session={s} onJoin={handleJoin} />
          ))}
        </div>
      )}
    </div>
  );
}
