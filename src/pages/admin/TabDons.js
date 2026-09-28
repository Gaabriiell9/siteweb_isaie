import React, { useState, useEffect } from 'react';
import { getDonations } from '../../lib/admin';
import { formatEuros } from '../../lib/money';

const PAGE_SIZE = 20;

export default function TabDons() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    const data = await getDonations();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const donsSucceeded = donations.filter(d => d.statut === 'succeeded');
  const totalCents = donsSucceeded.reduce((sum, d) => sum + (d.montant_cents || 0), 0);

  const totalPages = Math.ceil(donations.length / PAGE_SIZE);
  const paginatedDons = donations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStatutBadge = (statut) => {
    const styles = {
      succeeded: { bg: 'rgba(29, 131, 72, 0.1)', color: 'var(--statut-ok)', label: 'Reussi' },
      pending: { bg: 'var(--or-pale)', color: 'var(--or)', label: 'En attente' },
      failed: { bg: 'rgba(192, 57, 43, 0.1)', color: 'var(--statut-erreur)', label: 'Echec' },
      refunded: { bg: 'rgba(100, 100, 100, 0.1)', color: 'var(--texte-doux)', label: 'Rembourse' }
    };
    const s = styles[statut] || { bg: 'rgba(100, 100, 100, 0.1)', color: 'var(--texte-doux)', label: statut };
    return (
      <span style={{
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 3,
        background: s.bg,
        color: s.color,
        fontWeight: 600
      }}>
        {s.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="admin-tab">
      <h3>Dons recus</h3>
      <p style={{ fontSize: 12, color: 'var(--texte-doux)', marginBottom: 16 }}>
        Liste des dons (lecture seule). Les remboursements se font dans le tableau de bord Stripe.
      </p>

      {/* Resume */}
      <div className="admin-dons-resume">
        <div className="admin-dons-stat">
          <div className="admin-dons-stat-label">Total reussi</div>
          <div className="admin-dons-stat-value">{formatEuros(totalCents)}</div>
        </div>
        <div className="admin-dons-stat">
          <div className="admin-dons-stat-label">Nombre de dons</div>
          <div className="admin-dons-stat-value">{donsSucceeded.length}</div>
        </div>
        <div className="admin-dons-stat">
          <div className="admin-dons-stat-label">Don moyen</div>
          <div className="admin-dons-stat-value">
            {donsSucceeded.length > 0 ? formatEuros(Math.round(totalCents / donsSucceeded.length)) : '0 EUR'}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="admin-empty">Chargement...</p>
      ) : donations.length === 0 ? (
        <p className="admin-empty">Aucun don pour l'instant.</p>
      ) : (
        <>
          {/* Tableau desktop */}
          <div className="admin-dons-table-wrap">
            <table className="admin-dons-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Donateur</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDons.map(d => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(d.date_don)}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.nom_donateur || 'Anonyme'}</div>
                      {d.email && <div style={{ fontSize: 11, color: 'var(--texte-doux)' }}>{d.email}</div>}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatEuros(d.montant_cents)}</td>
                    <td>{getStatutBadge(d.statut)}</td>
                    <td style={{ fontSize: 12, color: 'var(--texte-doux)', maxWidth: 200 }}>
                      {d.message ? (
                        <span title={d.message}>
                          {d.message.slice(0, 50)}{d.message.length > 50 ? '...' : ''}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="admin-dons-cards">
            {paginatedDons.map(d => (
              <div key={d.id} className="admin-dons-card">
                <div className="admin-dons-card-header">
                  <span className="admin-dons-card-amount">{formatEuros(d.montant_cents)}</span>
                  {getStatutBadge(d.statut)}
                </div>
                <div className="admin-dons-card-name">{d.nom_donateur || 'Anonyme'}</div>
                {d.email && <div className="admin-dons-card-email">{d.email}</div>}
                <div className="admin-dons-card-date">{formatDate(d.date_don)}</div>
                {d.message && (
                  <div className="admin-dons-card-message">
                    {d.message.slice(0, 100)}{d.message.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-dons-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="admin-btn-secondary"
              >
                Precedent
              </button>
              <span className="admin-dons-page-info">
                Page {page} sur {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="admin-btn-secondary"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .admin-dons-resume {
          display: flex;
          gap: 24px;
          padding: 16px 20px;
          background: var(--or-pale);
          border-radius: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .admin-dons-stat-label {
          font-size: 11px;
          color: var(--texte-doux);
          margin-bottom: 4px;
        }
        .admin-dons-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--vert);
        }
        .admin-dons-table-wrap {
          overflow-x: auto;
        }
        .admin-dons-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .admin-dons-table th {
          padding: 8px 12px;
          font-weight: 600;
          font-size: 11px;
          color: var(--texte-doux);
          text-align: left;
          border-bottom: 2px solid var(--or-pale);
        }
        .admin-dons-table td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(200, 134, 10, 0.1);
        }
        .admin-dons-cards {
          display: none;
        }
        .admin-dons-card {
          background: var(--blanc);
          border: 1px solid rgba(200, 134, 10, 0.15);
          padding: 16px;
          margin-bottom: 12px;
        }
        .admin-dons-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .admin-dons-card-amount {
          font-size: 18px;
          font-weight: 700;
          color: var(--vert);
        }
        .admin-dons-card-name {
          font-weight: 500;
          margin-bottom: 2px;
        }
        .admin-dons-card-email {
          font-size: 12px;
          color: var(--texte-doux);
          margin-bottom: 4px;
        }
        .admin-dons-card-date {
          font-size: 11px;
          color: var(--texte-doux);
        }
        .admin-dons-card-message {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(200, 134, 10, 0.1);
          font-size: 12px;
          color: var(--texte-doux);
          font-style: italic;
        }
        .admin-dons-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }
        .admin-dons-page-info {
          font-size: 12px;
          color: var(--texte-doux);
        }
        @media (max-width: 768px) {
          .admin-dons-table-wrap {
            display: none;
          }
          .admin-dons-cards {
            display: block;
          }
          .admin-dons-resume {
            gap: 16px;
          }
          .admin-dons-stat-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
