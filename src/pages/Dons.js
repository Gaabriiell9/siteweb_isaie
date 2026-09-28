import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import { createCheckoutSessionDon } from '../lib/stripe';
import './Dons.css';

const MONTANTS_SUGGERES = [10, 20, 50, 100];
const MONTANT_MIN = 1;
const MONTANT_MAX = 5000;
const MESSAGE_MAX = 280;

export default function Dons() {
  const [searchParams] = useSearchParams();
  const annule = searchParams.get('annule') === '1';

  const [montantSuggere, setMontantSuggere] = useState(null);
  const [montantLibre, setMontantLibre] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef(null);

  // Montant final en euros
  const getMontant = () => {
    if (montantSuggere !== null) return montantSuggere;
    const parsed = parseFloat(montantLibre.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  const montant = getMontant();
  const valide = montant >= MONTANT_MIN && montant <= MONTANT_MAX;

  const handleSuggereClick = (val) => {
    setMontantSuggere(val);
    setMontantLibre('');
    setError('');
  };

  const handleLibreChange = (e) => {
    const v = e.target.value;
    // Accepter chiffres, virgule et point
    if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(v) || v === '') {
      setMontantLibre(v);
      setMontantSuggere(null);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valide || loading) return;

    setLoading(true);
    setError('');

    const donData = {
      montant_euros: montant,
    };

    if (nom.trim()) donData.nom = nom.trim().slice(0, 100);
    if (email.trim()) donData.email = email.trim();
    if (message.trim()) donData.message = message.trim().slice(0, MESSAGE_MAX);

    const result = await createCheckoutSessionDon(donData);

    if (result.error) {
      if (result.status === 429) {
        setError('Trop de tentatives, reessaie dans quelques minutes.');
      } else if (result.status === 400) {
        setError(result.error);
      } else {
        setError('Une erreur est survenue. Reessaie plus tard.');
      }
      setLoading(false);
      return;
    }

    if (result.url) {
      window.location.href = result.url;
    } else {
      setError('Impossible de demarrer le paiement. Reessaie plus tard.');
      setLoading(false);
    }
  };

  // Reset annule flag apres affichage
  useEffect(() => {
    if (annule) {
      const url = new URL(window.location.href);
      url.searchParams.delete('annule');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [annule]);

  return (
    <div>
      <SectionHeader
        label="Soutien"
        title="Faire un"
        titleEm="don"
        subtitle="Participez a l'avancement de notre mission"
      />

      <div className="dons-page">
        {annule && (
          <div className="dons-annule-banner">
            Don annule, tu peux reessayer quand tu veux.
          </div>
        )}

        <form className="dons-form" onSubmit={handleSubmit}>
          {/* Intro */}
          <p className="dons-intro">
            Vos dons soutiennent la vie et le ministere de l'Eglise Temple de la Celebration.
          </p>

          {/* Montants suggeres */}
          <div className="dons-section">
            <label className="dons-label">Montant du don</label>
            <div className="dons-presets">
              {MONTANTS_SUGGERES.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`dons-preset ${montantSuggere === val ? 'active' : ''}`}
                  onClick={() => handleSuggereClick(val)}
                >
                  {val} EUR
                </button>
              ))}
            </div>

            {/* Montant libre */}
            <div className="dons-libre-wrap">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                className={`dons-libre-input ${montantSuggere === null && montantLibre ? 'active' : ''}`}
                placeholder="Autre montant"
                value={montantLibre}
                onChange={handleLibreChange}
                maxLength={7}
                aria-label="Montant libre en euros"
              />
              <span className="dons-libre-currency">EUR</span>
            </div>
            <p className="dons-hint">Minimum 1 EUR, maximum 5 000 EUR</p>
          </div>

          {/* Champs facultatifs */}
          <div className="dons-section">
            <label className="dons-label">Informations (facultatif)</label>

            <input
              type="text"
              className="dons-input"
              placeholder="Ton nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={100}
            />

            <input
              type="email"
              className="dons-input"
              placeholder="Ton email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="dons-hint">Pour recevoir un recu de Stripe</p>

            <div className="dons-textarea-wrap">
              <textarea
                className="dons-textarea"
                placeholder="Un message (facultatif)"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
                maxLength={MESSAGE_MAX}
                rows={3}
              />
              <span className="dons-textarea-count">{message.length}/{MESSAGE_MAX}</span>
            </div>
          </div>

          {/* Erreur */}
          {error && <div className="dons-error">{error}</div>}

          {/* Bouton */}
          <button
            type="submit"
            className="dons-submit"
            disabled={!valide || loading}
          >
            {loading ? (
              'Redirection...'
            ) : (
              <>
                <span>Faire un don de</span>
                <strong>{montant.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} EUR</strong>
              </>
            )}
          </button>

          <p className="dons-secure">
            Paiement securise par Stripe. Nous ne voyons jamais ton numero de carte.
          </p>
        </form>
      </div>
    </div>
  );
}
