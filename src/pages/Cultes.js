import React, { useState, useEffect, useRef, useCallback } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getCultes, getAnciensCultes, IS_MOCK, getNowParis, parseDateParis, formatDateParis } from '../lib/supabase';
import { extractYoutubeId, getYoutubeEmbedUrl } from '../lib/youtube';
import { getEventEtat } from '../lib/dateUtils';
import './Cultes.css';
import Icon from '../components/Icon';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function getUpcomingSundays(n = 8) {
  const arr = [];
  const now = getNowParis();
  const d = new Date(now);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  for (let i = 0; i < n; i++) { arr.push(new Date(d)); d.setDate(d.getDate() + 7); }
  return arr;
}

function getNextSunday10hParis() {
  const now = getNowParis();
  const day = now.getDay();
  if (day === 0) {
    const t = new Date(now); t.setHours(10, 0, 0, 0);
    if (now < t) return t;
  }
  const d = new Date(now);
  d.setDate(d.getDate() + ((7 - day) % 7 || 7));
  d.setHours(10, 0, 0, 0);
  return d;
}

function calcCd() {
  const total = Math.max(0, Math.floor((getNextSunday10hParis() - getNowParis()) / 1000));
  return {
    days: Math.floor(total / 86400),
    hrs:  Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
  };
}

function pad(n) { return String(n).padStart(2, '0'); }


