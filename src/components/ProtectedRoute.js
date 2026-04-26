import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getEleveSession } from '../lib/supabase';

export default function ProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    getEleveSession().then(s => {
      setSession(s);
      setChecked(true);
    });
  }, []);

  if (!checked) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--creme)', fontFamily:'var(--font-display)', fontStyle:'italic', color:'var(--texte-doux)', fontSize:18 }}>
      Chargement…
    </div>
  );

  if (!session) return <Navigate to="/eleve/login" replace />;
  return children;
}
