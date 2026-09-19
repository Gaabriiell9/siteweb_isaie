import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { extractYoutubeId } from '../../lib/youtube';
import Icon from '../Icon';
import './DernierePredication.css';

export default function DernierePredication({ video, loading = false }) {
  const [playing, setPlaying] = useState(false);

  if (loading) {
    return (
      <section className="predication-section">
        <div className="predication-container">
          <div className="predication-skeleton" />
        </div>
      </section>
    );
  }

  if (!video) return null;

  const ytId = extractYoutubeId(video.youtube_url);
  const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null;

  const handlePlay = () => {
    setPlaying(true);
  };

  return (
    <section className="predication-section">
      <div className="predication-container">
        <div className="predication-header">
          <div>
            <p className="section-label">Dernière prédication</p>
            <h2 className="section-title">Parole du <em>Seigneur</em></h2>
          </div>
          <Link to="/predication" className="predication-link">
            Toutes les prédications
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>

        <div className="predication-card">
          <div className="predication-player">
            {playing ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                title={video.titre}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                className="predication-thumb"
                onClick={handlePlay}
                aria-label={`Lire la vidéo : ${video.titre}`}
              >
                {thumbUrl && (
                  <img src={thumbUrl} alt="" loading="lazy" />
                )}
                <span className="predication-play">
                  <Icon name="play" size={32} />
                </span>
              </button>
            )}
          </div>
          <div className="predication-info">
            <h3 className="predication-titre">{video.titre}</h3>
            {video.legende && (
              <p className="predication-legende">{video.legende}</p>
            )}
            {video.description && (
              <p className="predication-desc">{video.description}</p>
            )}
            <span className="predication-date">
              {new Date(video.date_publi).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
