import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import { createCheckoutSessionDon } from '../lib/stripe';
import './Dons.css';

export default function Dons() {
  const [searchParams] = useSearchParams();
  const annule = searchParams.get('annule') === '1';

  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getMontantNum = () => {
    const parsed = parseFloat(montant.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  const montantNum = getMontantNum();
  const valide = montantNum >= 1 && montantNum <= 5000;

  const handleChange = (e) => {
    const v = e.target.value;
    if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(v) || v === '') {
      setMontant(v);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valide || loading) return;

    setLoading(true);
    setError('');

    const result = await createCheckoutSessionDon({ montant_euros: montantNum });

    if (result.error) {
      if (result.status === 429) {
        setError('Trop de tentatives, réessaie dans quelques minutes.');
      } else if (result.status === 400) {
        setError(result.error);
      } else {
        setError('Une erreur est survenue. Réessaie plus tard.');
      }
      setLoading(false);
      return;
    }

    if (result.url) {
      window.location.href = result.url;
    } else {
      setError('Impossible de démarrer le paiement. Réessaie plus tard.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (annule) {
      const url = new URL(window.location.href);
      url.searchParams.delete('annule');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [annule]);

  const formatMontant = (val) => {
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div>
      <SectionHeader
        label="Soutien"
        title="Faire un"
        titleEm="don"
        subtitle="Participez à l'avancement de notre mission"
      />

      <div className="dons-page">
        {annule && (
          <div className="dons-annule-banner">
            Don annulé, tu peux réessayer quand tu veux.
          </div>
        )}

        <form className="dons-form" onSubmit={handleSubmit}>
          <p className="dons-intro">
            Vos dons soutiennent la vie et le ministère de l'Église Temple de la Célébration.
          </p>

          <div className="dons-field">
            <label className="dons-label" htmlFor="montant">Montant du don</label>
            <div className="dons-input-wrap">
              <input
                id="montant"
                type="text"
                inputMode="decimal"
                className="dons-input"
                placeholder="Ex : 20"
                value={montant}
                onChange={handleChange}
                maxLength={7}
                aria-label="Montant du don en euros"
              />
              <span className="dons-currency">€</span>
            </div>
          </div>

          {error && <div className="dons-error">{error}</div>}

          <button
            type="submit"
            className="dons-submit"
            disabled={!valide || loading}
          >
            {loading ? (
              'Redirection...'
            ) : valide ? (
              <>Faire un don de <strong>{formatMontant(montantNum)} €</strong></>
            ) : (
              'Faire un don'
            )}
          </button>

          <p className="dons-secure">
            Paiement sécurisé par Stripe. Nous ne voyons jamais ton numéro de carte.
          </p>
        </form>
      </div>
    </div>
  );
}