export default function Cultes() {
  const [cultes,        setCultes]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [cd,            setCd]            = useState(calcCd());
  const [copied,        setCopied]        = useState(false);
  const [anciensCultes, setAnciensCultes] = useState([]);
  const [selectedCulte, setSelectedCulte] = useState(null);
  const [isPlaying,     setIsPlaying]     = useState(false);

  const livePlayerRef = useRef(null);
  const liveContainerRef = useRef(null);

  const sendPlayerCommand = useCallback((command) => {
    if (livePlayerRef.current?.contentWindow) {
      livePlayerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        'https://www.youtube.com'
      );
    }
  }, []);

  useEffect(() => {
    getCultes('culte').then(data => {
      setCultes(data);
      setLoading(false);
    });
    getAnciensCultes().then(setAnciensCultes);
  }, []);

  // Pause automatique quand le player sort de l'écran ou au démontage
  useEffect(() => {
    const container = liveContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && isPlaying) {
          sendPlayerCommand('pauseVideo');
          setIsPlaying(false);
        }
      },
      { threshold: 0 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      sendPlayerCommand('pauseVideo');
    };
  }, [isPlaying, sendPlayerCommand]);

  const handlePlayClick = () => {
    sendPlayerCommand('playVideo');
    setIsPlaying(true);
  };

  useEffect(() => {
    const id = setInterval(() => setCd(calcCd()), 60000);
    return () => clearInterval(id);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sundays = cultes.length > 0
    ? cultes
    : IS_MOCK
      ? getUpcomingSundays(8).map((d, i) => ({
          id: i, titre: 'Culte du Dimanche',
          date_culte: d.toISOString().split('T')[0],
          heure_debut: '10:00', heure_fin: '11:30', lien_live: null,
        }))
      : [];

  return (
    <div>
      <SectionHeader label="Programme" title="Cultes" titleEm="dominicaux"
        subtitle="Chaque dimanche · 10h00 – 11h30 · En ligne" />

      <div className="cultes-wrap">

          {/* ── Programme éditorial ───────────────────────────────── */}
          <div className="prog-section">

            {/* Badge countdown centré */}
            <div className="prog-countdown-wrap">
              <div className="prog-countdown">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--or)" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <line x1="8" y1="4.5" x2="8" y2="8" />
                  <line x1="8" y1="8" x2="10.5" y2="10" />
                </svg>
                <span>
                  Prochain culte dans&nbsp;
                  <strong>{cd.days}j {pad(cd.hrs)}h {pad(cd.mins)}min</strong>
                </span>
              </div>
            </div>


            {/* Liste épurée */}
            {!loading && sundays.length === 0 && (
              <p className="prog-empty">Aucun culte programmé pour l'instant.</p>
            )}
            <div className="prog-list">
              {sundays.map((c, i) => {
                const [year, month, day] = c.date_culte.split('-').map(Number);
                const heure = `${(c.heure_debut || '10:00').slice(0,5)} — ${(c.heure_fin || '11:30').slice(0,5)}`;
                const hasLive = c.lien_live && c.lien_live.trim();
                const etat = getEventEtat(c);
                const embedUrl = hasLive ? getYoutubeEmbedUrl(c.lien_live) : null;

                return (
                  <div className={`prog-row ${etat === 'en_cours' && hasLive ? 'prog-row--live' : ''}`} key={c.id || i}>
                    <div className="prog-date">
                      <span className="prog-day">{day}</span>
                      <span className="prog-month">{MOIS[month - 1]}</span>
                    </div>
                    <div className="prog-info">
                      <span className="prog-titre">{c.titre}</span>
                      <span className="prog-sub">Louange · Adoration · Prédication</span>
                    </div>
                    <div className="prog-heure">{heure}</div>

                    {/* Badge "Live prévu" pour culte à venir avec lien */}
                    {hasLive && etat === 'a_venir' && (
                      <span className="prog-live-badge">Live prévu</span>
                    )}

                    {/* Badge "En direct" pour culte en cours */}
                    {hasLive && etat === 'en_cours' && (
                      <span className="prog-live-badge prog-live-badge--active">
                        <span className="prog-live-dot" />En direct
                      </span>
                    )}

                    {/* Lecteur YouTube intégré pour le culte en cours */}
                    {etat === 'en_cours' && embedUrl && (
                      <div className="prog-player-wrap" ref={liveContainerRef}>
                        <div className="prog-player">
                          <iframe
                            ref={livePlayerRef}
                            src={embedUrl}
                            title={c.titre}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                          {!isPlaying && (
                            <div className="prog-player-overlay" onClick={handlePlayClick}>
                              <span className="prog-player-play-btn">▶</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Badge "Replay" pour culte terminé avec lien */}
                    {hasLive && etat === 'termine' && (
                      <span className="prog-live-badge">Replay dispo</span>
                    )}

                    {/* Bouton externe si en cours mais pas YouTube (Zoom, etc.) */}
                    {etat === 'en_cours' && hasLive && !embedUrl && (
                      <div className="prog-player-wrap">
                        <a
                          href={c.lien_live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prog-external-btn"
                        >
                          🔗 Rejoindre le live
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Anciens cultes / Replays ──────────────────────── */}
          {anciensCultes.length > 0 && (
            <div className="replays-section">
              <h3 className="replays-titre">Anciens <em>cultes</em></h3>
              <div className="replays-grid">
                {anciensCultes.map(c => {
                  const ytId = extractYoutubeId(c.lien_live);
                  const dateParis = parseDateParis(c.date_culte, '12:00');
                  const dateLabel = formatDateParis(dateParis, { day: 'numeric', month: 'long', year: 'numeric' });
                  return (
                    <div className="replay-card" key={c.id} onClick={() => setSelectedCulte(c)}>
                      <div className="replay-thumb">
                        {ytId && <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={c.titre} />}
                        <div className="replay-play-overlay">
                          <span className="replay-play-btn">&#9654;</span>
                        </div>
                      </div>
                      <div className="replay-info">
                        <span className="replay-date">{dateLabel}</span>
                        <span className="replay-title">{c.titre}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      </div>

      {/* ── Modal replay ─────────────────────────────────────────── */}
      {selectedCulte && (() => {
        const replayEmbedUrl = getYoutubeEmbedUrl(selectedCulte.lien_live);
        return (
          <div className="replay-modal-overlay" onClick={() => setSelectedCulte(null)}>
            <div className="replay-modal" onClick={e => e.stopPropagation()}>
              <div className="replay-modal-header">
                <span className="replay-modal-titre">{selectedCulte.titre}</span>
                <button className="replay-modal-close" onClick={() => setSelectedCulte(null)}><Icon name="x" size={16} /></button>
              </div>
              {replayEmbedUrl ? (
                <div className="live-player">
                  <iframe
                    src={replayEmbedUrl}
                    title={selectedCulte.titre}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <a href={selectedCulte.lien_live} target="_blank" rel="noopener noreferrer" className="prog-external-btn">
                    🔗 Ouvrir le replay
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
