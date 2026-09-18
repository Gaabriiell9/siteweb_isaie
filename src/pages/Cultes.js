import React, { useState, useEffect, useRef, useCallback } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getServices, getAnciensServices, getProchainService } from '../lib/public';
import { parseDateParis, formatDateParis } from '../lib/client';
import { extractYoutubeId, getYoutubeEmbedUrl } from '../lib/youtube';
import { getServiceStatut, getServiceStartTime, getCountdown } from '../lib/dateUtils';
import './Cultes.css';
import Icon from '../components/Icon';

const MOIS = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];

function pad(n) { return String(n).padStart(2, '0'); }

export default function Cultes() {
  const [cultes, setCultes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prochainService, setProchainService] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [, setTick] = useState(0);
  const [anciensCultes, setAnciensCultes] = useState([]);
  const [selectedCulte, setSelectedCulte] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      const [servicesData, anciensData, prochainData] = await Promise.all([
        getServices('culte'),
        getAnciensServices(),
        getProchainService()
      ]);
      setCultes(servicesData);
      setAnciensCultes(anciensData);
      setProchainService(prochainData);
      setLoading(false);
    };
    loadData();
  }, []);

  // Rafraichissement du statut et countdown toutes les 30 secondes
  useEffect(() => {
    const updateCountdown = () => {
      if (prochainService) {
        const startTime = getServiceStartTime(prochainService);
        setCountdown(getCountdown(startTime));
      }
      setTick(t => t + 1);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000);
    return () => clearInterval(interval);
  }, [prochainService]);

  // Pause automatique quand le player sort de l'ecran
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

  return (
    <div>
      <SectionHeader label="Programme" title="Cultes" titleEm="dominicaux"
        subtitle="Chaque dimanche - 10h00 - 11h30 - En ligne" />

      <div className="cultes-wrap">

        {/* Programme editorial */}
        <div className="prog-section">

          {/* Badge countdown centre - base sur le prochain service */}
          {prochainService && countdown.total > 0 && (
            <div className="prog-countdown-wrap">
              <div className="prog-countdown">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--or)" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <line x1="8" y1="4.5" x2="8" y2="8" />
                  <line x1="8" y1="8" x2="10.5" y2="10" />
                </svg>
                <span>
                  Prochain culte dans&nbsp;
                  <strong>{countdown.days}j {pad(countdown.hours)}h {pad(countdown.minutes)}min</strong>
                </span>
              </div>
            </div>
          )}

          {/* Liste des cultes */}
          {!loading && cultes.length === 0 && (
            <p className="prog-empty">Aucun culte programme pour l'instant.</p>
          )}
          <div className="prog-list">
            {cultes.map((c, i) => {
              const [year, month, day] = c.date_service.split('-').map(Number);
              const heure = `${(c.heure_debut || '10:00').slice(0,5)} - ${(c.heure_fin || '11:30').slice(0,5)}`;
              const hasLive = c.lien_live && c.lien_live.trim();
              const statut = getServiceStatut(c);
              const embedUrl = hasLive ? getYoutubeEmbedUrl(c.lien_live) : null;

              return (
                <div className={`prog-row ${statut === 'en_cours' && hasLive ? 'prog-row--live' : ''}`} key={c.id || i}>
                  <div className="prog-date">
                    <span className="prog-day">{day}</span>
                    <span className="prog-month">{MOIS[month - 1]}</span>
                  </div>
                  <div className="prog-info">
                    <span className="prog-titre">{c.titre}</span>
                    <span className="prog-sub">
                      {c.theme ? c.theme : 'Louange - Adoration - Predication'}
                      {c.predicateur && ` - ${c.predicateur}`}
                    </span>
                  </div>
                  <div className="prog-heure">{heure}</div>

                  {/* Badge selon statut */}
                  {statut === 'a_venir' && hasLive && (
                    <span className="prog-live-badge">Live prevu</span>
                  )}
                  {statut === 'a_venir' && !hasLive && (
                    <span className="prog-status-badge prog-status-badge--upcoming">A venir</span>
                  )}
                  {statut === 'en_cours' && hasLive && (
                    <span className="prog-live-badge prog-live-badge--active">
                      <span className="prog-live-dot" />En direct
                    </span>
                  )}
                  {statut === 'termine' && (
                    <span className="prog-status-badge prog-status-badge--ended">Termine</span>
                  )}

                  {/* Lecteur YouTube integre pour le culte en cours */}
                  {statut === 'en_cours' && embedUrl && (
                    <div className="prog-player-wrap" ref={liveContainerRef} id="live">
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
                            <span className="prog-player-play-btn">&#9654;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bouton externe si en cours mais pas YouTube (Zoom, etc.) */}
                  {statut === 'en_cours' && hasLive && !embedUrl && (
                    <div className="prog-player-wrap" id="live">
                      <p style={{ marginBottom: 12, color: 'var(--texte-doux)', fontSize: 13 }}>
                        Ce culte est diffuse sur une plateforme externe.
                      </p>
                      <a
                        href={c.lien_live}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prog-external-btn"
                      >
                        Rejoindre le live
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Anciens cultes / Replays */}
        {anciensCultes.length > 0 && (
          <div className="replays-section">
            <h3 className="replays-titre">Anciens <em>cultes</em></h3>
            <div className="replays-grid">
              {anciensCultes.map(c => {
                const replayUrl = c.replay_url || c.lien_live;
                const ytId = extractYoutubeId(replayUrl);
                const dateParis = parseDateParis(c.date_service, '12:00');
                const dateLabel = formatDateParis(dateParis, { day: 'numeric', month: 'long', year: 'numeric' });
                return (
                  <div className="replay-card" key={c.id} onClick={() => setSelectedCulte({ ...c, replay_url: replayUrl })}>
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

      {/* Modal replay */}
      {selectedCulte && (() => {
        const replayUrl = selectedCulte.replay_url || selectedCulte.lien_live;
        const replayEmbedUrl = getYoutubeEmbedUrl(replayUrl);
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
                  <a href={replayUrl} target="_blank" rel="noopener noreferrer" className="prog-external-btn">
                    Ouvrir le replay
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
