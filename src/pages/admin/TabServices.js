import React, { useState, useEffect } from 'react';
import { getAllServices, addService, updateService, deleteService } from '../../lib/admin';
import AdminActionButtons from '../../components/AdminActionButtons';
import { getServiceStatut } from '../../lib/dateUtils';

const TYPES = [
  { value: 'culte', label: 'Culte' },
  { value: 'evenement', label: 'Evenement' }
];

export default function TabServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    type: 'culte',
    titre: '',
    description: '',
    date_service: '',
    heure_debut: '10:00',
    heure_fin: '11:30',
    lieu: '',
    predicateur: '',
    theme: '',
    lien_live: '',
    replay_url: '',
    visible: true
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterType, setFilterType] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await getAllServices();
    setServices(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const resetForm = () => {
    setForm({
      type: 'culte',
      titre: '',
      description: '',
      date_service: '',
      heure_debut: '10:00',
      heure_fin: '11:30',
      lieu: '',
      predicateur: '',
      theme: '',
      lien_live: '',
      replay_url: '',
      visible: true
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.date_service) {
      showMsg('Titre et date requis');
      return;
    }

    setSaving(true);
    const payload = {
      type: form.type,
      titre: form.titre,
      description: form.description || null,
      date_service: form.date_service,
      heure_debut: form.heure_debut || null,
      heure_fin: form.heure_fin || null,
      lieu: form.lieu || null,
      predicateur: form.predicateur || null,
      theme: form.theme || null,
      lien_live: form.lien_live || null,
      replay_url: form.replay_url || null,
      visible: form.visible
    };

    let result;
    if (editingId) {
      result = await updateService(editingId, payload);
    } else {
      result = await addService(payload);
    }

    setSaving(false);
    if (result.error) {
      if (result.error.code === '42501') {
        showMsg('Action non autorisee');
      } else {
        showMsg('Erreur: ' + result.error.message);
      }
      return;
    }

    showMsg(editingId ? 'Service mis a jour' : 'Service ajoute');
    resetForm();
    load();
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      type: s.type || 'culte',
      titre: s.titre || '',
      description: s.description || '',
      date_service: s.date_service || '',
      heure_debut: s.heure_debut || '10:00',
      heure_fin: s.heure_fin || '11:30',
      lieu: s.lieu || '',
      predicateur: s.predicateur || '',
      theme: s.theme || '',
      lien_live: s.lien_live || '',
      replay_url: s.replay_url || '',
      visible: s.visible !== false
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    const { error } = await deleteService(id);
    if (error) {
      if (error.code === '42501') {
        showMsg('Action non autorisee');
      } else {
        showMsg('Erreur: ' + error.message);
      }
      return;
    }
    showMsg('Service supprime');
    load();
  };

  const toggleVisible = async (s) => {
    const { error } = await updateService(s.id, { visible: !s.visible });
    if (error) {
      showMsg('Erreur: ' + error.message);
      return;
    }
    load();
  };

  const filteredServices = filterType
    ? services.filter(s => s.type === filterType)
    : services;

  return (
    <div className="admin-tab">
      <h3>{editingId ? 'Modifier le culte' : 'Programmer un culte'}</h3>

      <form onSubmit={handleSubmit} className="admin-form">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            style={{ flex: '0 0 140px' }}
          >
            {TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            required
            placeholder="Titre *"
            value={form.titre}
            onChange={e => setForm({ ...form, titre: e.target.value })}
            style={{ flex: 1 }}
          />
        </div>

        <textarea
          placeholder="Description"
          rows={2}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--texte-doux)' }}>Date *</label>
            <input
              type="date"
              required
              value={form.date_service}
              onChange={e => setForm({ ...form, date_service: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--texte-doux)' }}>Debut</label>
            <input
              type="time"
              value={form.heure_debut}
              onChange={e => setForm({ ...form, heure_debut: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--texte-doux)' }}>Fin</label>
            <input
              type="time"
              value={form.heure_fin}
              onChange={e => setForm({ ...form, heure_fin: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            placeholder="Lieu"
            value={form.lieu}
            onChange={e => setForm({ ...form, lieu: e.target.value })}
            style={{ flex: 1 }}
          />
          <input
            placeholder="Predicateur"
            value={form.predicateur}
            onChange={e => setForm({ ...form, predicateur: e.target.value })}
            style={{ flex: 1 }}
          />
        </div>

        <input
          placeholder="Theme"
          value={form.theme}
          onChange={e => setForm({ ...form, theme: e.target.value })}
        />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            placeholder="Lien live (YouTube, Zoom...)"
            value={form.lien_live}
            onChange={e => setForm({ ...form, lien_live: e.target.value })}
            style={{ flex: 1 }}
          />
          <input
            placeholder="URL replay"
            value={form.replay_url}
            onChange={e => setForm({ ...form, replay_url: e.target.value })}
            style={{ flex: 1 }}
          />
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.visible}
            onChange={e => setForm({ ...form, visible: e.target.checked })}
          />
          Visible sur le site
        </label>

        {msg && <div className={`admin-msg ${msg.includes('Erreur') || msg.includes('non autorisee') ? 'err' : 'ok'}`}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" className="admin-btn-secondary" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <h3>Services ({filteredServices.length})</h3>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ fontSize: 12, padding: '4px 8px' }}
        >
          <option value="">Tous</option>
          {TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="admin-empty">Chargement...</p>
      ) : filteredServices.length === 0 ? (
        <p className="admin-empty">Aucun service.</p>
      ) : (
        <div className="admin-list">
          {filteredServices.map(s => {
            const statut = getServiceStatut(s);
            const hasLive = s.lien_live && s.lien_live.trim();
            return (
              <div className={`admin-item ${!s.visible ? 'admin-item--inactive' : ''}`} key={s.id}>
                <div className="admin-item-info">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: s.type === 'culte' ? 'var(--or-pale)' : '#E8F5E9',
                      color: s.type === 'culte' ? 'var(--bordeaux)' : '#2E7D32',
                    }}>
                      {s.type?.toUpperCase()}
                    </span>
                    {s.titre}
                    {statut === 'en_cours' && (
                      <span style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: 'rgba(180,35,24,0.1)',
                        color: '#b42318',
                        fontWeight: 700,
                      }}>EN DIRECT</span>
                    )}
                    {statut === 'a_venir' && (
                      <span style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: 'rgba(100,100,100,0.08)',
                        color: 'var(--texte-doux)',
                      }}>A VENIR</span>
                    )}
                    {statut === 'termine' && (
                      <span style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: 'transparent',
                        color: '#999',
                        border: '1px solid #ddd',
                      }}>TERMINE</span>
                    )}
                    {hasLive && (
                      <span style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: 'rgba(39,174,96,0.1)',
                        color: '#27ae60',
                      }}>Live pret</span>
                    )}
                  </strong>
                  <span style={{ fontSize: 12, color: 'var(--texte-doux)' }}>
                    {s.theme && `Theme: ${s.theme} - `}
                    {s.predicateur && `${s.predicateur}`}
                  </span>
                  <span className="admin-date">
                    {new Date(s.date_service).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}
                    {s.heure_debut?.slice(0, 5)} - {s.heure_fin?.slice(0, 5)}
                    {!s.visible && <span style={{ marginLeft: 8, color: '#999' }}>(masque)</span>}
                  </span>
                </div>
                <AdminActionButtons
                  item={s}
                  onToggleVisible={toggleVisible}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  deleteLabel="Supprimer ce service"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
