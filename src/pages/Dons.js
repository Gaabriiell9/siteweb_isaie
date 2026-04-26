import React, { useState, useRef } from 'react';
import SectionHeader from '../components/SectionHeader';
import './Dons.css';

const PRESETS  = [10, 25, 50, 100, 200];
const MOTIFS   = [
  { value: 'general',  label: 'Soutien général' },
  { value: 'offrande', label: 'Offrande' },
  { value: 'dime',     label: 'Dîme' },
  { value: 'projet',   label: 'Projet' },
  { value: 'autre',    label: 'Autre' },
];

export default function Dons() {
  const [step, setStep]           = useState('landing'); // landing | form | done
  const [valeur, setValeur]       = useState('25');
  const [motif, setMotif]         = useState('general');
  const [autreMotif, setAutreMotif] = useState('');
  const inputRef = useRef(null);

  const montantNum  = parseFloat(valeur) || 0;
  const valide      = montantNum >= 1;

  const choisir = (n) => { setValeur(String(n)); inputRef.current?.focus(); };

  const handleInput = (e) => {
    const v = e.target.value.replace(/[^0-9]/g, '');
    setValeur(v);
  };

  const handleSubmit = (e) => { e.preventDefault(); if (valide) setStep('done'); };

  const reset = () => { setStep('landing'); setValeur('25'); setMotif('general'); setAutreMotif(''); };

  if (step === 'done') return (
    <div>
      <SectionHeader label="Soutien" title="Faire un" titleEm="don" />
      <div className="dons-done-page">
        <div className="dons-done-amount">
          <span>{montantNum}</span>
          <sup>€</sup>
        </div>
        <div className="dons-done-sep" />
        <p className="dons-done-msg">Merci pour votre générosité.</p>
        <p className="dons-done-sub">
          Le paiement en ligne est en cours de mise en place.
          Contactez l'église pour les modalités actuelles.
        </p>
        <button className="dons-done-reset" onClick={reset}>Nouveau don</button>
      </div>
    </div>
  );

  if (step === 'landing') return (
    <div>
      <SectionHeader
        label="Soutien"
        title="Faire un"
        titleEm="don"
        subtitle="Participez à l'avancement de notre mission"
      />
      <div className="dons-landing-page">
        <div className="dons-landing-inner">
          <p className="dons-landing-text">
            Vos dons soutiennent la vie et le ministère<br />de l'Église Temple de la Célébration.
          </p>
          <button className="dons-landing-btn" onClick={() => setStep('form')}>
            Faire un don
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <p className="dons-landing-note">Paiement sécurisé · Reçu sur demande</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader
        label="Soutien"
        title="Faire un"
        titleEm="don"
        subtitle="Participez à l'avancement de notre mission"
      />

      <form className="dons-page" onSubmit={handleSubmit}>

        <div className="dons-form-topbar">
          <button type="button" className="dons-back" onClick={reset}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Retour
          </button>
        </div>

        {/* ── Zone montant ── */}
        <div className="dons-amount-zone">
          <label className="dons-amount-eyebrow">Montant de votre don</label>
          <div className="dons-amount-display" onClick={() => inputRef.current?.focus()}>
            <input
              ref={inputRef}
              className="dons-amount-input"
              type="text"
              inputMode="numeric"
              value={valeur}
              onChange={handleInput}
              maxLength={6}
              autoFocus
            />
            <span className="dons-amount-currency">€</span>
          </div>
          <div className="dons-presets">
            {PRESETS.map(n => (
              <button
                key={n}
                type="button"
                className={`dons-preset${valeur === String(n) ? ' active' : ''}`}
                onClick={() => choisir(n)}
              >
                {n} €
              </button>
            ))}
          </div>
        </div>

        {/* ── Séparateur ── */}
        <div className="dons-divider">
          <span />
          <span className="dons-divider-diamond" />
          <span />
        </div>

        {/* ── Destination ── */}
        <div className="dons-dest-zone">
          <label className="dons-dest-eyebrow">Destination</label>
          <div className="dons-motifs">
            {MOTIFS.map(m => (
              <button
                key={m.value}
                type="button"
                className={`dons-motif${motif === m.value ? ' active' : ''}`}
                onClick={() => setMotif(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
          {motif === 'autre' && (
            <input
              className="dons-autre"
              type="text"
              placeholder="Précisez le motif…"
              value={autreMotif}
              onChange={e => setAutreMotif(e.target.value)}
              maxLength={80}
            />
          )}
        </div>

        {/* ── Submit ── */}
        <div className="dons-submit-zone">
          <button type="submit" className="dons-submit" disabled={!valide}>
            <span>Confirmer</span>
            {valide && <strong>{montantNum} €</strong>}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <p className="dons-submit-note">Paiement sécurisé · Reçu sur demande</p>
        </div>

      </form>
    </div>
  );
}
