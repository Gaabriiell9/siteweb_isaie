import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEleve } from './EleveLayout';
import { getPaiements } from '../lib/eleve';
import { formatEuros, centsVersEuros } from '../lib/money';
import { createCheckoutSession } from '../lib/stripe';

const STATUT_CSS = {
  reussi:      'eleve-badge--green',
  en_attente:  'eleve-badge--orange',
  echec:       'eleve-badge--red',
  rembourse:   'eleve-badge--grey',
  paye:        'eleve-badge--green',
  a_venir:     'eleve-badge--grey',
};
const STATUT_LABEL = {
  reussi:     'Payé',
  en_attente: 'En attente',
  echec:      'Échec',
  rembourse:  'Remboursé',
  paye:       'Payé',
  a_venir:    'À venir',
};
const TYPE_LABEL = {
  integral:    'Paiement intégral',
  mensualite:  'Mensualite',
  remboursement: 'Remboursement',
};

export default function ElevePaiements() {
  const { eleve, refetch } = useEleve();
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const succes = searchParams.get('succes') === '1';
  const annule = searchParams.get('annule') === '1';

  const loadPaiements = useCallback(async () => {
    if (!eleve?.id) return;
    const data = await getPaiements(eleve.id);
    setPaiements(data || []);
    setLoading(false);
  }, [eleve?.id]);

  useEffect(() => {
    loadPaiements();
  }, [loadPaiements]);

  useEffect(() => {
    if (succes) {
      const timer = setTimeout(() => {
        loadPaiements();
        if (refetch) refetch();
      }, 2000);

      const clearParams = setTimeout(() => {
        setSearchParams({});
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearParams);
      };
    }
  }, [succes, loadPaiements, refetch, setSearchParams]);

  const handlePayer = async () => {
    setPaymentLoading(true);
    setPaymentError(null);

    const { url, error } = await createCheckoutSession();

    if (error) {
      setPaymentError(error);
      setPaymentLoading(false);
      return;
    }

    if (url) {
      window.location.href = url;
    } else {
      setPaymentError('URL de paiement non recue');
      setPaymentLoading(false);
    }
  };

  // Utiliser les donnees FIGEES sur l'eleve (pas de requete vers formules_paiement)
  const isEchelonne = eleve?.formule === 'echelonne';

  // Montants figes en centimes (depuis eleve.formule_*) ou fallback
  const prixTotalCents = eleve?.formule_prix_total_cents || (isEchelonne ? 50000 : 45000);
  const montantEcheanceCents = eleve?.formule_montant_echeance_cents || (isEchelonne ? 5000 : prixTotalCents);
  const nombreEcheances = eleve?.formule_nombre_echeances || (isEchelonne ? 10 : 1);
  const formuleNom = eleve?.formule_nom || (isEchelonne ? 'Echelonne' : 'Integral');

  // Total paye (paiements en centimes)
  const paiementsReussis = paiements.filter(p => p.statut === 'reussi' || p.statut === 'paye');
  const totalPayeCents = paiementsReussis.reduce((s, p) => s + Number(p.montant_cents || 0), 0);

  // Conversions pour affichage
  const prixTotalEuros = centsVersEuros(prixTotalCents);
  const montantEcheanceEuros = centsVersEuros(montantEcheanceCents);
  const totalPayeEuros = centsVersEuros(totalPayeCents);
  const restantDuEuros = Math.max(0, prixTotalEuros - totalPayeEuros);

  // Génération du planning pour formule échelonnée
  const planning = isEchelonne ? (() => {
    const dateDebut = eleve?.date_inscription ? new Date(eleve.date_inscription) : new Date();
    const now = new Date();

    return Array.from({ length: nombreEcheances }, (_, i) => {
      const dateEcheance = new Date(dateDebut);
      dateEcheance.setMonth(dateEcheance.getMonth() + i);

      // Chercher si un paiement existe pour cette échéance
      const paiementCorrespondant = paiements.find(p => {
        if (p.echeance_numero === i + 1) return true;
        const dp = new Date(p.date_paiement);
        return dp.getMonth() === dateEcheance.getMonth() &&
               dp.getFullYear() === dateEcheance.getFullYear();
      });

      let statut;
      if (paiementCorrespondant) {
        statut = paiementCorrespondant.statut === 'reussi' || paiementCorrespondant.statut === 'paye'
          ? 'paye'
          : paiementCorrespondant.statut;
      } else if (dateEcheance < now) {
        statut = 'en_attente';
      } else {
        statut = 'a_venir';
      }

      return {
        num: i + 1,
        date: dateEcheance.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        dateObj: dateEcheance,
        montant: montantEcheanceEuros,
        statut,
        paiementId: paiementCorrespondant?.id,
      };
    });
  })() : [];

  // Statut du paiement intégral
  const statutIntegral = paiementsReussis.length > 0 && totalPayeEuros >= prixTotalEuros
    ? 'paye'
    : 'en_attente';

  const getFormuleLabel = () => {
    if (isEchelonne) {
      return `${formuleNom} · ${formatEuros(montantEcheanceCents)}/mois × ${nombreEcheances}`;
    }
    return `${formuleNom} · ${formatEuros(prixTotalCents)}`;
  };

  if (loading) {
    return (
      <div>
        <h1 className="eleve-page-title">Mes <em>paiements</em></h1>
        <p style={{ color: 'var(--texte-doux)', fontStyle: 'italic' }}>Chargement…</p>
      </div>
    );
  }

  const peutPayer = restantDuEuros > 0 && (!isEchelonne || !eleve?.stripe_subscription_id);

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>paiements</em></h1>
      <p className="eleve-page-sub">{getFormuleLabel()}</p>

      {/* ── Message succes/annulation ── */}
      {succes && (
        <div className="eleve-card" style={{ background: 'rgba(29, 131, 72, 0.08)', borderColor: 'rgba(29, 131, 72, 0.3)', marginBottom: 20, padding: 16 }}>
          <p style={{ color: 'var(--statut-ok)', fontWeight: 500, margin: 0 }}>
            Paiement recu ! Mise a jour en cours...
          </p>
        </div>
      )}

      {annule && (
        <div className="eleve-card" style={{ background: 'rgba(200, 134, 10, 0.08)', borderColor: 'rgba(200, 134, 10, 0.3)', marginBottom: 20, padding: 16 }}>
          <p style={{ color: 'var(--or)', fontWeight: 500, margin: 0 }}>
            Paiement annule. Vous pouvez reessayer quand vous le souhaitez.
          </p>
        </div>
      )}

      {paymentError && (
        <div className="eleve-card" style={{ background: 'rgba(192, 57, 43, 0.08)', borderColor: 'rgba(192, 57, 43, 0.3)', marginBottom: 20, padding: 16 }}>
          <p style={{ color: 'var(--statut-erreur)', fontWeight: 500, margin: 0 }}>
            Erreur : {paymentError}
          </p>
        </div>
      )}

      {/* ── Bouton Payer ── */}
      {peutPayer && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={handlePayer}
            disabled={paymentLoading}
            className="btn-or"
            style={{ minWidth: 200 }}
          >
            {paymentLoading ? 'Redirection...' : `Payer ${isEchelonne ? 'la premiere echeance' : formatEuros(prixTotalCents)}`}
          </button>
          {isEchelonne && eleve?.stripe_subscription_id && (
            <p style={{ fontSize: 13, color: 'var(--texte-doux)', marginTop: 8 }}>
              Abonnement actif - les echeances suivantes seront prelevees automatiquement.
            </p>
          )}
        </div>
      )}

      {/* ── Résumé ── */}
      <div className="eleve-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Total réglé</div>
          <div className="eleve-stat-value">{totalPayeEuros}<span className="eleve-stat-unit"> €</span></div>
        </div>
        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Restant dû</div>
          <div className="eleve-stat-value">{restantDuEuros}<span className="eleve-stat-unit"> €</span></div>
        </div>
        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Versements</div>
          <div className="eleve-stat-value">
            {paiementsReussis.length}
            <span className="eleve-stat-unit"> / {nombreEcheances}</span>
          </div>
        </div>
      </div>

      {/* ── Historique des versements ── */}
      <div className="eleve-section-titre" style={{ marginBottom: 12 }}>Historique <em>des versements</em></div>
      <div className="eleve-card" style={{ padding: 0, marginBottom: 28 }}>
        {paiements.length === 0 ? (
          <p style={{ padding: 32, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--texte-doux)', textAlign: 'center', fontSize: 16 }}>
            Aucun paiement enregistré.
          </p>
        ) : (
          <div className="eleve-table-wrap">
            <table className="eleve-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Type</th>
                  <th>Méthode</th>
                  <th>Référence</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(p.date_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td><strong>{formatEuros(p.montant_cents)}</strong></td>
                    <td>{TYPE_LABEL[p.type_paiement] || p.type_paiement}</td>
                    <td>{p.methode || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--or)' }}>{p.reference || '—'}</td>
                    <td>
                      <span className={`eleve-badge ${STATUT_CSS[p.statut] || 'eleve-badge--grey'}`}>
                        {STATUT_LABEL[p.statut] || p.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Planning des mensualités (formule échelonnée) ── */}
      {isEchelonne && (
        <div className="eleve-paiement-planning">
          <div className="eleve-planning-titre">Planning des {nombreEcheances} mensualités</div>
          {planning.map(item => (
            <div className="eleve-planning-row" key={item.num}>
              <span className="eleve-planning-num">{String(item.num).padStart(2, '0')}</span>
              <span className="eleve-planning-date">{item.date}</span>
              <span className="eleve-planning-amount">{item.montant} €</span>
              <span className={`eleve-badge ${STATUT_CSS[item.statut] || 'eleve-badge--grey'}`} style={{ marginLeft: 8 }}>
                {STATUT_LABEL[item.statut] || item.statut}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Récapitulatif paiement intégral ── */}
      {!isEchelonne && (
        <div className="eleve-paiement-planning">
          <div className="eleve-planning-titre">Paiement intégral</div>
          <div className="eleve-planning-row">
            <span className="eleve-planning-num">01</span>
            <span className="eleve-planning-date">
              {paiementsReussis[0]
                ? new Date(paiementsReussis[0].date_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'En attente de paiement'}
            </span>
            <span className="eleve-planning-amount">{prixTotalEuros} €</span>
            <span className={`eleve-badge ${STATUT_CSS[statutIntegral]}`} style={{ marginLeft: 8 }}>
              {STATUT_LABEL[statutIntegral]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
