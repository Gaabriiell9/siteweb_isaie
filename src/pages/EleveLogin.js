import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInEleve, getEleveStatut } from '../lib/supabase';
import './EleveLogin.css';

export default function EleveLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'suspendu' | 'termine' | 'error'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorType('');
    setLoading(true);

    const { data, error: err } = await signInEleve(email, password);
    if (err) {
      setLoading(false);
      setError(err.message);
      setErrorType('error');
      return;
    }

    // Vérifier le statut de l'élève
    const userId = data?.user?.id;
    if (userId) {
      const statut = await getEleveStatut(userId);
      setLoading(false);

      if (statut === 'suspendu') {
        setErrorType('suspendu');
        setError(
          'Votre compte a été suspendu. Contactez le responsable de la formation pour plus d\'informations.'
        );
        return;
      }
      if (statut === 'termine') {
        setErrorType('termine');
        setError(
          'Vous avez complété la formation. Votre accès reste disponible en lecture seule.'
        );
        // Toujours rediriger — l'espace élève gère le mode archive
        navigate('/eleve/dashboard');
        return;
      }
    } else {
      setLoading(false);
    }

    navigate('/eleve/dashboard');
  };

  return (
    <div className="el-login-wrap">
      <div className="el-login-card">
        <div className="el-login-card-top" />
        <div className="el-login-logo">
          <span>E·T·C</span>
        </div>
        <h2 className="el-login-titre">Espace Élève</h2>
        <p className="el-login-sub">Formation en Théologie Biblique</p>

        <form className="el-login-form" onSubmit={handleSubmit}>
          <div className="el-login-field">
            <label className="el-login-label">Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>
          <div className="el-login-field">
            <label className="el-login-label">Mot de passe</label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className={`el-login-error ${errorType === 'suspendu' ? 'el-login-error--warn' : ''}`}>
              {error}
            </div>
          )}
          <button type="submit" className="el-login-btn" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="el-login-links">
          <span className="el-login-forgot">Mot de passe oublié ? Contactez l'administration.</span>
          <Link to="/" className="el-login-back">← Retour au site</Link>
        </div>

        <div className="el-login-register">
          Pas encore inscrit ?{' '}
          <Link to="/formation/inscription" className="el-login-register-link">
            S'inscrire à la formation →
          </Link>
        </div>
      </div>
    </div>
  );
}
