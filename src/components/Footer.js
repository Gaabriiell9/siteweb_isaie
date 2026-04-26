import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--noir)',
      borderTop: '1px solid rgba(200,134,10,0.15)',
      padding: '40px 24px 32px',
      textAlign: 'center',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:16 }}>
        <div style={{ flex:1, maxWidth:60, height:1, background:'linear-gradient(90deg,transparent,rgba(200,134,10,0.3))' }}/>
        <div style={{ width:6, height:6, border:'1px solid var(--or)', transform:'rotate(45deg)' }}/>
        <div style={{ flex:1, maxWidth:60, height:1, background:'linear-gradient(90deg,rgba(200,134,10,0.3),transparent)' }}/>
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontStyle:'italic', color:'var(--or-clair)', marginBottom:8 }}>
        Église Temple de la Célébration
      </div>
      <div style={{ fontSize:9, letterSpacing:3, textTransform:'uppercase', color:'rgba(255,248,240,0.25)', fontWeight:400 }}>
        E · T · C &nbsp;·&nbsp; Dieu par l'adoration et la louange
      </div>
      <div style={{ marginTop:20, fontSize:11, color:'rgba(255,248,240,0.15)' }}>
        © {new Date().getFullYear()} Église Temple de la Célébration
      </div>
      <div style={{ marginTop:16, borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:14 }}>
        <Link to="/eleve/login" style={{
          fontFamily:'var(--font-ui)', fontSize:9, letterSpacing:'2px',
          textTransform:'uppercase', color:'rgba(255,248,240,0.2)',
          textDecoration:'none', transition:'color 0.2s',
        }}
          onMouseEnter={e => e.target.style.color='rgba(255,248,240,0.5)'}
          onMouseLeave={e => e.target.style.color='rgba(255,248,240,0.2)'}
        >
          Espace élève
        </Link>
      </div>
    </footer>
  );
}
