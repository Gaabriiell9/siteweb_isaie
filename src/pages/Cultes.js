import React, { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getCultes, getAnciensCultes, IS_MOCK, getNowParis, parseDateParis, formatDateParis } from '../lib/supabase';
import { extractYoutubeId, getYoutubeEmbedUrl, isYoutubeUrl } from '../lib/youtube';
import './Cultes.css';
import Icon from '../components/Icon';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const JOURS_SEMAINE = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

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

function formatLiveDate(dateStr) {
  if (!dateStr) return '';
  const date = parseDateParis(dateStr, '12:00');
  return formatDateParis(date, { day: 'numeric', month: 'long', year: 'numeric' });
}

function pad(n) { return String(n).padStart(2, '0'); }

/**
 * Calcule l'état d'un culte par rapport à l'heure actuelle (Europe/Paris)
 * @returns {'a_venir' | 'en_cours' | 'termine'}
 */
function getCulteEtat(culte) {
  const now = getNowParis();
  const [y, m, d] = culte.date_culte.split('-').map(Number);

  // Construire les timestamps de début et fin en heure Paris
  const [hDeb, mDeb] = (culte.heure_debut || '10:00').split(':').map(Number);
  const [hFin, mFin] = (culte.heure_fin || '11:30').split(':').map(Number);

  // Date de début (15 min avant pour permettre l'accès anticipé)
  const debut = new Date(y, m - 1, d, hDeb, mDeb - 15, 0);
  // Date de fin (30 min après pour le temps de clôture)
  const fin = new Date(y, m - 1, d, hFin, mFin + 30, 0);

  if (now < debut) return 'a_venir';
  if (now > fin) return 'termine';
  return 'en_cours';
}

export default function Cultes() {
  const [cultes,        setCultes]        = useState([]);
  const [lienLive,      setLienLive]      = useState('');
  const [liveDate,      setLiveDate]      = useState('');
  const [loading,       setLoading]       = useState(true);
  const [cd,            setCd]            = useState(calcCd());
  const [copied,        setCopied]        = useState(false);
  const [anciensCultes, setAnciensCultes] = useState([]);
  const [selectedCulte, setSelectedCulte] = useState(null);

  useEffect(() => {
    getCultes('culte').then(data => {
      setCultes(data);
      // Trouver un culte en cours avec un lien live
      const culteEnCours = data.find(c => c.lien_live && getCulteEtat(c) === 'en_cours');
      if (culteEnCours) {
        setLienLive(culteEnCours.lien_live);
        setLiveDate(culteEnCours.date_culte || '');
      }
      setLoading(false);
    });
    getAnciensCultes().then(setAnciensCultes);
  }, []);

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

          {/* ── Section Live (culte en cours) ─────────────────────────── */}
          {!loading && lienLive && (() => {
            const embedUrl = getYoutubeEmbedUrl(lienLive);
            return (
              <div className="live-section">
                <div className="live-top-row">
                  <span className="live-badge">
                    <span className="live-dot-red" />
                    EN DIRECT
                  </span>
                  {liveDate && (
                    <span className="live-top-date">
                      {formatLiveDate(liveDate)} · 10h00
                    </span>
                  )}
                </div>
                <h3 className="live-titre">Culte du <em>Dimanche</em></h3>
                <p className="live-sous-titre">Louange · Adoration · Prédication</p>

                {/* Si YouTube : iframe intégré */}
                {embedUrl ? (
                  <div className="live-player">
                    <iframe
                      src={embedUrl}
                      title="Culte en direct"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  /* Sinon : bouton externe (Zoom ou autre) */
                  <a
                    href={lienLive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="live-external-btn"
                  >
                    🔗 Rejoindre le live
                  </a>
                )}

                <div className="live-footer">
                  <span className="live-footer-item">Dimanche · 10h00</span>
                  <div className="live-losange" />
                  <span className="live-footer-item">En ligne</span>
                  <div className="live-losange" />
                  <button className="live-share-btn" onClick={handleShare}>
                    {copied ? 'Lien copié !' : 'Partager'}
                  </button>
                </div>
              </div>
            );
          })()}

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
                const etat = getCulteEtat(c);
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
                      <div className="prog-player-wrap">
                        <div className="prog-player">
                          <iframe
                            src={embedUrl}
                            title={c.titre}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
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
