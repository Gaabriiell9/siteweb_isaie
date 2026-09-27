import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/client';
import './EleveLogin.css';

export default function EleveBienvenue() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setSessionReady(true);
      } else {
        setError('Ce lien n\'est plus valide. Contacte l\'administration pour recevoir une nouvelle invitation.');
      }
    };
    checkSession();
  }, []);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === passwordConfirm;
  const canSubmit = passwordValid && passwordsMatch && sessionReady;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setLoading(false);
      if (updateError.message?.includes('expired') || updateError.message?.includes('invalid')) {
        setError('Ce lien n\'est plus valide. Demande a l\'administration de te renvoyer une invitation.');
      } else if (updateError.message?.includes('weak') || updateError.message?.includes('short')) {
        setError('Le mot de passe est trop faible. Utilise au moins 8 caracteres.');
      } else {
        setError(updateError.message || 'Une erreur est survenue. Reessaie.');
      }
      return;
    }

    navigate('/eleve');
  };

  return (
    <div className="el-login-wrap">
      <div className="el-login-card">
        <div className="el-login-card-top" />

        <div className="el-login-logo">ETC</div>

        <h1 className="el-login-titre">Bienvenue</h1>
        <p className="el-login-sub">Cree ton mot de passe</p>

        {error && (
          <div className="el-login-error" style={{
            background: 'rgba(192,57,43,0.08)',
            border: '1px solid rgba(192,57,43,0.2)',
            color: 'var(--statut-erreur)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            lineHeight: '1.5',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form className="el-login-form" onSubmit={handleSubmit}>
          <div className="el-login-field">
            <label className="el-login-label">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caracteres"
              autoComplete="new-password"
              disabled={!sessionReady}
            />
            {password && !passwordValid && (
              <span style={{ fontSize: '12px', color: 'var(--statut-erreur)', marginTop: '4px' }}>
                Le mot de passe doit contenir au moins 8 caracteres
              </span>
            )}
          </div>

          <div className="el-login-field">
            <label className="el-login-label">Confirmer le mot de passe</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repete ton mot de passe"
              autoComplete="new-password"
              disabled={!sessionReady}
            />
            {passwordConfirm && !passwordsMatch && (
              <span style={{ fontSize: '12px', color: 'var(--statut-erreur)', marginTop: '4px' }}>
                Les mots de passe ne correspondent pas
              </span>
            )}
          </div>

          <button
            type="submit"
            className="el-login-btn"
            disabled={!canSubmit || loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Creation en cours...' : 'Creer mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
