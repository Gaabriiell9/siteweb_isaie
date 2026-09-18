import React, { useState, useEffect } from 'react';
import { getVideos } from '../../lib/public';
import { addVideo, deleteVideo } from '../../lib/admin';
import Icon from '../../components/Icon';

export default function TabVideos() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ titre: '', legende: '', description: '', youtube_url: '', date_publi: new Date().toISOString().split('T')[0], is_live: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => setVideos(await getVideos());
  useEffect(() => { load(); }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await addVideo(form);
    if (!error) {
      showMsg('Video ajoutee');
      setForm({ titre: '', legende: '', description: '', youtube_url: '', date_publi: new Date().toISOString().split('T')[0], is_live: false });
      load();
    } else if (error.code === '42501') {
      showMsg('Action non autorisee');
    } else {
      showMsg('Erreur: ' + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette video ?')) return;
    const { error } = await deleteVideo(id);
    if (error) {
      if (error.code === '42501') {
        showMsg('Action non autorisee');
      } else {
        showMsg('Erreur: ' + error.message);
      }
      return;
    }
    load();
  };

  const getYouTubeId = (url) => {
    const m = url.match(/(?:youtu\.be\/|v=)([^&\s]+)/);
    return m ? m[1] : null;
  };

  return (
    <div className="admin-tab">
      <h3>Ajouter une video</h3>
      <form onSubmit={handleAdd} className="admin-form">
        <input required placeholder="Titre de la predication *" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
        <input placeholder="Legende (ex: Culte du Dimanche)" value={form.legende} onChange={e => setForm({...form, legende: e.target.value})} />
        <textarea placeholder="Description (optionnelle)" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <input required placeholder="Lien YouTube (https://youtube.com/watch?v=...) *" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} />
        <input type="date" value={form.date_publi} onChange={e => setForm({...form, date_publi: e.target.value})} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--texte-doux)', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_live} onChange={e => setForm({...form, is_live: e.target.checked})} style={{ accentColor: 'var(--rouge)' }} />
          Video en direct ?
        </label>
        {msg && <div className={`admin-msg ${msg.includes('Erreur') || msg.includes('non autorisee') ? 'err' : 'ok'}`}>{msg}</div>}
        <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Publier la video'}</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Videos publiees ({videos.length})</h3>
      <div className="admin-list">
        {videos.map(v => (
          <div className="admin-item" key={v.id}>
            {getYouTubeId(v.youtube_url) && (
              <img
                src={`https://img.youtube.com/vi/${getYouTubeId(v.youtube_url)}/mqdefault.jpg`}
                alt="" className="admin-thumb"
              />
            )}
            <div className="admin-item-info">
              <strong>{v.titre}</strong>
              <span>{v.legende}</span>
              <span className="admin-date">
                {new Date(v.date_publi).toLocaleDateString('fr-FR')}
                {v.is_live && <span style={{ marginLeft: 8, color: 'var(--rouge)', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>EN DIRECT</span>}
              </span>
            </div>
            <button className="admin-btn-delete" onClick={() => handleDelete(v.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}
        {videos.length === 0 && <p className="admin-empty">Aucune video pour l'instant.</p>}
      </div>
    </div>
  );
}
