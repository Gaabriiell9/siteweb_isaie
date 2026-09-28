import React, { useState, useEffect } from 'react';
import { getAllCellGroups, addCellGroup, updateCellGroup, deleteCellGroup } from '../../lib/admin';
import AdminActionButtons from '../../components/AdminActionButtons';
import { LABELS } from '../../lib/constants';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function TabCellules() {
  const [cellules, setCellules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    lieu: '',
    lien_reunion: '',
    jour_semaine: 'Mercredi',
    heure_debut: '19:00',
    heure_fin: '21:00',
    responsable_nom: '',
    responsable_contact: '',
    description: '',
    visible: true
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await getAllCellGroups();
    setCellules(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const resetForm = () => {
    setForm({
      nom: '',
      lieu: '',
      lien_reunion: '',
      jour_semaine: 'Mercredi',
      heure_debut: '19:00',
      heure_fin: '21:00',
      responsable_nom: '',
      responsable_contact: '',
      description: '',
      visible: true
    });
    setEditingId(null);
  };

  const isValidUrl = (str) => {
    if (!str) return true;
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      showMsg('Le nom est requis');
      return;
    }
    if (form.lien_reunion && !isValidUrl(form.lien_reunion)) {
      showMsg('Le lien de réunion doit être une URL valide');
      return;
    }

    setSaving(true);
    const payload = {
      nom: form.nom,
      lieu: form.lieu || null,
      lien_reunion: form.lien_reunion || null,
      jour_semaine: form.jour_semaine,
      heure_debut: form.heure_debut || null,
      heure_fin: form.heure_fin || null,
      responsable_nom: form.responsable_nom || null,
      responsable_contact: form.responsable_contact || null,
      description: form.description || null,
      visible: form.visible
    };

    let result;
    if (editingId) {
      result = await updateCellGroup(editingId, payload);
    } else {
      result = await addCellGroup(payload);
    }

    setSaving(false);
    if (result.error) {
      if (result.error.code === '42501') {
        showMsg('Action non autorisée');
      } else {
        showMsg('Erreur : ' + result.error.message);
      }
      return;
    }

    showMsg(editingId ? 'Cellule mise à jour' : 'Cellule ajoutée');
    resetForm();
    load();
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      nom: c.nom || '',
      lieu: c.lieu || '',
      lien_reunion: c.lien_reunion || '',
      jour_semaine: c.jour_semaine || 'Mercredi',
      heure_debut: c.heure_debut || '19:00',
      heure_fin: c.heure_fin || '21:00',
      responsable_nom: c.responsable_nom || '',
      responsable_contact: c.responsable_contact || '',
      description: c.description || '',
      visible: c.visible !== false
    });
  };

  const handleDelete = async (id) => {
    const { error } = await deleteCellGroup(id);
    if (error) {
      if (error.code === '42501') {
        showMsg('Action non autorisée');
      } else {
        showMsg('Erreur : ' + error.message);
      }
      return;
    }
    showMsg('Cellule supprimée');
    load();
  };

  const toggleVisible = async (c) => {
    const { error } = await updateCellGroup(c.id, { visible: !c.visible });
    if (error) {
      showMsg('Erreur : ' + error.message);
      return;
    }
    load();
  };

  return (
    <div className="admin-tab">
      <h3>{editingId ? 'Modifier la cellule' : 'Nouvelle cellule'}</h3>

      <form onSubmit={handleSubmit} className="admin-form">
        <input
          required
          placeholder="Nom de la cellule *"
          value={form.nom}
          onChange={e => setForm({ ...form, nom: e.target.value })}
        />

        <input
          placeholder="Lieu (ex: En ligne)"
          value={form.lieu}
          onChange={e => setForm({ ...form, lieu: e.target.value })}
        />

        <div>
          <input
            type="url"
            placeholder="https://zoom.us/j/... ou https://chat.whatsapp.com/..."
            value={form.lien_reunion}
            onChange={e => setForm({ ...form, lien_reunion: e.target.value })}
          />
          <span style={{ fontSize: 11, color: 'var(--encre-douce)', marginTop: 4, display: 'block' }}>
            Les fidèles utiliseront ce lien pour rejoindre la cellule.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--texte-doux)' }}>Jour</label>
            <select
              value={form.jour_semaine}
              onChange={e => setForm({ ...form, jour_semaine: e.target.value })}
            >
              {JOURS.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
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
            placeholder="Nom du responsable"
            value={form.responsable_nom}
            onChange={e => setForm({ ...form, responsable_nom: e.target.value })}
            style={{ flex: 1 }}
          />
          <input
            placeholder="Contact (tel, email)"
            value={form.responsable_contact}
            onChange={e => setForm({ ...form, responsable_contact: e.target.value })}
            style={{ flex: 1 }}
          />
        </div>

        <textarea
          placeholder="Description"
          rows={2}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.visible}
            onChange={e => setForm({ ...form, visible: e.target.checked })}
          />
          Visible sur le site
        </label>

        {msg && <div className={`admin-msg ${msg.includes('Erreur') || msg.includes('non autorisée') ? 'err' : 'ok'}`}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" className="admin-btn-secondary" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <h3 style={{ marginTop: 24 }}>Cellules ({cellules.length})</h3>

      {loading ? (
        <p className="admin-empty">Chargement...</p>
      ) : cellules.length === 0 ? (
        <p className="admin-empty">Aucune cellule.</p>
      ) : (
        <div className="admin-list">
          {cellules.map(c => (
            <div className={`admin-item ${!c.visible ? 'admin-item--inactive' : ''}`} key={c.id}>
              <div className="admin-item-info">
                <strong>{c.nom}</strong>
                <span style={{ fontSize: 12, color: 'var(--texte-doux)' }}>
                  {c.lieu && `${c.lieu} - `}
                  {c.responsable_nom && `Resp : ${c.responsable_nom}`}
                </span>
                <span className="admin-date">
                  {c.jour_semaine} {c.heure_debut?.slice(0, 5)} - {c.heure_fin?.slice(0, 5)}
                  {c.lien_reunion && ' (en ligne)'}
                  {!c.visible && <span style={{ marginLeft: 8, color: 'var(--encre-douce)' }}>(masquée)</span>}
                </span>
              </div>
              <AdminActionButtons
                item={c}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                onDelete={handleDelete}
                deleteLabel="Supprimer cette cellule"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
