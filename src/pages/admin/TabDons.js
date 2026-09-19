import React, { useState, useEffect } from 'react';
import { getDonations } from '../../lib/admin';
import { formatEuros } from '../../lib/money';

export default function TabDons() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getDonations();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const donsSucceeded = donations.filter(d => d.statut === 'succeeded');
  const totalCents = donsSucceeded.reduce((sum, d) => sum + (d.montant_cents || 0), 0);

  const getStatutBadge = (statut) => {
    const styles = {
      succeeded: { bg: '#E8F5E9', color: '#2E7D32', label: 'Reussi' },
      pending: { bg: '#FFF3E0', color: '#E65100', label: 'En attente' },
      failed: { bg: '#FFEBEE', color: '#C62828', label: 'Echec' },
      refunded: { bg: '#ECEFF1', color: '#546E7A', label: 'Rembourse' }
    };
    const s = styles[statut] || { bg: '#ECEFF1', color: '#546E7A', label: statut };
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

  return (
    <div className="admin-tab">
      <h3>Dons recus</h3>
      <p style={{ fontSize: 12, color: 'var(--texte-doux)', marginBottom: 16 }}>
        Liste des dons (lecture seule). Les dons sont geres via Stripe.
      </p>

      {/* Resume */}
      <div style={{
        display: 'flex',
        gap: 24,
        padding: '16px 20px',
        background: 'var(--or-pale)',
        borderRadius: 8,
        marginBottom: 24
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--texte-doux)', marginBottom: 4 }}>Total reussi</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--vert)' }}>
            {formatEuros(totalCents)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--texte-doux)', marginBottom: 4 }}>Nombre de dons</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--vert)' }}>
            {donsSucceeded.length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--texte-doux)', marginBottom: 4 }}>Don moyen</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--vert)' }}>
            {donsSucceeded.length > 0 ? formatEuros(Math.round(totalCents / donsSucceeded.length)) : '0 EUR'}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="admin-empty">Chargement...</p>
      ) : donations.length === 0 ? (
        <p className="admin-empty">Aucun don enregistre.</p>
      ) : (
        <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--or-pale)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11, color: 'var(--texte-doux)' }}>Date</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11, color: 'var(--texte-doux)' }}>Donateur</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11, color: 'var(--texte-doux)' }}>Montant</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11, color: 'var(--texte-doux)' }}>Statut</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11, color: 'var(--texte-doux)' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(200, 134, 10, 0.1)' }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {d.date_don ? new Date(d.date_don).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500 }}>{d.nom_donateur || 'Anonyme'}</div>
                    {d.email && <div style={{ fontSize: 11, color: 'var(--texte-doux)' }}>{d.email}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                    {formatEuros(d.montant_cents)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {getStatutBadge(d.statut)}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--texte-doux)', maxWidth: 200 }}>
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
      )}
    </div>
  );
}
