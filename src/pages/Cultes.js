import React, { useState, useEffect, useRef, useCallback } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getServices, getAnciensServices, getProchainService } from '../lib/public';
import { parseDateParis, formatDateParis } from '../lib/client';
import { extractYoutubeId, getYoutubeEmbedUrl } from '../lib/youtube';
import { getServiceStatut, getServiceStartTime, getCountdown, formatInTimezone } from '../lib/dateUtils';
import './Cultes.css';
import Icon from '../components/Icon';

const MOIS = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

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

  const prochainStatut = prochainService ? getServiceStatut(prochainService) : null;
  const prochainStartTime = prochainService ? getServiceStartTime(prochainService) : null;
  const timeToStart = prochainStartTime ? prochainStartTime.getTime() - Date.now() : Infinity;
  const showLiveSection = prochainStatut === 'en_cours' || (prochainStatut === 'a_venir' && timeToStart <= FIFTEEN_MIN_MS && timeToStart > 0);

  const hasLiveLink = prochainService?.lien_live?.trim();
  const embedUrl = hasLiveLink ? getYoutubeEmbedUrl(prochainService.lien_live) : null;

  return (
    <div>
      <SectionHeader label="Programme" title="Cultes" titleEm="dominicaux"
        subtitle="Rejoignez-nous en direct ou en replay" />

      <div className="cultes-wrap">

        {/* Section Live en haut */}
        {showLiveSection && prochainService && (
          <section className="live-section" id="live" ref={liveContainerRef}>
            <div className="live-section-header">
              {prochainStatut === 'en_cours' ? (
                <span className="live-badge live-badge--active">
                  <span className="live-badge-dot" />
                  EN DIRECT
                </span>
              ) : (
                <span className="live-badge live-badge--soon">
                  Commence dans {pad(Math.floor(timeToStart / 60000))}:{pad(Math.floor((timeToStart / 1000) % 60))}
                </span>
              )}
              <h2 className="live-section-title">{prochainService.titre}</h2>
              {prochainService.theme && <p className="live-section-theme">{prochainService.theme}</p>}
              {prochainService.predicateur && <p className="live-section-predicateur">Prédicateur : {prochainService.predicateur}</p>}
            </div>

            {embedUrl ? (
              <div className="live-player">
                <iframe
                  ref={livePlayerRef}
                  src={`${embedUrl}&autoplay=1`}
                  title={prochainService.titre}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {!isPlaying && prochainStatut !== 'en_cours' && (
                  <div className="live-player-overlay" onClick={handlePlayClick}>
                    <span className="live-player-play-btn"><Icon name="play" size={32} /></span>
                    <span className="live-player-text">Salle d'attente YouTube</span>
                  </div>
                )}
              </div>
            ) : hasLiveLink ? (
              <div className="live-external">
                <p>Ce culte est diffuse sur une plateforme externe.</p>
                <a
                  href={prochainService.lien_live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="live-external-btn"
                >
                  Rejoindre
                </a>
              </div>
            ) : null}
          </section>
        )}

        {/* Programme editorial */}
        <div className="prog-section">

          {prochainService && countdown.total > 0 && !showLiveSection && (
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

          {!loading && cultes.length === 0 && (
            <p className="prog-empty">Aucun culte programme pour l'instant.</p>
          )}
          <div className="prog-list">
            {cultes.map((c, i) => {
              const [year, month, day] = c.date_service.split('-').map(Number);
              const heure = `${(c.heure_debut || '10:00').slice(0,5)} - ${(c.heure_fin || '11:30').slice(0,5)}`;
              const hasLive = c.lien_live && c.lien_live.trim();
              const statut = getServiceStatut(c);

              return (
                <div className={`prog-row ${statut === 'en_cours' ? 'prog-row--live' : ''}`} key={c.id || i}>
                  <div className="prog-date">
                    <span className="prog-day">{day}</span>
                    <span className="prog-month">{MOIS[month - 1]}</span>
                  </div>
                  <div className="prog-info">
                    <span className="prog-titre">{c.titre}</span>
                    <span className="prog-sub">
                      {c.theme ? c.theme : 'Louange - Adoration - Prédication'}
                      {c.predicateur && ` - ${c.predicateur}`}
                    </span>
                  </div>
                  <div className="prog-heure">{heure}</div>

                  {statut === 'a_venir' && hasLive && (
                    <span className="prog-status-badge prog-status-badge--live-ready">Live prevu</span>
                  )}
                  {statut === 'a_venir' && !hasLive && (
                    <span className="prog-status-badge prog-status-badge--upcoming">A venir</span>
                  )}
                  {statut === 'en_cours' && (
                    <span className="prog-status-badge prog-status-badge--live">
                      <span className="prog-live-dot" />
                      EN DIRECT
                    </span>
                  )}
                  {statut === 'termine' && (
                    <span className="prog-status-badge prog-status-badge--ended">Termine</span>
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
                const hasReplay = replayUrl && replayUrl.trim();
                return (
                  <div
                    className={`replay-card ${hasReplay ? 'replay-card--clickable' : ''}`}
                    key={c.id}
                    onClick={() => hasReplay && setSelectedCulte({ ...c, replay_url: replayUrl })}
                  >
                    <div className="replay-thumb">
                      {ytId && <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={c.titre} />}
                      {hasReplay && (
                        <div className="replay-play-overlay">
                          <span className="replay-play-btn"><Icon name="play" size={24} /></span>
                        </div>
                      )}
                    </div>
                    <div className="replay-info">
                      <span className="replay-date">{dateLabel}</span>
                      <span className="replay-title">{c.titre}</span>
                      {hasReplay && <span className="replay-cta">Revoir</span>}
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
