import React, { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getCultes, getAnciensCultes, IS_MOCK } from '../lib/supabase';
import './Cultes.css';
import Icon from '../components/Icon';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const JOURS_SEMAINE = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

function getUpcomingSundays(n = 8) {
  const arr = []; const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  for (let i = 0; i < n; i++) { arr.push(new Date(d)); d.setDate(d.getDate() + 7); }
  return arr;
}

function getNextSunday10h() {
  const now = new Date();
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
  const total = Math.max(0, Math.floor((getNextSunday10h() - new Date()) / 1000));
  return {
    days: Math.floor(total / 86400),
    hrs:  Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
  };
}

function formatLiveDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function pad(n) { return String(n).padStart(2, '0'); }

function isLiveActif(culte) {
  const now = new Date();
  const dateCulte = new Date(culte.date_culte);

  const memeJour =
    now.getFullYear() === dateCulte.getFullYear() &&
    now.getMonth()    === dateCulte.getMonth()    &&
    now.getDate()     === dateCulte.getDate();

  if (!memeJour) return false;

  const [hDeb, mDeb] = (culte.heure_debut || '10:00').split(':').map(Number);
  const [hFin, mFin] = (culte.heure_fin   || '11:30').split(':').map(Number);

  const debut = new Date(dateCulte);
  debut.setHours(hDeb, mDeb - 15, 0);

  const fin = new Date(dateCulte);
  fin.setHours(hFin, mFin + 30, 0);

  return now >= debut && now <= fin;
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
      const liveActif = data.find(c => c.lien_live && isLiveActif(c));
      if (liveActif) { setLienLive(liveActif.lien_live); setLiveDate(liveActif.date_culte || ''); }
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

          {/* ── Section Live ────────────────────────────────────────── */}
          {!loading && lienLive && (
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
              <div className="live-player">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYtId(lienLive)}?autoplay=0&rel=0`}
                  title="Culte en direct"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
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
          )}

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
                const d = new Date(c.date_culte + 'T12:00:00');
                const heure = `${(c.heure_debut || '10:00').slice(0,5)} — ${(c.heure_fin || '11:30').slice(0,5)}`;
                return (
                  <div className="prog-row" key={c.id || i}>
                    <div className="prog-date">
                      <span className="prog-day">{d.getDate()}</span>
                      <span className="prog-month">{MOIS[d.getMonth()]}</span>
                    </div>
                    <div className="prog-info">
                      <span className="prog-titre">{c.titre}</span>
                      <span className="prog-sub">Louange · Adoration · Prédication</span>
                    </div>
                    <div className="prog-heure">{heure}</div>
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
                  const ytId = extractYtId(c.lien_live);
                  const d = new Date(c.date_culte + 'T12:00:00');
                  const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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
      {selectedCulte && (
        <div className="replay-modal-overlay" onClick={() => setSelectedCulte(null)}>
          <div className="replay-modal" onClick={e => e.stopPropagation()}>
            <div className="replay-modal-header">
              <span className="replay-modal-titre">{selectedCulte.titre}</span>
              <button className="replay-modal-close" onClick={() => setSelectedCulte(null)}><Icon name="x" size={16} /></button>
            </div>
            <div className="live-player">
              <iframe
                src={`https://www.youtube.com/embed/${extractYtId(selectedCulte.lien_live)}?autoplay=1&rel=0`}
                title={selectedCulte.titre}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function extractYtId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([^?&\s]+)/);
  return m ? m[1] : null;
}
