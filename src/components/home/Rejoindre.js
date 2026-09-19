import React from 'react';
import { Link } from 'react-router-dom';
import { EGLISE } from '../../config/eglise';
import Icon from '../Icon';
import './Rejoindre.css';

export default function Rejoindre({ settings = {}, serviceEnCours }) {
  const hasLive = serviceEnCours?.lien_live?.trim();
  const facebookUrl = settings.facebook_url?.trim();
  const youtubeUrl = settings.youtube_url?.trim();

  return (
    <section className="rejoindre-section">
      <div className="rejoindre-container">
        <p className="rejoindre-label">Nous rejoindre</p>
        <p className="rejoindre-horaire">{EGLISE.horaireDominical.texte}</p>

        <div className="rejoindre-btns">
          {hasLive ? (
            <a
              href={serviceEnCours.lien_live}
              target="_blank"
              rel="noopener noreferrer"
              className="rejoindre-btn rejoindre-btn--live"
            >
              <span className="rejoindre-btn-dot" aria-hidden="true" />
              Rejoindre le live
            </a>
          ) : (
            <Link to="/cultes" className="rejoindre-btn rejoindre-btn--primary">
              Voir le programme
            </Link>
          )}
          <Link to="/formation" className="rejoindre-btn rejoindre-btn--secondary">
            Découvrir la formation
          </Link>
        </div>

        {(facebookUrl || youtubeUrl) && (
          <div className="rejoindre-socials">
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rejoindre-social"
                aria-label="Facebook"
              >
                <Icon name="facebook" size={20} />
              </a>
            )}
            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rejoindre-social"
                aria-label="YouTube"
              >
                <Icon name="youtube" size={20} />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
