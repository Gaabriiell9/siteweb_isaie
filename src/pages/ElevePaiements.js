import React, { useEffect, useState } from 'react';
import { useEleve } from './EleveLayout';
import { getPaiements } from '../lib/supabase';

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
  mensualite:  'Mensualité',
  remboursement: 'Remboursement',
};

const formatEuros = (cents) => {
  if (!cents && cents !== 0) return '—';
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
};

export default function ElevePaiements() {
  const { eleve } = useEleve();
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eleve || !eleve.id) return;

    getPaiements(eleve.id).then(data => {
      setPaiements(data || []);
      setLoading(false);
    });
  }, [eleve]);

  // Utiliser les données FIGÉES sur l'élève (pas de requête vers formules_paiement)
  const isEchelonne = eleve?.formule_type === 'echelonne' || eleve?.formule === 'echelonne';

  // Montants figés en centimes (depuis eleve.formule_*) ou fallback
  const prixTotalCents = eleve?.formule_prix_total || (isEchelonne ? 50000 : 45000);
  const montantEcheanceCents = eleve?.formule_montant_echeance || (isEchelonne ? 5000 : prixTotalCents);
  const nombreEcheances = eleve?.formule_nombre_echeances || (isEchelonne ? 10 : 1);
  const formuleNom = eleve?.formule_nom || (isEchelonne ? 'Échelonné' : 'Intégral');

  // Total payé (paiements en euros)
  const paiementsReussis = paiements.filter(p => p.statut === 'reussi' || p.statut === 'paye');
  const totalPayeEuros = paiementsReussis.reduce((s, p) => s + Number(p.montant), 0);

  // Conversions pour affichage
  const prixTotalEuros = prixTotalCents / 100;
  const montantEcheanceEuros = montantEcheanceCents / 100;
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

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>paiements</em></h1>
      <p className="eleve-page-sub">{getFormuleLabel()}</p>

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
                    <td><strong>{p.montant} {p.devise || '€'}</strong></td>
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
