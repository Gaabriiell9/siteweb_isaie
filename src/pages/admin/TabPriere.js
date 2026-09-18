import React, { useState, useEffect } from 'react';
import { getAllMessagesPriere } from '../../lib/public';
import { upsertMessagePriere, deleteMessagePriere } from '../../lib/admin';
import Icon from '../../components/Icon';

const FAMILLES = ['Ruben','Simeon','Levi','Juda','Dan','Nephtali','Gad','Aser','Issacar','Zabulon','Joseph','Benjamin'];
const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

export default function TabPriere() {
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ famille: 'Ruben', jour_semaine: 'Lundi', semaine: 1, titre: '', contenu: '', verset: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);

  const load = async () => setMessages(await getAllMessagesPriere());
  useEffect(() => { load(); }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await upsertMessagePriere(editing ? { ...form, id: editing } : form);
    if (!error) {
      showMsg('Message enregistre');
      setForm({ famille: 'Ruben', jour_semaine: 'Lundi', semaine: 1, titre: '', contenu: '', verset: '' });
      setEditing(null);
      load();
    } else if (error.code === '42501') {
      showMsg('Action non autorisee');
    } else {
      showMsg('Erreur: ' + error.message);
    }
    setSaving(false);
  };

  const handleEdit = (m) => {
    setForm({ famille: m.famille, jour_semaine: m.jour_semaine, semaine: m.semaine, titre: m.titre, contenu: m.contenu, verset: m.verset || '' });
    setEditing(m.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    const { error } = await deleteMessagePriere(id);
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

  return (
    <div className="admin-tab">
      <h3>{editing ? 'Modifier le message' : 'Ajouter un message de priere'}</h3>
      <form onSubmit={handleSave} className="admin-form">
        <div className="admin-form-row">
          <select value={form.famille} onChange={e => setForm({...form, famille: e.target.value})}>
            {FAMILLES.map(f => <option key={f}>{f}</option>)}
          </select>
          <select value={form.jour_semaine} onChange={e => setForm({...form, jour_semaine: e.target.value})}>
            {JOURS.map(j => <option key={j}>{j}</option>)}
          </select>
          <select value={form.semaine} onChange={e => setForm({...form, semaine: parseInt(e.target.value)})}>
            <option value={1}>Semaine 1</option>
            <option value={2}>Semaine 2</option>
          </select>
        </div>
        <input required placeholder="Titre du message *" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
        <input placeholder="Verset de reference (ex: Genese 49:3)" value={form.verset} onChange={e => setForm({...form, verset: e.target.value})} />
        <textarea required rows={6} placeholder="Contenu du message de priere *" value={form.contenu} onChange={e => setForm({...form, contenu: e.target.value})} />
        {msg && <div className={`admin-msg ${msg.includes('Erreur') || msg.includes('non autorisee') ? 'err' : 'ok'}`}>{msg}</div>}
        <div className="admin-form-row">
          <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : editing ? 'Mettre a jour' : 'Publier le message'}</button>
          {editing && <button type="button" className="admin-btn-secondary" onClick={() => { setEditing(null); setForm({ famille: 'Ruben', jour_semaine: 'Lundi', semaine: 1, titre: '', contenu: '', verset: '' }); }}>Annuler</button>}
        </div>
      </form>

      <h3 style={{ marginTop: 24 }}>Messages publies ({messages.length})</h3>
      <div className="admin-list">
        {messages.map(m => (
          <div className="admin-item" key={m.id}>
            <div className="admin-famille-badge">{m.famille[0]}</div>
            <div className="admin-item-info">
              <strong>{m.famille} - {m.jour_semaine}</strong>
              <span>{m.titre}</span>
              <span className="admin-date">{m.verset}</span>
            </div>
            <button className="admin-btn-secondary admin-btn-sm" onClick={() => handleEdit(m)}><Icon name="pencil" size={14} /></button>
            <button className="admin-btn-delete" onClick={() => handleDelete(m.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}
        {messages.length === 0 && <p className="admin-empty">Aucun message de priere pour l'instant.</p>}
      </div>
    </div>
  );
}
