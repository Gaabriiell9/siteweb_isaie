import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import logoPng from '../assets/logoe-eglise.png';
import {
  signIn, signOut, getSession,
  getVideos, addVideo, deleteVideo,
  getFichiers, uploadFichier, deleteFichier,
  getAllMessages, upsertMessage, deleteMessage,
  getCultes, addCulte, deleteCulte, getAnciensCultes,
  getAllElevesAvecStats,
  suspendreEleve, reactiverEleve,
  ajouterEvaluation,
  getEvaluations, getPaiements,
  updateProgressionModule, updateNotesAdmin,
  getStatistiquesFormation, getElevesParPays,
  exportElevesCSV,
  getModulesFormation,
  getSessionsLive, createSessionLive, updateSessionLive, deleteSessionLive,
  inviteParticipantsToSession, getParticipantsSession,
  getAllElevesAvecDernierMessage, getMessagesConversation, envoyerMessageAdmin, marquerMessagesLusAdmin,
  broadcastMessage,
  supabase, IS_MOCK,
  getAllRessourcesParModule, createRessource, deleteRessource, uploadRessourceFile,
  updateModuleFormation, swapModuleOrdre,
  getSessionStatut,
} from '../lib/supabase';
import './Admin.css';
import Icon from '../components/Icon';

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    if (err) setError('Email ou mot de passe incorrect.');
    else onLogin();
    setLoading(false);
  };

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-logo">E-T-C</div>
        <h2>Espace Administration</h2>
        <p>Église Temple de la Célébration</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="email" placeholder="Email administrateur"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          <input
            type="password" placeholder="Mot de passe"
            value={password} onChange={e => setPassword(e.target.value)} required
          />
          {error && <div className="admin-error">{error}</div>}
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB : VIDÉOS
// ─────────────────────────────────────────────
function TabVideos() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ titre: '', legende: '', description: '', youtube_url: '', date_publi: new Date().toISOString().split('T')[0], is_live: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => setVideos(await getVideos());
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await addVideo(form);
    if (!error) { setMsg('Vidéo ajoutée ✓'); setForm({ titre: '', legende: '', description: '', youtube_url: '', date_publi: new Date().toISOString().split('T')[0], is_live: false }); load(); }
    else setMsg('Erreur : ' + error.message);
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette vidéo ?')) return;
    await deleteVideo(id);
    load();
  };

  const getYouTubeId = (url) => {
    const m = url.match(/(?:youtu\.be\/|v=)([^&\s]+)/);
    return m ? m[1] : null;
  };

  return (
    <div className="admin-tab">
      <h3>Ajouter une vidéo</h3>
      <form onSubmit={handleAdd} className="admin-form">
        <input required placeholder="Titre de la prédication *" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
        <input placeholder="Légende (ex: Culte du Dimanche)" value={form.legende} onChange={e => setForm({...form, legende: e.target.value})} />
        <textarea placeholder="Description (optionnelle)" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <input required placeholder="Lien YouTube (https://youtube.com/watch?v=...) *" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} />
        <input type="date" value={form.date_publi} onChange={e => setForm({...form, date_publi: e.target.value})} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--texte-doux)', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_live} onChange={e => setForm({...form, is_live: e.target.checked})} style={{ accentColor: 'var(--rouge)' }} />
          Vidéo en direct ?
        </label>
        {msg && <div className={`admin-msg ${msg.includes('Erreur') ? 'err' : 'ok'}`}>{msg}</div>}
        <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Publier la vidéo'}</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Vidéos publiées ({videos.length})</h3>
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
                {v.is_live && <span style={{ marginLeft: 8, color: 'var(--rouge)', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>● EN DIRECT</span>}
              </span>
            </div>
            <button className="admin-btn-delete" onClick={() => handleDelete(v.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}
        {videos.length === 0 && <p className="admin-empty">Aucune vidéo pour l'instant.</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB : FICHIERS (PDF / Images)
// ─────────────────────────────────────────────
function TabFichiers() {
  const [fichiers, setFichiers] = useState([]);
  const [nom, setNom] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('general');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef();

  const load = async () => setFichiers(await getFichiers());
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const { error } = await uploadFichier(file, nom || file.name, desc, cat);
    if (!error) { setMsg('Fichier publié ✓'); setNom(''); setDesc(''); setFile(null); fileRef.current.value = ''; load(); }
    else setMsg('Erreur : ' + error.message);
    setUploading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = async (id, path) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    await deleteFichier(id, path);
    load();
  };

  return (
    <div className="admin-tab">
      <h3>Uploader un fichier</h3>
      <form onSubmit={handleUpload} className="admin-form">
        <input placeholder="Nom du fichier" value={nom} onChange={e => setNom(e.target.value)} />
        <textarea placeholder="Description (optionnelle)" rows={2} value={desc} onChange={e => setDesc(e.target.value)} />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          <option value="general">Général</option>
          <option value="sermon">Support de prédication</option>
          <option value="bulletin">Bulletin / Programme</option>
          <option value="formation">Formation théologique</option>
          <option value="priere">Montagne de prière</option>
        </select>
        <div className="admin-file-drop">
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={e => setFile(e.target.files[0])} required />
          {file && <span className="admin-file-name"><Icon name="file" size={14} style={{marginRight:4}} />{file.name}</span>}
        </div>
        {msg && <div className={`admin-msg ${msg.includes('Erreur') ? 'err' : 'ok'}`}>{msg}</div>}
        <button type="submit" className="admin-btn-primary" disabled={uploading}>{uploading ? 'Upload en cours…' : 'Publier le fichier'}</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Fichiers publiés ({fichiers.length})</h3>
      <div className="admin-list">
        {fichiers.map(f => (
          <div className="admin-item" key={f.id}>
            <div className="admin-file-icon"><Icon name={f.type === 'pdf' ? 'file' : 'image'} size={18} /></div>
            <div className="admin-item-info">
              <strong>{f.nom}</strong>
              <span>{f.categorie}</span>
              <a href={f.storage_path} target="_blank" rel="noreferrer" className="admin-link">Voir le fichier →</a>
            </div>
            <button className="admin-btn-delete" onClick={() => handleDelete(f.id, f.storage_path)}><Icon name="x" size={14} /></button>
          </div>
        ))}
        {fichiers.length === 0 && <p className="admin-empty">Aucun fichier pour l'instant.</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB : MESSAGES PRIÈRE
// ─────────────────────────────────────────────
const FAMILLES = ['Ruben','Siméon','Lévi','Juda','Dan','Nephtali','Gad','Aser','Issacar','Zabulon','Joseph','Benjamin'];
const JOURS    = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function TabPriere() {
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ famille: 'Ruben', jour_semaine: 'Lundi', semaine: 1, titre: '', contenu: '', verset: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);

  const load = async () => setMessages(await getAllMessages());
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await upsertMessage(editing ? { ...form, id: editing } : form);
    if (!error) { setMsg('Message enregistré ✓'); setForm({ famille: 'Ruben', jour_semaine: 'Lundi', semaine: 1, titre: '', contenu: '', verset: '' }); setEditing(null); load(); }
    else setMsg('Erreur : ' + error.message);
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleEdit = (m) => {
    setForm({ famille: m.famille, jour_semaine: m.jour_semaine, semaine: m.semaine, titre: m.titre, contenu: m.contenu, verset: m.verset || '' });
    setEditing(m.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    await deleteMessage(id);
    load();
  };

  return (
    <div className="admin-tab">
      <h3>{editing ? 'Modifier le message' : 'Ajouter un message de prière'}</h3>
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
        <input placeholder="Verset de référence (ex: Genèse 49:3)" value={form.verset} onChange={e => setForm({...form, verset: e.target.value})} />
        <textarea required rows={6} placeholder="Contenu du message de prière *" value={form.contenu} onChange={e => setForm({...form, contenu: e.target.value})} />
        {msg && <div className={`admin-msg ${msg.includes('Erreur') ? 'err' : 'ok'}`}>{msg}</div>}
        <div className="admin-form-row">
          <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Publier le message'}</button>
          {editing && <button type="button" className="admin-btn-secondary" onClick={() => { setEditing(null); setForm({ famille: 'Ruben', jour_semaine: 'Lundi', semaine: 1, titre: '', contenu: '', verset: '' }); }}>Annuler</button>}
        </div>
      </form>

      <h3 style={{ marginTop: 24 }}>Messages publiés ({messages.length})</h3>
      <div className="admin-list">
        {messages.map(m => (
          <div className="admin-item" key={m.id}>
            <div className="admin-famille-badge">{m.famille[0]}</div>
            <div className="admin-item-info">
              <strong>{m.famille} — {m.jour_semaine}</strong>
              <span>{m.titre}</span>
              <span className="admin-date">{m.verset}</span>
            </div>
            <button className="admin-btn-secondary admin-btn-sm" onClick={() => handleEdit(m)}><Icon name="pencil" size={14} /></button>
            <button className="admin-btn-delete" onClick={() => handleDelete(m.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}
        {messages.length === 0 && <p className="admin-empty">Aucun message de prière pour l'instant.</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB : CULTES & CELLULES
// ─────────────────────────────────────────────
function TabCultes() {
  const [cultes, setCultes] = useState([]);
  const [cellules, setCellules] = useState([]);
  const [anciensCultes, setAnciensCultes] = useState([]);
  const [tab, setTab] = useState('culte');
  const [form, setForm] = useState({ titre: 'Culte du Dimanche', date_culte: '', heure_debut: '10:00', heure_fin: '11:30', type: 'culte', groupe: '', description: '', lien_live: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setCultes(await getCultes('culte'));
    setCellules(await getCultes('cellule'));
    setAnciensCultes(await getAnciensCultes());
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await addCulte({ ...form, type: tab });
    if (!error) { setMsg('Ajouté ✓'); setForm({ ...form, date_culte: '', groupe: '', description: '' }); load(); }
    else setMsg('Erreur : ' + error.message);
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    await deleteCulte(id); load();
  };

  const list = tab === 'culte' ? cultes : cellules;

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="admin-tab">
      <div className="admin-mini-tabs">
        <button className={tab === 'culte' ? 'active' : ''} onClick={() => setTab('culte')}>Cultes</button>
        <button className={tab === 'cellule' ? 'active' : ''} onClick={() => setTab('cellule')}>Cellules</button>
      </div>

      <h3>Ajouter {tab === 'culte' ? 'un culte' : 'une cellule'}</h3>
      <form onSubmit={handleAdd} className="admin-form">
        <input required placeholder={tab === 'culte' ? 'Titre (ex: Culte du Dimanche)' : 'Titre (ex: Cellule Bethel — Groupe A)'} value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
        <div className="admin-form-row">
          <input required type="date" value={form.date_culte} onChange={e => setForm({...form, date_culte: e.target.value})} />
          <input type="time" value={form.heure_debut} onChange={e => setForm({...form, heure_debut: e.target.value})} />
          <input type="time" value={form.heure_fin} onChange={e => setForm({...form, heure_fin: e.target.value})} />
        </div>
        {tab === 'cellule' && <input placeholder="Groupe (ex: Groupe A)" value={form.groupe} onChange={e => setForm({...form, groupe: e.target.value})} />}
        <input placeholder="Lien live (YouTube, Zoom…)" value={form.lien_live} onChange={e => setForm({...form, lien_live: e.target.value})} />
        <textarea placeholder="Description (optionnelle)" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        {msg && <div className={`admin-msg ${msg.includes('Erreur') ? 'err' : 'ok'}`}>{msg}</div>}
        <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Ajouter'}</button>
      </form>

      <h3 style={{ marginTop: 24 }}>À venir ({list.length})</h3>
      <div className="admin-list">
        {list.map(c => (
          <div className="admin-item" key={c.id}>
            <div className="admin-date-box">
              <span>{new Date(c.date_culte).getDate()}</span>
              <span>{new Date(c.date_culte).toLocaleString('fr-FR', { month: 'short' })}</span>
            </div>
            <div className="admin-item-info">
              <strong>{c.titre}</strong>
              <span>{c.heure_debut?.slice(0,5)} – {c.heure_fin?.slice(0,5)} · {formatDate(c.date_culte)}</span>
            </div>
            <button className="admin-btn-delete" onClick={() => handleDelete(c.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="admin-empty">Aucun événement à venir.</p>}
      </div>

      {tab === 'culte' && (
        <>
          <h3 style={{ marginTop: 32 }}>Anciens cultes ({anciensCultes.length})</h3>
          <div className="admin-list">
            {anciensCultes.map(c => (
              <div className="admin-item" key={c.id}>
                <div className="admin-date-box">
                  <span>{new Date(c.date_culte).getDate()}</span>
                  <span>{new Date(c.date_culte).toLocaleString('fr-FR', { month: 'short' })}</span>
                </div>
                <div className="admin-item-info">
                  <strong>{c.titre}</strong>
                  <span>{c.heure_debut?.slice(0,5)} – {c.heure_fin?.slice(0,5)} · {formatDate(c.date_culte)}</span>
                </div>
                <button className="admin-btn-delete" onClick={() => handleDelete(c.id)}><Icon name="x" size={14} /></button>
              </div>
            ))}
            {anciensCultes.length === 0 && <p className="admin-empty">Aucun ancien culte.</p>}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB : FORMATION
// ─────────────────────────────────────────────

/* ── Helpers ── */
function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
  if (diff < 2592000) return `il y a ${Math.floor(diff/86400)} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}
function initiales(prenom, nom) {
  return `${(prenom||'?')[0]}${(nom||'?')[0]}`.toUpperCase();
}

/* ── Badge formule ── */
function BadgeFormule({ formule }) {
  return (
    <span className={`af-badge af-badge--${formule === 'integral' ? 'or' : 'bleu'}`}>
      {formule === 'integral' ? 'Intégral' : 'Échelonné'}
    </span>
  );
}
function BadgeStatut({ statut }) {
  const map = { actif: 'vert', suspendu: 'rouge', termine: 'or' };
  const labels = { actif: 'Actif', suspendu: 'Suspendu', terminé: 'Terminé', termine: 'Terminé' };
  return (
    <span className={`af-badge af-badge--${map[statut] || 'gris'}`}>
      {labels[statut] || statut}
    </span>
  );
}

/* ── Drawer élève ── */
function EleveDrawer({ eleve, onClose, onUpdate }) {
  const [tab, setTab] = useState('profil');
  const [modules, setModules] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [notes, setNotes] = useState(eleve?.notes_admin || '');
  const [notesSaving, setNotesSaving] = useState(false);
  const [modalEval, setModalEval] = useState(false);
  const [evalForm, setEvalForm] = useState({ module_id: '', type: 'partiel', titre: '', note: '', commentaire: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!eleve) return;
    setNotes(eleve.notes_admin || '');
    if (IS_MOCK) {
      setModules([
        { id: 'm1', module: { numero: 1, titre: 'Introduction à la Bible' }, debloque: true, complete: true, date_debloque: new Date(Date.now()-60*24*3600*1000).toISOString(), date_complete: new Date(Date.now()-30*24*3600*1000).toISOString() },
        { id: 'm2', module: { numero: 2, titre: 'Ancien Testament' }, debloque: true, complete: false, date_debloque: new Date(Date.now()-25*24*3600*1000).toISOString(), date_complete: null },
        { id: 'm3', module: { numero: 3, titre: 'Nouveau Testament' }, debloque: eleve.formule === 'integral', complete: false, date_debloque: null, date_complete: null },
        { id: 'm4', module: { numero: 4, titre: 'Théologie systématique' }, debloque: eleve.formule === 'integral', complete: false, date_debloque: null, date_complete: null },
        { id: 'm5', module: { numero: 5, titre: "Histoire de l'Église" }, debloque: false, complete: false, date_debloque: null, date_complete: null },
        { id: 'm6', module: { numero: 6, titre: 'Vie chrétienne et ministère' }, debloque: false, complete: false, date_debloque: null, date_complete: null },
      ]);
      setEvaluations([]);
      setPaiements([]);
      return;
    }
    // Chargement réel depuis Supabase
    Promise.all([
      getEvaluations(eleve.id),
      getPaiements(eleve.id),
      supabase.from('progressions_module').select('*, module:modules_formation(*)').eq('eleve_id', eleve.id).order('module(ordre)'),
      supabase.from('modules_formation').select('*').order('ordre'),
    ]).then(([evals, paies, progRes, modsRes]) => {
      setEvaluations(evals || []);
      setPaiements(paies || []);
      const mods = modsRes.data || [];
      const progs = progRes.data || [];
      setModules(mods.map(mod => {
        const prog = progs.find(p => p.module_id === mod.id) || {};
        return {
          id: prog.id || mod.id,
          _moduleId: mod.id,
          module: { numero: mod.ordre || mod.numero, titre: mod.titre },
          debloque: prog.debloque || false,
          complete: prog.complete || false,
          date_debloque: prog.date_debloque || null,
          date_complete: prog.date_complete || null,
        };
      }));
    }).catch(console.error);
  }, [eleve]);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSuspend = async () => {
    if (!window.confirm(`Suspendre ${eleve.prenom} ${eleve.nom} ?`)) return;
    await suspendreEleve(eleve.id);
    showMsg('Élève suspendu');
    onUpdate();
  };
  const handleReactivate = async () => {
    await reactiverEleve(eleve.id);
    showMsg('Élève réactivé');
    onUpdate();
  };
  const handleSaveNotes = async () => {
    setNotesSaving(true);
    await updateNotesAdmin(eleve.id, notes);
    setNotesSaving(false);
    showMsg('Notes sauvegardées ✓');
  };
  const handleAjouterEval = async (e) => {
    e.preventDefault();
    await ajouterEvaluation(eleve.id, { ...evalForm, note: parseFloat(evalForm.note) });
    setModalEval(false); showMsg('Évaluation ajoutée ✓');
  };
  const handleModuleAction = async (mod, action) => {
    const moduleId = mod._moduleId || mod.id;
    await updateProgressionModule(eleve.id, moduleId, action);
    showMsg(action === 'debloquer' ? 'Module débloqué ✓' : 'Module complété ✓');
  };

  if (!eleve) return null;

  const DRAWER_TABS = [
    { id: 'profil', label: 'Profil' },
    { id: 'progression', label: 'Progression' },
    { id: 'evaluations', label: 'Évaluations' },
    { id: 'paiements', label: 'Paiements' },
    { id: 'notes', label: 'Notes admin' },
  ];

  const drawerContent = (
    <>
      <div className="admin-drawer-backdrop" onClick={onClose} />
      <div className="admin-eleve-drawer">
        <button className="admin-drawer-close" onClick={onClose}><Icon name="x" size={14} /></button>

        <div className="af-drawer-header">
          <div className="af-drawer-avatar">{initiales(eleve.prenom, eleve.nom)}</div>
          <div className="af-drawer-info">
            <div className="af-drawer-name">{eleve.prenom} {eleve.nom}</div>
            <div className="af-drawer-meta">{eleve.email}</div>
            <BadgeStatut statut={eleve.statut} />
          </div>
          <div className="af-drawer-actions-top">
            {eleve.statut === 'actif'
              ? <button className="af-btn af-btn--sm af-btn--danger" onClick={handleSuspend}>Suspendre</button>
              : <button className="af-btn af-btn--sm af-btn--success" onClick={handleReactivate}>Réactiver</button>
            }
          </div>
        </div>

        {msg && <div className="af-drawer-msg">{msg}</div>}

        <div className="af-drawer-tabs">
          {DRAWER_TABS.map(t => (
            <button key={t.id} className={`af-drawer-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="af-drawer-body">
          {/* PROFIL */}
          {tab === 'profil' && (
            <div className="af-drawer-section">
              <div className="af-profil-grid">
                {[
                  ['Prénom', eleve.prenom], ['Nom', eleve.nom],
                  ['Email', eleve.email], ['Téléphone', eleve.telephone || '—'],
                  ['Pays', eleve.pays || '—'], ['Ville', eleve.ville || '—'],
                  ['Formule', eleve.formule === 'integral' ? 'Paiement intégral (450€)' : 'Échelonné (50€/mois)'],
                  ['Inscription', eleve.date_inscription ? new Date(eleve.date_inscription).toLocaleDateString('fr-FR') : '—'],
                  ['Église', eleve.eglise || '—'],
                ].map(([k, v]) => (
                  <div className="af-profil-row" key={k}>
                    <span className="af-profil-key">{k}</span>
                    <span className="af-profil-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROGRESSION */}
          {tab === 'progression' && (
            <div className="af-drawer-section">
              <div className="af-modules-list">
                {modules.map(m => (
                  <div className="af-module-row" key={m.id}>
                    <div className={`af-module-status ${m.complete ? 'af-module-status--done' : m.debloque ? 'af-module-status--open' : ''}`}>
                      {m.complete ? <Icon name="check" size={14} /> : m.debloque ? <Icon name="play" size={12} /> : <Icon name="lock" size={14} />}
                    </div>
                    <div className="af-module-info">
                      <div className="af-module-name">Module {m.module.numero} — {m.module.titre}</div>
                      <div className="af-module-dates">
                        {m.debloque ? `Débloqué ${formatRelative(m.date_debloque)}` : 'Verrouillé'}
                        {m.complete && ` · Complété ${formatRelative(m.date_complete)}`}
                      </div>
                    </div>
                    <div className="af-module-btns">
                      {!m.debloque && (
                        <button className="af-btn af-btn--sm af-btn--or" onClick={() => handleModuleAction(m, 'debloquer')}>Débloquer</button>
                      )}
                      {m.debloque && !m.complete && (
                        <button className="af-btn af-btn--sm" onClick={() => handleModuleAction(m, 'completer')}>Compléter</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ÉVALUATIONS */}
          {tab === 'evaluations' && (
            <div className="af-drawer-section">
              <button className="af-btn af-btn--primary" onClick={() => setModalEval(true)}>
                + Ajouter une évaluation
              </button>
              {evaluations.length === 0 && <p className="admin-empty" style={{marginTop:16}}>Aucune évaluation.</p>}
              {evaluations.map(ev => (
                <div className="af-eval-row" key={ev.id}>
                  <div className="af-eval-note">{ev.note}/{ev.note_max}</div>
                  <div>
                    <div className="af-eval-titre">{ev.titre}</div>
                    <div className="af-eval-meta">{ev.type} · {formatRelative(ev.date_eval)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAIEMENTS */}
          {tab === 'paiements' && (
            <div className="af-drawer-section">
              <div className="af-stripe-notice">
                <span className="af-stripe-notice-icon"><Icon name="credit-card" size={20} /></span>
                <div>
                  <strong>Paiements gérés via Stripe</strong>
                  <p>Les paiements sont traités automatiquement. L'historique ci-dessous est synchronisé depuis Stripe.</p>
                </div>
              </div>
              {paiements.length === 0 && <p className="admin-empty" style={{marginTop:16}}>Aucun paiement enregistré.</p>}
              {paiements.map(p => (
                <div className="af-pay-row" key={p.id}>
                  <div className="af-pay-montant">{p.montant} €</div>
                  <div>
                    <div className="af-pay-type">{p.type_paiement} · {p.methode}</div>
                    <div className="af-pay-date">{formatRelative(p.date_paiement)}</div>
                  </div>
                  <BadgeStatut statut={p.statut} />
                </div>
              ))}
            </div>
          )}

          {/* NOTES ADMIN */}
          {tab === 'notes' && (
            <div className="af-drawer-section">
              <p style={{fontSize:'0.82rem', color:'var(--texte-doux)', marginBottom:12}}>
                Notes privées visibles uniquement par l'administration.
              </p>
              <textarea
                className="af-notes-textarea"
                rows={10} value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Motivations, remarques, observations…"
              />
              <button className="af-btn af-btn--primary" onClick={handleSaveNotes} disabled={notesSaving} style={{marginTop:12}}>
                {notesSaving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>
      </div>


    </>
  );

  // Portal : rendu directement dans document.body pour échapper
  // au containing block créé par l'animation transform de .admin-wrap
  return (
    <>
      {ReactDOM.createPortal(drawerContent, document.body)}

      {modalEval && ReactDOM.createPortal(
        <div className="af-modal-backdrop" onClick={() => setModalEval(false)}>
          <div className="af-modal" style={{maxWidth: 500}} onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <span>Ajouter une évaluation</span>
              <button type="button" className="af-modal-close" onClick={() => setModalEval(false)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div className="af-modal-body">
              <form onSubmit={handleAjouterEval} className="af-modal-form">
                <label>Type</label>
                <select value={evalForm.type} onChange={e => setEvalForm({...evalForm, type: e.target.value})}>
                  <option value="partiel">Partiel</option>
                  <option value="final">Final</option>
                  <option value="devoir">Devoir</option>
                </select>
                <label>Titre *</label>
                <input required placeholder="Titre de l'évaluation" value={evalForm.titre}
                  onChange={e => setEvalForm({...evalForm, titre: e.target.value})} />
                <label>Note /20 *</label>
                <input required type="number" min="0" max="20" step="0.5" placeholder="ex. 14"
                  value={evalForm.note} onChange={e => setEvalForm({...evalForm, note: e.target.value})} />
                <label>Commentaire</label>
                <textarea rows={3} placeholder="Commentaire (optionnel)" value={evalForm.commentaire}
                  onChange={e => setEvalForm({...evalForm, commentaire: e.target.value})} />
                <div className="af-modal-footer">
                  <button type="button" className="af-btn" onClick={() => setModalEval(false)}>Annuler</button>
                  <button type="submit" className="af-btn af-btn--primary">Ajouter</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ── Sous-tab a) Tous les élèves ── */
function SubTabEleves({ filterPays, onClearFilter }) {
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFormule, setFilterFormule] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [selectedEleve, setSelectedEleve] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setEleves(await getAllElevesAvecStats());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = eleves.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${e.prenom} ${e.nom}`.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    const matchFormule = !filterFormule || e.formule === filterFormule;
    const matchStatut = !filterStatut || e.statut === filterStatut;
    const matchPays = !filterPays || e.pays === filterPays;
    return matchSearch && matchFormule && matchStatut && matchPays;
  });

  return (
    <div className="af-subtab">
      <div className="af-toolbar">
        <input className="af-search" placeholder="Rechercher nom, email…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterFormule} onChange={e => setFilterFormule(e.target.value)}>
          <option value="">Toutes formules</option>
          <option value="integral">Intégral</option>
          <option value="echelonne">Échelonné</option>
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="termine">Terminé</option>
        </select>
        {filterPays && (
          <button className="af-btn af-btn--sm" onClick={onClearFilter}>
            × {filterPays}
          </button>
        )}
        <button className="af-btn af-btn--sm af-btn--or" onClick={exportElevesCSV}>
          ↓ Export CSV
        </button>
      </div>

      {loading ? <p className="admin-empty">Chargement…</p> : (
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Email</th>
                <th>Pays</th>
                <th>Formule</th>
                <th>Progression</th>
                <th>Connexion</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="af-table-row" onClick={() => setSelectedEleve(e)}>
                  <td>
                    <div className="af-table-eleve">
                      <div className="af-table-avatar">{initiales(e.prenom, e.nom)}</div>
                      <span>{e.prenom} {e.nom}</span>
                    </div>
                  </td>
                  <td className="af-table-email">{e.email}</td>
                  <td>{e.pays || '—'}</td>
                  <td><BadgeFormule formule={e.formule} /></td>
                  <td>
                    <div className="af-prog-wrap">
                      <div className="af-prog-bar">
                        <div className="af-prog-fill" style={{ width: `${e.progression_pct || 0}%` }} />
                      </div>
                      <span className="af-prog-pct">{e.progression_pct || 0}%</span>
                    </div>
                  </td>
                  <td>{formatRelative(e.derniere_connexion)}</td>
                  <td><BadgeStatut statut={e.statut} /></td>
                  <td>
                    <button className="af-btn af-btn--sm" onClick={ev => { ev.stopPropagation(); setSelectedEleve(e); }}>
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="af-table-empty">Aucun élève trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedEleve && (
        <EleveDrawer eleve={selectedEleve} onClose={() => setSelectedEleve(null)} onUpdate={load} />
      )}
    </div>
  );
}

const PAYS_FR_EN = {
  'France': 'France', 'Belgique': 'Belgium', 'Suisse': 'Switzerland',
  'Canada': 'Canada', 'États-Unis': 'United States of America',
  'Sénégal': 'Senegal', "Côte d'Ivoire": 'Ivory Coast',
  'Cameroun': 'Cameroon', 'Congo': 'Republic of the Congo',
  'République démocratique du Congo': 'Democratic Republic of the Congo',
  'Gabon': 'Gabon', 'Mali': 'Mali', 'Burkina Faso': 'Burkina Faso',
  'Guinée': 'Guinea', 'Togo': 'Togo', 'Bénin': 'Benin',
  'Niger': 'Niger', 'Tchad': 'Chad', 'Madagascar': 'Madagascar',
  'Maroc': 'Morocco', 'Algérie': 'Algeria', 'Tunisie': 'Tunisia',
  'Guyane': 'France', 'Martinique': 'France', 'Guadeloupe': 'France',
  'Réunion': 'France', 'Brésil': 'Brazil', 'Portugal': 'Portugal',
  'Espagne': 'Spain', 'Italie': 'Italy', 'Allemagne': 'Germany',
  'Royaume-Uni': 'United Kingdom', 'Pays-Bas': 'Netherlands',
  'Haïti': 'Haiti', 'Antilles': 'France'
};

/* ── Sous-tab c) Carte du monde ── */
function SubTabCarte({ onSelectPays }) {
  const [elevesParPays, setElevesParPays] = useState([]);
  const [geographies, setGeographies] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getElevesParPays().then(data => { setElevesParPays(data); setLoading(false); });
    // Charger la topologie du monde
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(setGeographies)
      .catch(() => setGeographies(null));
  }, []);

  // Construire une map pays (EN) -> count en utilisant le mapping FR→EN
  const paysCount = {};
  elevesParPays.forEach(e => {
    const paysEn = PAYS_FR_EN[e.pays] || e.pays;
    paysCount[paysEn] = (paysCount[paysEn] || 0) + e.count;
  });

  const getColor = (count) => {
    if (!count) return '#e8e0d4';
    if (count <= 5) return '#F5D98A';
    if (count <= 15) return '#C8860A';
    return '#6B1A2E';
  };

  const top5 = elevesParPays.slice(0, 5);
  const totalPays = elevesParPays.length;
  const totalEleves = elevesParPays.reduce((s, e) => s + e.count, 0);

  return (
    <div className="af-subtab">
      {loading ? <p className="admin-empty">Chargement…</p> : (
        <>
          {geographies ? (
            <div className="af-carte-wrap">
              <CarteMonde
                geographies={geographies}
                paysCount={paysCount}
                getColor={getColor}
                tooltip={tooltip}
                setTooltip={setTooltip}
                onSelectPays={onSelectPays}
              />
              {tooltip && (
                <div className="af-carte-tooltip" style={{ left: tooltip.x + 10, top: tooltip.y - 40 }}>
                  {tooltip.pays} — {tooltip.count} élève{tooltip.count > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ) : (
            <div className="af-carte-placeholder">
              <p>Carte indisponible (connexion requise)</p>
            </div>
          )}

          <div className="af-carte-stats">
            <div className="af-carte-total">
              <strong>{totalEleves}</strong> élève{totalEleves > 1 ? 's' : ''} dans <strong>{totalPays}</strong> pays
            </div>
            <div className="af-carte-top5">
              <div className="af-carte-top5-title">Top 5 pays</div>
              {top5.map((e, i) => (
                <div className="af-carte-top5-row" key={e.pays}>
                  <span className="af-carte-top5-rank">{i+1}</span>
                  <span className="af-carte-top5-pays" onClick={() => onSelectPays(e.pays)} style={{cursor:'pointer'}}>{e.pays}</span>
                  <div className="af-carte-top5-bar-wrap">
                    <div className="af-carte-top5-bar" style={{width: `${(e.count / top5[0].count) * 100}%`}} />
                  </div>
                  <span className="af-carte-top5-count">{e.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="af-carte-legende">
            <span style={{background:'#e8e0d4'}}>0</span>
            <span style={{background:'#F5D98A'}}>1–5</span>
            <span style={{background:'#C8860A', color:'white'}}>6–15</span>
            <span style={{background:'#6B1A2E', color:'white'}}>15+</span>
          </div>
        </>
      )}
    </div>
  );
}

/* Carte monde SVG simple sans react-simple-maps (fallback si le paquet n'est pas chargé) */
function CarteMonde({ paysCount, getColor, tooltip, setTooltip, onSelectPays }) {
  try {
    // eslint-disable-next-line
    const { ComposableMap, Geographies, Geography, ZoomableGroup } = require('react-simple-maps');
    const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
    return (
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}
        style={{ width: '100%', height: 'auto', maxHeight: 400 }}>
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => {
                const name = geo.properties.name;
                const count = paysCount[name] || 0;
                return (
                  <Geography key={geo.rsmKey} geography={geo}
                    fill={getColor(count)}
                    stroke="#fff" strokeWidth={0.3}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none', opacity: 0.8, cursor: count ? 'pointer' : 'default' }, pressed: { outline: 'none' } }}
                    onMouseEnter={(e) => {
                      if (count > 0) setTooltip({ pays: name, count, x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => { if (count > 0) onSelectPays(name); }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    );
  } catch (e) {
    return <div className="af-carte-placeholder"><p>react-simple-maps non chargé.</p></div>;
  }
}

/* ── Sous-tab d) Statistiques ── */
function SubTabStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatistiquesFormation().then(s => { setStats(s); setLoading(false); });
  }, []);

  if (loading) return <p className="admin-empty">Chargement…</p>;
  if (!stats) return null;

  try {
    // eslint-disable-next-line
    const { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = require('recharts');
    const COULEURS_PIE = ['#C8860A', '#1E3A5F'];
    const pieData = [
      { name: 'Intégral', value: Math.round(stats.totalInscrits * 0.6) },
      { name: 'Échelonné', value: Math.round(stats.totalInscrits * 0.4) },
    ];
    const niveauData = [
      { name: 'Débutant', value: 14 },
      { name: 'Intermédiaire', value: 11 },
      { name: 'Avancé', value: 7 },
    ];

    return (
      <div className="af-subtab af-stats">
        {/* KPIs */}
        <div className="af-kpi-grid">
          <div className="af-kpi">
            <div className="af-kpi-val">{stats.totalInscrits}</div>
            <div className="af-kpi-label">Total inscriptions</div>
            <div className="af-kpi-sub">+{stats.inscritsCeMois} ce mois</div>
          </div>
          <div className="af-kpi">
            <div className="af-kpi-val">{stats.elevesActifs}</div>
            <div className="af-kpi-label">Élèves actifs</div>
          </div>
          <div className="af-kpi">
            <div className="af-kpi-val">{stats.tauxPaiement}%</div>
            <div className="af-kpi-label">Taux de paiement</div>
          </div>
          <div className="af-kpi">
            <div className="af-kpi-val">{stats.revenuTotal.toLocaleString('fr-FR')} €</div>
            <div className="af-kpi-label">Revenus cumulés</div>
          </div>
        </div>

        <div className="af-charts-grid">
          {/* Inscriptions par mois */}
          <div className="af-chart-card">
            <div className="af-chart-title">Inscriptions — 6 derniers mois</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.inscriptionsParMois}>
                <XAxis dataKey="mois" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#C8860A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition formules */}
          <div className="af-chart-card">
            <div className="af-chart-title">Répartition formules</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COULEURS_PIE[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Niveau biblique */}
          <div className="af-chart-card">
            <div className="af-chart-title">Niveau biblique</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={niveauData}>
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Bar dataKey="value" fill="#6B1A2E" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="af-subtab af-stats">
        <div className="af-kpi-grid">
          <div className="af-kpi"><div className="af-kpi-val">{stats.totalInscrits}</div><div className="af-kpi-label">Total inscriptions</div></div>
          <div className="af-kpi"><div className="af-kpi-val">{stats.elevesActifs}</div><div className="af-kpi-label">Élèves actifs</div></div>
          <div className="af-kpi"><div className="af-kpi-val">{stats.tauxPaiement}%</div><div className="af-kpi-label">Taux de paiement</div></div>
          <div className="af-kpi"><div className="af-kpi-val">{stats.revenuTotal.toLocaleString('fr-FR')} €</div><div className="af-kpi-label">Revenus cumulés</div></div>
        </div>
        <p className="admin-empty" style={{marginTop:16}}>Recharts en cours de chargement…</p>
      </div>
    );
  }
}

/* ── Sous-tab e) Cours en live ── */
function SubTabCours() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCreate, setModalCreate] = useState(false);
  const [modalParticipants, setModalParticipants] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [form, setForm] = useState({
    titre: '', description: '', module_id: '', type_session: 'ponctuel',
    date_session: '', duree_minutes: 60, lien_zoom: '', zoom_meeting_id: '', zoom_password: '',
    recurrence_jour_semaine: 1, recurrence_heure: '18:00',
  });
  const [selectedEleves, setSelectedEleves] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [modules, setModules] = useState([]);

  const JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const load = async () => {
    setLoading(true);
    setSessions(await getSessionsLive());
    setLoading(false);
  };
  const loadEleves = async () => {
    const data = await getAllElevesAvecStats();
    setEleves(data.filter(e => e.statut === 'actif'));
  };

  useEffect(() => {
    load();
    getModulesFormation().then(setModules);
  }, []);

  // Tick 60s pour rafraîchir les badges de statut sans requête DB
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const openCreate = () => {
    loadEleves();
    setModalCreate(true);
    setSelectedEleves([]);
    setForm({ titre: '', description: '', module_id: '', type_session: 'ponctuel', date_session: '', duree_minutes: 60, lien_zoom: '', zoom_meeting_id: '', zoom_password: '', recurrence_jour_semaine: 1, recurrence_heure: '18:00' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const { data: session, error } = await createSessionLive({
      titre: form.titre,
      description: form.description || null,
      module_id: form.module_id || null,
      type_session: form.type_session,
      date_session: form.type_session === 'ponctuel' ? new Date(form.date_session).toISOString() : new Date().toISOString(),
      duree_minutes: parseInt(form.duree_minutes),
      lien_zoom: form.lien_zoom,
      zoom_meeting_id: form.zoom_meeting_id || null,
      zoom_password: form.zoom_password || null,
      recurrence_jour_semaine: form.type_session === 'recurrent' ? form.recurrence_jour_semaine : null,
      recurrence_heure: form.type_session === 'recurrent' ? form.recurrence_heure : null,
    });
    if (error) {
      console.error('createSessionLive error:', error);
      setSaving(false);
      showMsg('Erreur : ' + (error.message || JSON.stringify(error)));
      return;
    }
    if (session?.id && selectedEleves.length > 0) {
      await inviteParticipantsToSession(session.id, selectedEleves);
    }
    setSaving(false);
    setModalCreate(false);
    showMsg('Cours créé et invitations envoyées ✓');
    load();
  };

  const handleCancel = async (sessionId) => {
    if (!window.confirm('Annuler ce cours ?')) return;
    await updateSessionLive(sessionId, { statut: 'annule' });
    showMsg('Cours annulé');
    load();
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Supprimer définitivement ce cours ?')) return;
    await deleteSessionLive(sessionId);
    showMsg('Cours supprimé');
    load();
  };

  const toggleEleve = (id) => {
    setSelectedEleves(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => showMsg('Lien copié ✓'));
  };

  const statusColor = { programme: '#C8860A', en_cours: '#dc3232', termine: '#888', annule: '#888' };
  const statusLabel = { programme: 'Programmé', en_cours: '● En cours', termine: 'Terminé', annule: 'Annulé' };
  const getStatut = (s) => s.statut === 'annule' ? 'annule' : getSessionStatut(s);

  return (
    <div className="af-subtab">
      {msg && <div className="af-flash">{msg}</div>}
      <div className="af-toolbar">
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--texte-doux)' }}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
        <button className="af-btn af-btn--primary" onClick={openCreate}>+ Créer un cours</button>
      </div>

      {loading ? <p className="admin-empty">Chargement…</p> : (
        <div className="af-cours-list">
          {sessions.length === 0 && <p className="admin-empty">Aucune session programmée.</p>}
          {sessions.map(s => (
            <div className="af-cours-card" key={s.id}>
              <div className="af-cours-card-header">
                <div>
                  <div className="af-cours-titre">{s.titre}</div>
                  {s.description && <div className="af-cours-desc">{s.description}</div>}
                </div>
                <span className="af-badge" style={{ background: 'rgba(200,134,10,0.1)', color: statusColor[getStatut(s)], border: `1px solid ${statusColor[getStatut(s)]}30`, fontSize: '0.7rem' }}>
                  {statusLabel[getStatut(s)]}
                </span>
              </div>
              <div className="af-cours-meta">
                {s.module_titre && <span className="af-badge af-badge--or" style={{fontSize:'0.68rem'}}>{s.module_titre}</span>}
                <span><Icon name="calendar" size={13} style={{marginRight:4}} />{s.type_session === 'recurrent' ? `Récurrent — ${JOURS_SEMAINE[s.recurrence_jour_semaine] || ''} ${s.recurrence_heure || ''}` : formatDate(s.date_session)}</span>
                <span><Icon name="timer" size={13} style={{marginRight:4}} />{s.duree_minutes} min</span>
              </div>
              <div className="af-cours-zoom">
                <span className="af-cours-zoom-url">{s.lien_zoom}</span>
                <button className="af-btn af-btn--sm" onClick={() => copyLink(s.lien_zoom)}>Copier</button>
                {s.zoom_password && <span style={{fontSize:'0.75rem', color:'var(--texte-doux)'}}><Icon name="lock" size={12} style={{marginRight:3}} />{s.zoom_password}</span>}
              </div>
              <div className="af-cours-actions">
                <button className="af-btn af-btn--sm" onClick={() => { setModalParticipants(s); loadEleves(); }}>
                  <Icon name="users" size={14} style={{marginRight:5}} />Participants
                </button>
                {getStatut(s) === 'programme' && (
                  <button className="af-btn af-btn--sm af-btn--danger" onClick={() => handleCancel(s.id)}>Annuler</button>
                )}
                <button className="af-btn af-btn--sm" onClick={() => handleDelete(s.id)} style={{marginLeft:'auto', color:'#888'}}><Icon name="trash" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {modalCreate && ReactDOM.createPortal(
        <div className="af-modal-backdrop" onClick={() => setModalCreate(false)}>
          <div className="af-modal af-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <h3>Créer un cours en live</h3>
              <button type="button" className="af-modal-close" onClick={() => setModalCreate(false)}><Icon name="x" size={14} /></button>
            </div>
            <div className="af-modal-body">
            <form id="form-cours-create" onSubmit={handleCreate}>
              <div className="af-modal-grid">
                <div className="af-modal-col">
                  <label>Titre *</label>
                  <input required placeholder="Ex: Introduction à la Bible — Session 1"
                    value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />

                  <label>Description</label>
                  <textarea rows={2} placeholder="Résumé de la session…"
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

                  <label>Module rattaché</label>
                  <select value={form.module_id || ''} onChange={e => setForm({...form, module_id: e.target.value || null})}>
                    <option value="">Général (pas de module spécifique)</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>
                        Module {String(m.numero).padStart(2, '0')} — {m.titre}
                      </option>
                    ))}
                  </select>

                  <label>Type de session</label>
                  <div style={{display:'flex', gap:12, marginBottom:8}}>
                    {['ponctuel','recurrent'].map(t => (
                      <label key={t} style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:'0.85rem'}}>
                        <input type="radio" name="type_session" value={t}
                          checked={form.type_session === t}
                          onChange={() => setForm({...form, type_session: t})} />
                        {t === 'ponctuel' ? 'Ponctuel' : 'Récurrent'}
                      </label>
                    ))}
                  </div>

                  {form.type_session === 'ponctuel' ? (
                    <>
                      <label>Date et heure *</label>
                      <input required type="datetime-local" value={form.date_session}
                        onChange={e => setForm({...form, date_session: e.target.value})} />
                    </>
                  ) : (
                    <>
                      <label>Jour de la semaine</label>
                      <select value={form.recurrence_jour_semaine} onChange={e => setForm({...form, recurrence_jour_semaine: parseInt(e.target.value)})}>
                        {JOURS_SEMAINE.map((j, i) => <option key={i} value={i}>{j}</option>)}
                      </select>
                      <label>Heure</label>
                      <input type="time" value={form.recurrence_heure}
                        onChange={e => setForm({...form, recurrence_heure: e.target.value})} />
                    </>
                  )}

                  <label>Durée (minutes)</label>
                  <input type="number" min="15" max="480" value={form.duree_minutes}
                    onChange={e => setForm({...form, duree_minutes: e.target.value})} />

                  <label>Lien Zoom *</label>
                  <input required type="url" placeholder="https://zoom.us/j/..."
                    value={form.lien_zoom} onChange={e => setForm({...form, lien_zoom: e.target.value})} />

                  <label>Zoom Meeting ID (optionnel)</label>
                  <input placeholder="Ex: 123 456 7890" value={form.zoom_meeting_id}
                    onChange={e => setForm({...form, zoom_meeting_id: e.target.value})} />

                  <label>Mot de passe Zoom (optionnel)</label>
                  <input placeholder="Mot de passe" value={form.zoom_password}
                    onChange={e => setForm({...form, zoom_password: e.target.value})} />
                </div>

                <div className="af-modal-col">
                  <label>Participants ({selectedEleves.length}/{eleves.length} sélectionnés)</label>
                  <div className="af-participant-actions">
                    <button type="button" onClick={() => setSelectedEleves(eleves.map(e => e.id))}>Tout sélectionner</button>
                    <button type="button" onClick={() => setSelectedEleves([])}>Tout désélectionner</button>
                    <button type="button" onClick={() => setSelectedEleves(eleves.filter(e => e.formule === 'integral').map(e => e.id))}>Intégral</button>
                    <button type="button" onClick={() => setSelectedEleves(eleves.filter(e => e.formule === 'echelonne').map(e => e.id))}>Échelonné</button>
                  </div>
                  <div className="af-participants-list">
                    {eleves.map(e => (
                      <label key={e.id} className="af-participant-item">
                        <input
                          type="checkbox"
                          className="af-participant-checkbox"
                          checked={selectedEleves.includes(e.id)}
                          onChange={() => toggleEleve(e.id)}
                        />
                        <div className="af-participant-avatar">{initiales(e.prenom, e.nom)}</div>
                        <div className="af-participant-info">
                          <div className="af-participant-nom">{e.prenom} {e.nom}</div>
                          <div className="af-participant-meta">
                            <span className={`af-participant-badge af-participant-badge--${e.formule}`}>
                              {e.formule === 'integral' ? 'Intégral' : 'Échelonné'}
                            </span>
                            {e.pays && <span className="af-participant-pays">{e.pays}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                    {eleves.length === 0 && <p style={{color:'var(--texte-doux)', fontSize:'0.83rem', textAlign:'center', padding:'16px'}}>Aucun élève actif.</p>}
                  </div>
                </div>
              </div>

            </form>
            </div>{/* af-modal-body */}
            <div className="af-modal-footer">
              <button type="button" className="af-btn" onClick={() => setModalCreate(false)}>Annuler</button>
              <button type="submit" form="form-cours-create" className="af-btn af-btn--primary" disabled={saving}>
                {saving ? 'Création…' : 'Créer le cours et envoyer les invitations'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal participants */}
      {modalParticipants && ReactDOM.createPortal(
        <div className="af-modal-backdrop" onClick={() => { setModalParticipants(null); setSelectedEleves([]); }}>
          <div className="af-modal" style={{maxWidth: 480}} onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <span>Participants — {modalParticipants.titre}</span>
              <button type="button" className="af-modal-close" onClick={() => { setModalParticipants(null); setSelectedEleves([]); }}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div className="af-modal-body">
              <p style={{fontSize:'0.83rem', color:'var(--texte-doux)', marginBottom:16}}>
                Gérez les participants invités à cette session.
              </p>
              <div className="af-participants-list">
                {eleves.map(e => (
                  <label key={e.id} className={`af-participant-row${selectedEleves.includes(e.id) ? ' selected' : ''}`}>
                    <input type="checkbox" checked={selectedEleves.includes(e.id)} onChange={() => toggleEleve(e.id)} />
                    <span style={{flex:1, fontSize:'0.83rem'}}>{e.prenom} {e.nom}</span>
                    <BadgeFormule formule={e.formule} />
                  </label>
                ))}
              </div>
            </div>
            <div className="af-modal-footer">
              <button className="af-btn" onClick={() => { setModalParticipants(null); setSelectedEleves([]); }}>Fermer</button>
              <button className="af-btn af-btn--primary" onClick={async () => {
                await inviteParticipantsToSession(modalParticipants.id, selectedEleves);
                setModalParticipants(null); setSelectedEleves([]);
                showMsg('Participants mis à jour ✓');
              }}>Enregistrer</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

/* ── Helpers messagerie ── */
function wmFormatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function wmFormatDateSep(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today - 86400000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

/* ── Sous-tab f) Messages ── */
function SubTabMessages() {
  const [eleves, setEleves] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastTexte, setBroadcastTexte] = useState('');
  const [broadcastFilter, setBroadcastFilter] = useState('');
  const [loadingEleves, setLoadingEleves] = useState(true);
  const [mobileShowConv, setMobileShowConv] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const selectedRef = useRef(null);

  const loadEleves = useCallback(async () => {
    const data = await getAllElevesAvecDernierMessage();
    setEleves(data);
    setLoadingEleves(false);
  }, []);

  useEffect(() => { loadEleves(); }, [loadEleves]);

  const openConv = async (eleve) => {
    setSelected(eleve);
    setMobileShowConv(true);
    const msgs = await getMessagesConversation(eleve.id);
    setMessages(msgs);
    await marquerMessagesLusAdmin(eleve.id);
    setEleves(prev => prev.map(e => e.id === eleve.id ? { ...e, unread_count: 0 } : e));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Garde selectedRef à jour sans recréer le channel
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Realtime — channel stable, utilise selectedRef pour éviter stale closure
  useEffect(() => {
    if (IS_MOCK) return;
    const channel = supabase
      .channel('admin_messages_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        loadEleves();
        const current = selectedRef.current;
        if (!current) return;
        const msg = payload.new;
        if (msg.destinataire_id === current.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadEleves]);

  // Polling de secours toutes les 3s
  useEffect(() => {
    if (IS_MOCK) return;
    const interval = setInterval(async () => {
      loadEleves();
      const current = selectedRef.current;
      if (!current) return;
      const msgs = await getMessagesConversation(current.id);
      setMessages(prev => {
        if (msgs.length === prev.length && msgs.every((m, i) => m.id === prev[i]?.id)) return prev;
        return msgs;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [loadEleves]);

  const handleTextareaChange = (e) => {
    setTexte(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    if (!texte.trim() || !selected || sending) return;
    const content = texte.trim();
    const tempId = `temp-${Date.now()}`;
    const tempMsg = { id: tempId, contenu: content, expediteur_type: 'admin', created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setTexte('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    setSending(true);
    const { data: newMsg, error } = await envoyerMessageAdmin(selected.id, content);
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? (newMsg || tempMsg) : m));
      setEleves(prev => prev.map(e => e.id === selected.id ? { ...e, last_message: content, last_at: new Date().toISOString() } : e));
    }
    setSending(false);
  };

  const handleBroadcast = async () => {
    if (!broadcastTexte.trim()) return;
    await broadcastMessage(broadcastTexte.trim(), broadcastFilter ? { formule: broadcastFilter } : {});
    setBroadcastModal(false);
    setBroadcastTexte('');
    setBroadcastFilter('');
    loadEleves();
  };

  const sorted = useMemo(() => {
    const f = eleves.filter(e => !search || `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase()));
    return [...f].sort((a, b) => {
      if (a.last_at && b.last_at) return new Date(b.last_at) - new Date(a.last_at);
      if (a.last_at) return -1;
      if (b.last_at) return 1;
      return (a.nom || '').localeCompare(b.nom || '');
    });
  }, [eleves, search]);

  return (
    <div className="wm-layout">
      {/* ── Panneau gauche ── */}
      <div className={`wm-sidebar${mobileShowConv ? ' wm-sidebar--hidden' : ''}`}>
        <div className="wm-sidebar-header">
          <div className="wm-sidebar-title">Messages</div>
          <div className="wm-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="wm-search-ico">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="wm-search-input" placeholder="Rechercher un élève…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="wm-broadcast-btn" onClick={() => setBroadcastModal(true)}>
            <Icon name="megaphone" size={14} style={{marginRight:5}} />Broadcast
          </button>
        </div>

        <div className="wm-eleves-list">
          {loadingEleves && <div className="wm-loading">Chargement…</div>}
          {!loadingEleves && sorted.length === 0 && <div className="wm-loading">Aucun élève actif.</div>}
          {sorted.map(eleve => (
            <div key={eleve.id}
              className={`wm-eleve-item${selected?.id === eleve.id ? ' wm-eleve-item--active' : ''}`}
              onClick={() => openConv(eleve)}>
              <div className="wm-avatar-wrap">
                <div className="wm-avatar wm-avatar--sm">{initiales(eleve.prenom, eleve.nom)}</div>
              </div>
              <div className="wm-eleve-body">
                <div className="wm-eleve-name">{eleve.prenom} {eleve.nom}</div>
                <div className="wm-eleve-preview">
                  {eleve.last_message || <em>Nouvelle conversation</em>}
                </div>
              </div>
              <div className="wm-eleve-side">
                {eleve.last_at && <span className="wm-eleve-time">{wmFormatTime(eleve.last_at)}</span>}
                {eleve.unread_count > 0 && <span className="wm-unread-badge">{eleve.unread_count}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div className={`wm-conv${mobileShowConv ? ' wm-conv--visible' : ''}`}>
        {selected ? (
          <>
            {/* Header */}
            <div className="wm-conv-header">
              <button className="wm-back-btn" onClick={() => setMobileShowConv(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="wm-avatar wm-avatar--md">{initiales(selected.prenom, selected.nom)}</div>
              <div className="wm-conv-header-info">
                <div className="wm-conv-header-name">{selected.prenom} {selected.nom}</div>
                <div className="wm-conv-header-sub">
                  {selected.formule === 'integral' ? 'Formule Intégrale' : 'Formule Échelonnée'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="wm-messages">
              {messages.length === 0 && (
                <div className="wm-empty-conv">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p>Démarrez la conversation.</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isAdmin = msg.expediteur_type === 'admin';
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const showDateSep = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                const isLastInGroup = !next || next.expediteur_type !== msg.expediteur_type ||
                  new Date(next.created_at).toDateString() !== new Date(msg.created_at).toDateString();
                return (
                  <React.Fragment key={msg.id}>
                    {showDateSep && (
                      <div className="wm-date-sep"><span>{wmFormatDateSep(msg.created_at)}</span></div>
                    )}
                    <div className={`wm-msg-wrap wm-msg-wrap--${isAdmin ? 'admin' : 'eleve'}`}>
                      <div className={`wm-bubble wm-bubble--${isAdmin ? 'admin' : 'eleve'}`}>
                        {msg.contenu}
                      </div>
                      {isLastInGroup && (
                        <div className={`wm-msg-meta${isAdmin ? ' wm-msg-meta--right' : ''}`}>
                          {wmFormatTime(msg.created_at)}
                          {isAdmin && msg.lu && <span className="wm-read-check"><Icon name="check-check" size={13} /></span>}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="wm-input-area">
              <textarea
                ref={textareaRef}
                className="wm-textarea"
                placeholder="Votre message… (Ctrl+↵ pour envoyer)"
                value={texte}
                onChange={handleTextareaChange}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSend(); } }}
                rows={1}
                maxLength={2000}
              />
              <div className="wm-input-footer">
                <span className="wm-char-count">{texte.length > 1800 ? `${texte.length}/2000` : ''}</span>
                <button className="wm-send-btn" onClick={handleSend} disabled={!texte.trim() || sending}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="wm-empty-state">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Sélectionnez un élève pour démarrer une conversation</p>
            <span>Vos messages seront envoyés en temps réel</span>
          </div>
        )}
      </div>

      {/* Modal broadcast */}
      {broadcastModal && ReactDOM.createPortal(
        <div className="af-modal-backdrop" onClick={() => setBroadcastModal(false)}>
          <div className="af-modal" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <h3>Message à tous les élèves</h3>
              <button type="button" className="af-modal-close" onClick={() => setBroadcastModal(false)}><Icon name="x" size={14} /></button>
            </div>
            <div className="af-modal-body">
              <label>Filtrer par formule (optionnel)</label>
              <select value={broadcastFilter} onChange={e => setBroadcastFilter(e.target.value)}>
                <option value="">Tous les élèves actifs</option>
                <option value="integral">Intégral uniquement</option>
                <option value="echelonne">Échelonné uniquement</option>
              </select>
              <label style={{marginTop:12}}>Message *</label>
              <textarea rows={5} placeholder="Votre message…" value={broadcastTexte}
                onChange={e => setBroadcastTexte(e.target.value)} />
            </div>
            <div className="af-modal-footer">
              <button type="button" className="af-btn" onClick={() => setBroadcastModal(false)}>Annuler</button>
              <button type="button" className="af-btn af-btn--primary" onClick={handleBroadcast} disabled={!broadcastTexte.trim()}>
                Envoyer à tous
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

/* ── Sous-tab g) Ressources ── */
function SubTabRessources() {
  const [modulesList, setModulesList] = useState([]);
  const [ressourcesMap, setRessourcesMap] = useState({});
  const [openModules, setOpenModules] = useState({ 1: true });
  // modalModule = { numero, id } | null
  const [modalModule, setModalModule] = useState(null);
  const [form, setForm] = useState({ titre: '', description: '', type_ressource: 'pdf', url: '', ordre: 1 });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  // Inline module edit: { id, field: 'titre'|'description', value } | null
  const [editingModule, setEditingModule] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const TYPE_ICON_MAP = { pdf: 'file', video: 'video', lien: 'link', image: 'image', audio: 'audio' };

  const load = async () => {
    const data = await getAllRessourcesParModule();
    const map = {};
    Object.values(data).forEach(entry => {
      if (entry.module) map[entry.module.numero] = entry.ressources || [];
    });
    setRessourcesMap(map);
  };

  const loadModules = () => getModulesFormation().then(mods => setModulesList(mods));

  useEffect(() => {
    load();
    loadModules();
  }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const toggleModule = (num) => {
    setOpenModules(prev => ({ ...prev, [num]: !prev[num] }));
  };

  const startEdit = (e, m, field) => {
    e.stopPropagation();
    setEditingModule({ id: m.id, field, value: m[field] || '' });
  };

  const confirmEdit = async (e) => {
    e?.stopPropagation();
    if (!editingModule || editSaving) return;
    setEditSaving(true);
    const { error } = await updateModuleFormation(editingModule.id, { [editingModule.field]: editingModule.value });
    setEditSaving(false);
    if (error) { showMsg('Erreur lors de la mise à jour'); return; }
    setModulesList(prev => prev.map(m => m.id === editingModule.id ? { ...m, [editingModule.field]: editingModule.value } : m));
    setEditingModule(null);
    showMsg('Module mis à jour ✓');
  };

  const cancelEdit = (e) => {
    e?.stopPropagation();
    setEditingModule(null);
  };

  const moveModule = async (index, direction) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= modulesList.length) return;
    const mA = modulesList[index];
    const mB = modulesList[swapIndex];
    const { error } = await swapModuleOrdre(mA.id, mA.numero, mB.id, mB.numero);
    if (error) { showMsg('Erreur lors du réordonnancement'); return; }
    // Swap locally
    const updated = [...modulesList];
    updated[index] = { ...mA, numero: mB.numero };
    updated[swapIndex] = { ...mB, numero: mA.numero };
    updated.sort((a, b) => a.numero - b.numero);
    setModulesList(updated);
  };

  const handleAddRessource = async (e) => {
    e.preventDefault();
    if (saving || !modalModule) return;
    setSaving(true);
    const moduleUUID = modalModule.id;
    let result;
    if (file) {
      result = await uploadRessourceFile(file, moduleUUID, form.titre, form.description, form.ordre);
    } else if (form.url) {
      result = await createRessource({ module_id: moduleUUID, ...form });
    }
    setSaving(false);
    if (result?.error) { showMsg('Erreur lors de l\'ajout'); return; }
    setModalModule(null);
    setFile(null);
    setForm({ titre: '', description: '', type_ressource: 'pdf', url: '', ordre: 1 });
    showMsg('Ressource ajoutée ✓');
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette ressource ?')) return;
    await deleteRessource(id);
    showMsg('Ressource supprimée');
    load();
  };

  const getRessourcesPourModule = (num) => ressourcesMap[num] || [];

  return (
    <div className="af-subtab">
      {msg && <div className="af-flash">{msg}</div>}

      <div className="af-ressources-list">
        {modulesList.map((m, index) => {
          const ressources = getRessourcesPourModule(m.numero);
          const isOpen = openModules[m.numero];
          const isEditingTitre = editingModule?.id === m.id && editingModule.field === 'titre';
          const isEditingDesc = editingModule?.id === m.id && editingModule.field === 'description';
          return (
            <div key={m.id} className="af-ressource-module">
              <div className="af-ressource-module-header" onClick={() => !editingModule && toggleModule(m.numero)}>
                {/* Reorder arrows */}
                <div className="af-module-arrows" onClick={e => e.stopPropagation()}>
                  <button className="af-module-arrow-btn" disabled={index === 0} onClick={() => moveModule(index, -1)} title="Monter">
                    <Icon name="chevron-up" size={12} />
                  </button>
                  <button className="af-module-arrow-btn" disabled={index === modulesList.length - 1} onClick={() => moveModule(index, 1)} title="Descendre">
                    <Icon name="chevron-down" size={12} />
                  </button>
                </div>

                <span className="af-module-num-badge">{String(m.numero).padStart(2, '0')}</span>

                <div className="af-ressource-module-meta" onClick={e => e.stopPropagation()}>
                  {/* Titre éditable */}
                  {isEditingTitre ? (
                    <div className="af-module-edit-row">
                      <input
                        className="af-module-inline-input"
                        value={editingModule.value}
                        autoFocus
                        onChange={e => setEditingModule(prev => ({ ...prev, value: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEdit(e); if (e.key === 'Escape') cancelEdit(e); }}
                        onClick={e => e.stopPropagation()}
                      />
                      <button className="af-module-edit-confirm" disabled={editSaving} onClick={confirmEdit} title="Confirmer">✓</button>
                      <button className="af-module-edit-cancel" onClick={cancelEdit} title="Annuler">✕</button>
                    </div>
                  ) : (
                    <div className="af-module-titre-row">
                      <span className="af-ressource-module-titre">{m.titre}</span>
                      <button className="af-module-pencil-btn" onClick={e => startEdit(e, m, 'titre')} title="Modifier le titre">
                        <Icon name="pencil" size={13} />
                      </button>
                    </div>
                  )}

                  {/* Description éditable */}
                  {isEditingDesc ? (
                    <div className="af-module-edit-row">
                      <input
                        className="af-module-inline-input af-module-inline-input--desc"
                        value={editingModule.value}
                        autoFocus
                        placeholder="Description du module…"
                        onChange={e => setEditingModule(prev => ({ ...prev, value: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEdit(e); if (e.key === 'Escape') cancelEdit(e); }}
                        onClick={e => e.stopPropagation()}
                      />
                      <button className="af-module-edit-confirm" disabled={editSaving} onClick={confirmEdit} title="Confirmer">✓</button>
                      <button className="af-module-edit-cancel" onClick={cancelEdit} title="Annuler">✕</button>
                    </div>
                  ) : (
                    <div className="af-module-desc-row">
                      <span className="af-module-inline-desc">{m.description || <em style={{opacity:0.4}}>Aucune description</em>}</span>
                      <button className="af-module-pencil-btn af-module-pencil-btn--desc" onClick={e => startEdit(e, m, 'description')} title="Modifier la description">
                        <Icon name="pencil" size={11} />
                      </button>
                    </div>
                  )}
                </div>

                <span className="af-badge af-badge--bleu" style={{fontSize:'0.68rem', marginLeft:'auto', flexShrink:0}}>
                  {ressources.length} ressource{ressources.length !== 1 ? 's' : ''}
                </span>
                <span style={{color:'var(--texte-doux)', fontSize:'0.8rem', marginLeft:8, flexShrink:0}}>
                  <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} />
                </span>
              </div>

              {isOpen && (
                <div className="af-ressource-module-body">
                  {ressources.length === 0 && (
                    <p className="admin-empty" style={{padding:'12px 0'}}>Aucune ressource pour ce module.</p>
                  )}
                  {ressources.map(r => (
                    <div className="af-ressource-row" key={r.id}>
                      <span className="af-ressource-icon"><Icon name={TYPE_ICON_MAP[r.type_ressource] || 'attachment'} size={16} /></span>
                      <div className="af-ressource-info">
                        <div className="af-ressource-titre">{r.titre}</div>
                        {r.description && <div className="af-ressource-desc">{r.description}</div>}
                        {r.taille_ko && <div className="af-ressource-taille">{r.taille_ko < 1024 ? `${r.taille_ko} Ko` : `${(r.taille_ko/1024).toFixed(1)} Mo`}</div>}
                      </div>
                      <div className="af-ressource-actions">
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="af-btn af-btn--sm">↗ Ouvrir</a>
                        <button className="af-btn af-btn--sm af-btn--danger" onClick={() => handleDelete(r.id)}><Icon name="trash" size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <button className="af-btn af-btn--sm af-btn--or" style={{marginTop:8}}
                    onClick={() => { setModalModule({ numero: m.numero, id: m.id }); setForm({...form, ordre: ressources.length + 1}); }}>
                    + Ajouter une ressource
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal ajout ressource */}
      {modalModule && ReactDOM.createPortal(
        <div className="af-modal-backdrop" onClick={() => { setModalModule(null); setFile(null); }}>
          <div className="af-modal" style={{maxWidth: 560}} onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <span>Ajouter une ressource — Module {String(modalModule?.numero).padStart(2,'0')}</span>
              <button type="button" className="af-modal-close" onClick={() => { setModalModule(null); setFile(null); }}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div className="af-modal-body">
              <form onSubmit={handleAddRessource} className="af-modal-form">
                <label>Titre *</label>
                <input required placeholder="Titre de la ressource"
                  value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />

                <label>Description</label>
                <textarea rows={2} placeholder="Description courte…"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

                <label>Type</label>
                <select value={form.type_ressource} onChange={e => setForm({...form, type_ressource: e.target.value})}>
                  <option value="pdf">PDF</option>
                  <option value="video">Vidéo</option>
                  <option value="lien">Lien externe</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                </select>

                <label>Fichier (upload)</label>
                <input type="file" onChange={e => setFile(e.target.files[0])} />

                {!file && (
                  <>
                    <label>Ou URL directe</label>
                    <input type="url" placeholder="https://…" value={form.url}
                      onChange={e => setForm({...form, url: e.target.value})} />
                  </>
                )}

                <label>Ordre d'affichage</label>
                <input type="number" min="1" value={form.ordre}
                  onChange={e => setForm({...form, ordre: parseInt(e.target.value)})} />

                <div className="af-modal-footer">
                  <button type="button" className="af-btn" onClick={() => { setModalModule(null); setFile(null); }}>Annuler</button>
                  <button type="submit" className="af-btn af-btn--primary" disabled={saving || (!file && !form.url)}>
                    {saving ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ── TabFormation principal ── */
function TabFormation() {
  const [subTab, setSubTab] = useState('eleves');
  const [filterPays, setFilterPays] = useState('');

  const SUBTABS = [
    { id: 'eleves', label: 'Tous les élèves' },
    { id: 'cours', label: 'Cours en live', icon: 'calendar' },
    { id: 'messages', label: 'Messages', icon: 'message' },
    { id: 'ressources', label: 'Ressources', icon: 'books' },
    { id: 'carte', label: 'Carte du monde' },
    { id: 'stats', label: 'Statistiques' },
  ];

  const handleSelectPays = (pays) => {
    setFilterPays(pays);
    setSubTab('eleves');
  };

  return (
    <div className="admin-tab af-formation">
      <div className="af-subtabs">
        {SUBTABS.map(t => (
          <button key={t.id}
            className={`af-subtab-btn ${subTab === t.id ? 'active' : ''}`}
            onClick={() => setSubTab(t.id)}>
            {t.icon && <Icon name={t.icon} size={13} style={{marginRight:5}} />}{t.label}
            {t.badge && <span className="af-subtab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      <div className="af-subtab-content">
        {subTab === 'eleves' && <SubTabEleves filterPays={filterPays} onClearFilter={() => setFilterPays('')} />}
        {subTab === 'cours' && <SubTabCours />}
        {subTab === 'messages' && <SubTabMessages />}
        {subTab === 'ressources' && <SubTabRessources />}
        {subTab === 'carte' && <SubTabCarte onSelectPays={handleSelectPays} />}
        {subTab === 'stats' && <SubTabStats />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN PRINCIPAL
// ─────────────────────────────────────────────
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3,1 13,7 3,13" fill="currentColor" stroke="none" />
  </svg>
);
const IconDoc = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 1h6l3 3v9H3V1z" />
    <path d="M9 1v3h3" />
    <line x1="5" y1="7" x2="10" y2="7" />
    <line x1="5" y1="10" x2="10" y2="10" />
  </svg>
);
const IconCroix = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="7" y1="1" x2="7" y2="13" />
    <line x1="1" y1="5" x2="13" y2="5" />
  </svg>
);
const IconCal = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="2" width="12" height="11" rx="1" />
    <line x1="1" y1="6" x2="13" y2="6" />
    <line x1="4" y1="1" x2="4" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="4" y1="9" x2="4" y2="9" strokeWidth="2" strokeLinecap="round" />
    <line x1="7" y1="9" x2="7" y2="9" strokeWidth="2" strokeLinecap="round" />
    <line x1="10" y1="9" x2="10" y2="9" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconFormation = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 1L13 4.5V7" />
    <path d="M1 4.5L7 1L13 4.5L7 8L1 4.5Z" />
    <path d="M3 6v3.5l4 2 4-2V6" />
  </svg>
);

const TABS = [
  { id: 'videos',    label: 'Vidéos',            icon: <IconPlay /> },
  { id: 'fichiers',  label: 'Fichiers',           icon: <IconDoc /> },
  { id: 'priere',    label: 'Messages prière',    icon: <IconCroix /> },
  { id: 'cultes',    label: 'Cultes & Cellules',  icon: <IconCal /> },
  { id: 'formation', label: 'Formation',          icon: <IconFormation /> },
];

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [activeTab, setActiveTab] = useState('videos');
  const [animKey, setAnimKey] = useState(0);
  const switchTab = (tab) => { setActiveTab(tab); setAnimKey(k => k + 1); };

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  if (session === undefined) return <div className="admin-loading">Chargement…</div>;
  if (!session) return <LoginForm onLogin={() => getSession().then(setSession)} />;

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div className="admin-header-brand">
          <img src={logoPng} alt="E-T-C" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          <span>Administration</span>
        </div>
        <button className="admin-btn-secondary" onClick={async () => { await signOut(); setSession(null); }}>
          Déconnexion
        </button>
      </div>

      <div className="admin-layout">
        <nav className="admin-nav">
          {TABS.map(t => (
            <button key={t.id} className={`admin-nav-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => switchTab(t.id)}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin-content">
          <div key={animKey} style={{ animation: 'adminFadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
            {activeTab === 'videos'    && <TabVideos />}
            {activeTab === 'fichiers'  && <TabFichiers />}
            {activeTab === 'priere'    && <TabPriere />}
            {activeTab === 'cultes'    && <TabCultes />}
            {activeTab === 'formation' && <TabFormation />}
          </div>
        </div>
      </div>
    </div>
  );
}
