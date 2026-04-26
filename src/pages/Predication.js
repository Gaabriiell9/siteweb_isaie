import React, { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getVideos } from '../lib/supabase';
import './Predication.css';
import Icon from '../components/Icon';

function getYtId(url) { const m=url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([^?&\s]+)/); return m?m[1]:null; }

export default function Predication() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  useEffect(() => { getVideos().then(d=>{setVideos(d);setLoading(false);}); }, []);
  return (
    <div>
      <SectionHeader label="Parole" title="Chaîne de" titleEm="Prédication" subtitle="Vidéos partagées par le service de communication" />
      <div className="pred-wrap">
        <div className="container">
          {loading && <p style={{color:'var(--texte-doux)'}}>Chargement…</p>}
          {!loading && videos.length===0 && (
            <div style={{textAlign:'center',padding:'60px 0',color:'var(--texte-doux)'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:48,fontStyle:'italic',color:'var(--or)',marginBottom:12}}>✦</div>
              <p style={{fontFamily:'var(--font-display)',fontStyle:'italic',fontSize:18}}>Aucune vidéo publiée pour l'instant.</p>
            </div>
          )}
          <div className="pred-grid">
            {videos.map(v => {
              const ytId = getYtId(v.youtube_url);
              return (
                <div className={`pred-card${selectedVideo === v.id ? ' pred-card--active' : ''}`} key={v.id}>
                  <div className="pred-thumb">
                    {selectedVideo === v.id ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                        title={v.titre}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}
                      />
                    ) : (
                      <>
                        {ytId && <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={v.titre} />}
                        <div className="pred-play">
                          <button className="pred-play-btn" onClick={() => setSelectedVideo(v.id)}><Icon name="play" size={18} /></button>
                        </div>
                        {v.is_live && <div className="pred-live-badge"><span className="pred-live-dot" />EN DIRECT</div>}
                        <div className="pred-date-chip">{new Date(v.date_publi).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                        {selectedVideo !== null && selectedVideo !== v.id && <div className="pred-en-lecture-badge">En lecture</div>}
                      </>
                    )}
                  </div>
                  <div className="pred-info">
                    <h3 className="pred-titre">{v.titre}</h3>
                    {v.legende && <div className="pred-legende">{v.legende}</div>}
                    {expanded===v.id && v.description && <p className="pred-desc">{v.description}</p>}
                    {v.description && <button className="pred-toggle" onClick={()=>setExpanded(expanded===v.id?null:v.id)}>{expanded===v.id?'↑ Fermer':'↓ Description'}</button>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="encart-or">
            <span>✦</span>
            Les vidéos sont publiées par le service de communication de l'Église Temple de la Célébration.
          </div>
        </div>
      </div>
    </div>
  );
}
