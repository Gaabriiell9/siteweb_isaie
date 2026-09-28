import React from 'react';
import { EGLISE } from '../../config/eglise';
import './CarteFrance.css';

export default function CarteFrance({ className = '' }) {
  return (
    <div
      className={`carte-france ${className}`}
      role="img"
      aria-label="Carte de la France, avec Bordeaux marquée"
    >
      <svg
        viewBox="0 0 100 100"
        className="carte-france-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Contour simplifié de la France métropolitaine */}
        <path
          className="carte-france-contour"
          d="M50 5
             C55 5, 65 8, 70 12
             Q75 15, 78 20
             Q82 28, 85 35
             Q88 42, 90 50
             Q88 58, 85 65
             Q80 75, 72 82
             Q65 88, 55 92
             Q48 95, 42 93
             Q35 90, 28 85
             Q20 78, 15 70
             Q10 60, 12 50
             Q14 40, 18 32
             Q22 24, 28 18
             Q35 10, 42 6
             Q46 5, 50 5
             Z"
          fill="none"
        />

        {/* Point Bordeaux (approximativement 44.84N, 0.58O -> x~28, y~55) */}
        <circle
          className="carte-france-point-pulse"
          cx="28"
          cy="55"
          r="6"
        />
        <circle
          className="carte-france-point"
          cx="28"
          cy="55"
          r="3"
        />

        {/* Étiquette Bordeaux */}
        <text
          className="carte-france-label"
          x="28"
          y="68"
          textAnchor="middle"
        >
          {EGLISE.localisation.ville}
        </text>
      </svg>

      <p className="carte-france-texte">{EGLISE.localisation.texte}</p>
    </div>
  );
}
