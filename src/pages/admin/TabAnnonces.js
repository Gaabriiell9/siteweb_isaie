import React, { useState, useEffect, useRef } from 'react';
import { getAllAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../lib/admin';
import { supabase } from '../../lib/client';
import AdminActionButtons from '../../components/AdminActionButtons';
import Icon from '../../components/Icon';
import {
  validerFormatImage,
  compresserImage,
  genererNomFichier,
  traduireErreurUpload,
  estUrlEtcFiles,
  extraireCheminDepuisUrl
} from '../../lib/images';

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
  const [previewUrl, setPreviewUrl] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const data = await getAllAnnouncements();
    setAnnonces(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const resetForm = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
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
    setPreviewUrl('');
    setPendingFile(null);
    setOriginalImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const supprimerFichierBucket = async (url) => {
    if (!estUrlEtcFiles(url)) return;
    const path = extraireCheminDepuisUrl(url);
    if (path) {
      await supabase.storage.from('etc-files').remove([path]);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validerFormatImage(file);
    if (!validation.valide) {
      showMsg(validation.erreur);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setPendingFile(file);
    setForm(f => ({ ...f, image_url: '' }));
  };

  const uploadPendingImage = async () => {
    if (!pendingFile) return { url: form.image_url, uploaded: false };

    setUploading(true);

    try {
      const { blob, extension } = await compresserImage(pendingFile);
      const fileName = genererNomFichier('site/annonces', extension);

      const { error } = await supabase.storage
        .from('etc-files')
        .upload(fileName, blob);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('etc-files')
        .getPublicUrl(fileName);

      setUploading(false);
      return { url: urlData.publicUrl, uploaded: true, path: fileName };
    } catch (error) {
      setUploading(false);
      throw error;
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setPendingFile(null);
    setForm(f => ({ ...f, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim()) {
      showMsg('Le titre est requis');
      return;
    }

    setSaving(true);
    let uploadedUrl = form.image_url;
    let uploadedPath = null;

    try {
      if (pendingFile) {
        const result = await uploadPendingImage();
        uploadedUrl = result.url;
        uploadedPath = result.path;
      }
    } catch (error) {
      setSaving(false);
      showMsg(traduireErreurUpload(error));
      return;
    }

    const payload = {
      titre: form.titre,
      contenu: form.contenu,
      image_url: uploadedUrl || null,
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

    if (result.error) {
      if (uploadedPath) {
        await supabase.storage.from('etc-files').remove([uploadedPath]);
      }
      setSaving(false);
      if (result.error.code === '42501') {
        showMsg('Action non autorisee');
      } else {
        showMsg('Erreur: ' + result.error.message);
      }
      return;
    }

    if (editingId && originalImageUrl && originalImageUrl !== uploadedUrl) {
      await supprimerFichierBucket(originalImageUrl);
    }

    setSaving(false);
    showMsg(editingId ? 'Annonce mise a jour' : 'Annonce ajoutee');
    resetForm();
    load();
  };

  const startEdit = (a) => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
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
    setPreviewUrl(a.image_url || '');
    setPendingFile(null);
    setOriginalImageUrl(a.image_url || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    const annonce = annonces.find(a => a.id === id);
    const { error } = await deleteAnnouncement(id);
    if (error) {
      if (error.code === '42501') {
        showMsg('Action non autorisee');
      } else {
        showMsg('Erreur : ' + error.message);
      }
      return;
    }
    if (annonce?.image_url) {
      await supprimerFichierBucket(annonce.image_url);
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

  const displayImage = previewUrl || form.image_url;

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
            Image :
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,.heic,.heif"
              onChange={handleImageSelect}
              disabled={uploading || saving}
              style={{ marginLeft: 8 }}
            />
          </label>
          {uploading && (
            <span style={{ fontSize: 11, color: 'var(--or)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="spinner-small" /> Envoi en cours...
            </span>
          )}
          {displayImage && (
            <>
              <img
                src={displayImage}
                alt="Apercu"
                style={{ height: 48, borderRadius: 4, border: '1px solid var(--color-border)' }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={uploading || saving}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-error, #c00)',
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Retirer l'image
              </button>
            </>
          )}
          {!displayImage && !uploading && (
            <span style={{ fontSize: 11, color: 'var(--texte-doux)', fontStyle: 'italic' }}>
              Aucune image
            </span>
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

        {msg && <div className={`admin-msg ${msg.includes('Erreur') || msg.includes('non autorise') ? 'err' : 'ok'}`}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="admin-btn-primary" disabled={saving || uploading}>
            {saving ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Publier'}
          </button>
          {editingId && (
            <button type="button" className="admin-btn-secondary" onClick={resetForm} disabled={saving || uploading}>
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
