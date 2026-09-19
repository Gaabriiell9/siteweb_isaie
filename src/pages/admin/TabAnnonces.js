import React, { useState, useEffect } from 'react';
import { getAllAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../lib/admin';
import { supabase } from '../../lib/client';
import AdminActionButtons from '../../components/AdminActionButtons';
import Icon from '../../components/Icon';

export default function TabAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    titre: '',
    contenu: '',
    image_url: '',
    pinned: false,
    visible: true,
    date_publi: new Date().toISOString().split('T')[0],
    date_fin: ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getAllAnnouncements();
    setAnnonces(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const resetForm = () => {
    setForm({
      titre: '',
      contenu: '',
      image_url: '',
      pinned: false,
      visible: true,
      date_publi: new Date().toISOString().split('T')[0],
      date_fin: ''
    });
    setEditingId(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `site/annonce-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('etc-files')
      .upload(fileName, file, { upsert: true });

    if (error) {
      showMsg('Erreur upload: ' + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('etc-files')
      .getPublicUrl(fileName);

    setForm({ ...form, image_url: urlData.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim()) {
      showMsg('Le titre est requis');
      return;
    }

    setSaving(true);
    const payload = {
      titre: form.titre,
      contenu: form.contenu,
      image_url: form.image_url || null,
      pinned: form.pinned,
      visible: form.visible,
      date_publi: form.date_publi || new Date().toISOString().split('T')[0],
      date_fin: form.date_fin || null
    };

    let result;
    if (editingId) {
      result = await updateAnnouncement(editingId, payload);
    } else {
      result = await addAnnouncement(payload);
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

    showMsg(editingId ? 'Annonce mise a jour' : 'Annonce ajoutee');
    resetForm();
    load();
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({
      titre: a.titre || '',
      contenu: a.contenu || '',
      image_url: a.image_url || '',
      pinned: a.pinned || false,
      visible: a.visible !== false,
      date_publi: a.date_publi || new Date().toISOString().split('T')[0],
      date_fin: a.date_fin || ''
    });
  };

  const handleDelete = async (id) => {
    const { error } = await deleteAnnouncement(id);
    if (error) {
      if (error.code === '42501') {
        showMsg('Action non autorisee');
      } else {
        showMsg('Erreur : ' + error.message);
      }
      return;
    }
    showMsg('Annonce supprimee');
    load();
  };

  const togglePinned = async (a) => {
    const { error } = await updateAnnouncement(a.id, { pinned: !a.pinned });
    if (error) {
      showMsg('Erreur: ' + error.message);
      return;
    }
    load();
  };

  const toggleVisible = async (a) => {
    const { error } = await updateAnnouncement(a.id, { visible: !a.visible });
    if (error) {
      showMsg('Erreur: ' + error.message);
      return;
    }
    load();
  };

  return (
    <div className="admin-tab">
      <h3>{editingId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</h3>

      <form onSubmit={handleSubmit} className="admin-form">
        <input
          required
          placeholder="Titre *"
          value={form.titre}
          onChange={e => setForm({ ...form, titre: e.target.value })}
        />
        <textarea
          placeholder="Contenu de l'annonce"
          rows={4}
          value={form.contenu}
          onChange={e => setForm({ ...form, contenu: e.target.value })}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: 'var(--texte-doux)' }}>
            Image:
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ marginLeft: 8 }}
            />
          </label>
          {uploading && <span style={{ fontSize: 11, color: 'var(--or)' }}>Upload...</span>}
          {form.image_url && (
            <img src={form.image_url} alt="" style={{ height: 40, borderRadius: 4 }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--texte-doux)' }}>Date publication</label>
            <input
              type="date"
              value={form.date_publi}
              onChange={e => setForm({ ...form, date_publi: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--texte-doux)' }}>Date fin (optionnel)</label>
            <input
              type="date"
              value={form.date_fin}
              onChange={e => setForm({ ...form, date_fin: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={e => setForm({ ...form, pinned: e.target.checked })}
            />
            Epinglee
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.visible}
              onChange={e => setForm({ ...form, visible: e.target.checked })}
            />
            Visible
          </label>
        </div>

        {msg && <div className={`admin-msg ${msg.includes('Erreur') || msg.includes('non autorisee') ? 'err' : 'ok'}`}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Publier'}
          </button>
          {editingId && (
            <button type="button" className="admin-btn-secondary" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <h3 style={{ marginTop: 24 }}>Annonces ({annonces.length})</h3>
      <p style={{ fontSize: 12, color: 'var(--texte-doux)', marginBottom: 16, fontStyle: 'italic' }}>
        S'affichent sur la page d'accueil, 3 maximum, les epinglees en premier.
      </p>
      {loading ? (
        <p className="admin-empty">Chargement...</p>
      ) : annonces.length === 0 ? (
        <p className="admin-empty">Aucune annonce.</p>
      ) : (
        <div className="admin-list">
          {annonces.map(a => (
            <div className={`admin-item ${!a.visible ? 'admin-item--inactive' : ''}`} key={a.id}>
              {a.image_url && (
                <img src={a.image_url} alt="" className="admin-thumb" loading="lazy" />
              )}
              <div className="admin-item-info">
                <strong>
                  {a.pinned && <span style={{ color: 'var(--or)', marginRight: 6 }}><Icon name="pin" size={14} /></span>}
                  {a.titre}
                </strong>
                <span style={{ fontSize: 12, color: 'var(--texte-doux)' }}>
                  {a.contenu?.slice(0, 80)}{a.contenu?.length > 80 ? '...' : ''}
                </span>
                <span className="admin-date">
                  {new Date(a.date_publi).toLocaleDateString('fr-FR')}
                  {a.date_fin && ` - ${new Date(a.date_fin).toLocaleDateString('fr-FR')}`}
                  {!a.visible && <span style={{ marginLeft: 8, color: 'var(--encre-douce)' }}>(masquee)</span>}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
                <button
                  className="admin-action-btn"
                  onClick={() => togglePinned(a)}
                  title={a.pinned ? 'Desepingler' : 'Epingler'}
                  aria-label={a.pinned ? 'Desepingler' : 'Epingler'}
                  style={{ width: 44, height: 44, minWidth: 44, background: 'none', border: '1px solid rgba(200,134,10,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name={a.pinned ? 'pin' : 'pin-off'} size={16} />
                </button>
              </div>
              <AdminActionButtons
                item={a}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                onDelete={handleDelete}
                deleteLabel="Supprimer cette annonce"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
