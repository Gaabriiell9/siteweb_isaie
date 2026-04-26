import React, { useState, useEffect } from 'react';
import { useEleve } from './EleveLayout';
import { updateEleveProfil, supabase, IS_MOCK } from '../lib/supabase';

export default function EleveProfil() {
  const { eleve, setEleve } = useEleve();
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', pays: '', ville: '' });
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [msgProfil, setMsgProfil] = useState('');
  const [msgPwd, setMsgPwd] = useState('');

  useEffect(() => {
    if (eleve) setForm({ nom: eleve.nom || '', email: eleve.email || '', telephone: eleve.telephone || '', pays: eleve.pays || '', ville: eleve.ville || '' });
  }, [eleve]);

  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSaveProfil = async (e) => {
    e.preventDefault();
    setSaving(true); setMsgProfil('');
    const { error } = await updateEleveProfil(eleve.id, { nom: form.nom, telephone: form.telephone, pays: form.pays, ville: form.ville });
    setSaving(false);
    if (error) { setMsgProfil('err:' + error.message); return; }
    setEleve(v => ({ ...v, ...form }));
    setMsgProfil('ok');
    setTimeout(() => setMsgProfil(''), 3000);
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (!pwd.current) { setMsgPwd('err:Veuillez saisir votre mot de passe actuel.'); return; }
    if (pwd.next !== pwd.confirm) { setMsgPwd('err:Les mots de passe ne correspondent pas.'); return; }
    if (pwd.next.length < 8) { setMsgPwd('err:Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setSavingPwd(true); setMsgPwd('');
    if (IS_MOCK) {
      setTimeout(() => { setSavingPwd(false); setMsgPwd('ok'); setPwd({ current: '', next: '', confirm: '' }); setTimeout(() => setMsgPwd(''), 3000); }, 600);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setSavingPwd(false);
    if (error) { setMsgPwd('err:' + error.message); return; }
    setMsgPwd('ok');
    setPwd({ current: '', next: '', confirm: '' });
    setTimeout(() => setMsgPwd(''), 3000);
  };

  const Msg = ({ msg }) => {
    if (!msg) return null;
    const isOk = msg === 'ok';
    const text = isOk ? 'Modifications enregistrées.' : msg.replace('err:', '');
    return <div className={isOk ? 'eleve-profil-ok' : ''} style={!isOk ? { background: '#FCEBEB', borderLeft: '3px solid #E24B4A', color: '#791F1F', padding: '9px 14px', fontSize: 12, fontWeight: 600 } : {}}>{text}</div>;
  };

  const FORMULE_LABEL = { integral: 'Paiement intégral (450 €)', echelonne: 'Paiement échelonné (50 €/mois × 10)' };

  return (
    <div>
      <h1 className="eleve-page-title">Mon <em>profil</em></h1>
      <p className="eleve-page-sub">Informations personnelles de votre compte</p>

      <div className="eleve-profil-form">

        {/* ── Infos de la formation ── */}
        <div className="eleve-profil-section">
          <div className="eleve-profil-section-titre">Ma formation</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="eleve-profil-label">Formule</div>
              <span className="eleve-badge eleve-badge--gold" style={{ marginTop: 6 }}>
                {FORMULE_LABEL[eleve?.formule] || eleve?.formule}
              </span>
            </div>
            <div>
              <div className="eleve-profil-label">Statut</div>
              <span className="eleve-badge eleve-badge--green" style={{ marginTop: 6 }}>
                {eleve?.statut === 'actif' ? 'Actif' : eleve?.statut}
              </span>
            </div>
            <div>
              <div className="eleve-profil-label">Inscrit le</div>
              <div style={{ fontSize: 13, color: 'var(--texte-doux)', marginTop: 6 }}>
                {eleve?.date_inscription ? new Date(eleve.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Infos personnelles ── */}
        <form className="eleve-profil-section" onSubmit={handleSaveProfil}>
          <div className="eleve-profil-section-titre">Informations personnelles</div>
          <div className="eleve-profil-grid">
            <div className="eleve-profil-field">
              <label className="eleve-profil-label">Nom complet</label>
              <input value={form.nom} onChange={set('nom')} required />
            </div>
            <div className="eleve-profil-field">
              <label className="eleve-profil-label">Email</label>
              <input value={form.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div className="eleve-profil-field">
              <label className="eleve-profil-label">Téléphone</label>
              <input value={form.telephone} onChange={set('telephone')} />
            </div>
            <div className="eleve-profil-field">
              <label className="eleve-profil-label">Pays</label>
              <input value={form.pays} onChange={set('pays')} />
            </div>
            <div className="eleve-profil-field">
              <label className="eleve-profil-label">Ville</label>
              <input value={form.ville} onChange={set('ville')} />
            </div>
          </div>
          <Msg msg={msgProfil} />
          <button type="submit" className="eleve-profil-submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </form>

        {/* ── Changer mot de passe ── */}
        <form className="eleve-profil-section" onSubmit={handleChangePwd}>
          <div className="eleve-profil-section-titre">Changer le mot de passe</div>
          <div className="eleve-profil-grid">
            <div className="eleve-profil-field">
              <label className="eleve-profil-label">Mot de passe actuel</label>
              <input type="password" value={pwd.current} onChange={e => setPwd(v => ({ ...v, current: e.target.value }))} placeholder="Votre mot de passe actuel" required />
            </div>
            <div className="eleve-profil-field">
              <label className="eleve-profil-label">Nouveau mot de passe</label>
              <input type="password" value={pwd.next} onChange={e => setPwd(v => ({ ...v, next: e.target.value }))} placeholder="8 caractères minimum" required />
            </div>
            <div className="eleve-profil-field">
              <label className="eleve-profil-label">Confirmer</label>
              <input type="password" value={pwd.confirm} onChange={e => setPwd(v => ({ ...v, confirm: e.target.value }))} placeholder="Répétez le mot de passe" required />
            </div>
          </div>
          <Msg msg={msgPwd} />
          <button type="submit" className="eleve-profil-submit" disabled={savingPwd}>
            {savingPwd ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </form>

      </div>
    </div>
  );
}
