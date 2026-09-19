import React from 'react';
import Icon from '../Icon';
import './MessageDuJour.css';

export default function MessageDuJour({ message, loading = false }) {
  if (loading) {
    return (
      <section className="message-section">
        <div className="message-container">
          <div className="message-skeleton" />
        </div>
      </section>
    );
  }

  if (!message) return null;

  return (
    <section className="message-section">
      <div className="message-container">
        <div className="message-card">
          <div className="message-icon">
            <Icon name="mountain" size={32} />
          </div>
          <p className="message-label">Message du jour</p>
          {message.verset && (
            <blockquote className="message-verset">
              "{message.verset}"
            </blockquote>
          )}
          {message.titre && (
            <h3 className="message-titre">{message.titre}</h3>
          )}
          <p className="message-contenu">{message.contenu}</p>
          <div className="message-meta">
            <span className="message-famille">{message.famille}</span>
            <span className="message-jour">{message.jour_semaine}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
