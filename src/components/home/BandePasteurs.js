import React from 'react';
import { Link } from 'react-router-dom';
import { EGLISE } from '../../config/eglise';
import './BandePasteurs.css';

export default function BandePasteurs() {
  return (
    <section className="pasteurs-section">
      <div className="pasteurs-container">
        <blockquote className="pasteurs-citation">
          "{EGLISE.citationPasteurs}"
        </blockquote>
        <Link to="/pasteur" className="pasteurs-btn">
          Rencontrer nos pasteurs
        </Link>
      </div>
    </section>
  );
}
