import React, { useState, useEffect } from 'react';
import { updateSiteSetting } from '../../lib/admin';
import { getSiteSettings } from '../../lib/public';

const FUSEAUX_HORAIRES = [
  { value: 'Europe/Paris', label: 'Europe/Paris (France, Belgique)' },
  { value: 'America/Cayenne', label: 'America/Cayenne (Guyane)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (Bresil)' },
  { value: 'Africa/Douala', label: 'Africa/Douala (Cameroun)' },
  { value: 'UTC', label: 'UTC' },
];

const SETTINGS_CONFIG = [
  { cle: 'nom_eglise', label: 'Nom de l\'eglise', type: 'text', placeholder: 'Eglise Temple de la Celebration' },
  { cle: 'fuseau_horaire', label: 'Fuseau horaire', type: 'select', help: 'Fuseau utilise pour les heures des cultes', options: FUSEAUX_HORAIRES },
  { cle: 'facebook_url', label: 'URL Facebook', type: 'url', placeholder: 'https://facebook.com/...' },
  { cle: 'youtube_url', label: 'URL YouTube', type: 'url', placeholder: 'https://youtube.com/@...' },
  { cle: 'instagram_url', label: 'URL Instagram', type: 'url', placeholder: 'https://instagram.com/...' },
  { cle: 'email_contact', label: 'Email de contact', type: 'email', placeholder: 'contact@eglise.com' },
  { cle: 'telephone', label: 'Telephone', type: 'tel', placeholder: '+33 1 23 45 67 89' },
];

function isValidUrl(str) {
  if (!str) return true;
  try {
    const url = new URL(str);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function TabSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({});

  const load = async () => {
    setLoading(true);
    const data = await getSiteSettings();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const validate = (config, value) => {
    if (config.type === 'url' && value && !isValidUrl(value)) {
      return 'URL invalide (doit commencer par https://)';
    }
    if (config.type === 'email' && value && !value.includes('@')) {
      return 'Email invalide';
    }
    return null;
  };

  const handleChange = (cle, value) => {
    setSettings({ ...settings, [cle]: value });
    const config = SETTINGS_CONFIG.find(c => c.cle === cle);
    const error = validate(config, value);
    setErrors({ ...errors, [cle]: error });
  };

  const handleSave = async (cle) => {
    const config = SETTINGS_CONFIG.find(c => c.cle === cle);
    const value = settings[cle] || '';
    const error = validate(config, value);

    if (error) {
      setErrors({ ...errors, [cle]: error });
      return;
    }

    setSaving({ ...saving, [cle]: true });
    const { error: saveError } = await updateSiteSetting(cle, value);
    setSaving({ ...saving, [cle]: false });

    if (saveError) {
      if (saveError.code === '42501') {
        showMsg('Action non autorisee');
      } else {
        showMsg('Erreur: ' + saveError.message);
      }
      return;
    }

    showMsg(`${config.label} enregistre`);
  };

  if (loading) {
    return (
      <div className="admin-tab">
        <h3>Reglages du site</h3>
        <p className="admin-empty">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="admin-tab">
      <h3>Reglages du site</h3>
      <p style={{ fontSize: 12, color: 'var(--texte-doux)', marginBottom: 20 }}>
        Ces parametres sont utilises sur le site public et dans les communications.
      </p>

      {msg && <div className={`admin-msg ${msg.includes('Erreur') || msg.includes('non autorisee') ? 'err' : 'ok'}`}>{msg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {SETTINGS_CONFIG.map(config => (
          <div key={config.cle} className="admin-setting-row" style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            padding: '12px 0',
            borderBottom: '1px solid rgba(200, 134, 10, 0.1)'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--texte-principal)',
                marginBottom: 4
              }}>
                {config.label}
              </label>
              {config.type === 'select' ? (
                <select
                  value={settings[config.cle] || 'Europe/Paris'}
                  onChange={e => handleChange(config.cle, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    border: '1px solid rgba(200, 134, 10, 0.2)',
                    borderRadius: 4,
                    background: 'white'
                  }}
                >
                  {config.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={config.type === 'url' ? 'text' : config.type}
                  placeholder={config.placeholder}
                  value={settings[config.cle] || ''}
                  onChange={e => handleChange(config.cle, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    border: errors[config.cle] ? '1px solid #E24B4A' : '1px solid rgba(200, 134, 10, 0.2)',
                    borderRadius: 4
                  }}
                />
              )}
              {config.help && (
                <span style={{ fontSize: 11, color: 'var(--texte-doux)', marginTop: 4, display: 'block', fontStyle: 'italic' }}>
                  {config.help}
                </span>
              )}
              {errors[config.cle] && (
                <span style={{ fontSize: 11, color: '#E24B4A', marginTop: 4, display: 'block' }}>
                  {errors[config.cle]}
                </span>
              )}
            </div>
            <button
              className="admin-btn-primary"
              onClick={() => handleSave(config.cle)}
              disabled={saving[config.cle] || errors[config.cle]}
              style={{ marginTop: 20, padding: '8px 16px', fontSize: 11 }}
            >
              {saving[config.cle] ? '...' : 'Enregistrer'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
