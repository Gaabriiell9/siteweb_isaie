/**
 * FormGrid - Grille de formulaire responsive
 * 1 colonne sous 640px, 2 colonnes au-dessus
 */

import React from 'react';
import './FormGrid.css';

export function FormGrid({ children, className = '' }) {
  return (
    <div className={`admin-form-grid ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  required = false,
  error,
  hint,
  fullWidth = false,
  children,
  className = '',
  htmlFor,
}) {
  return (
    <div className={`admin-field ${fullWidth ? 'admin-field--full' : ''} ${error ? 'admin-field--error' : ''} ${className}`}>
      {label && (
        <label className="admin-field-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="admin-field-required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="admin-field-input">
        {children}
      </div>
      {error && <span className="admin-field-error" role="alert">{error}</span>}
      {hint && !error && <span className="admin-field-hint">{hint}</span>}
    </div>
  );
}

export function FormActions({ children, sticky = false, className = '' }) {
  return (
    <div className={`admin-form-actions ${sticky ? 'admin-form-actions--sticky' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function FormSection({ title, children, className = '' }) {
  return (
    <div className={`admin-form-section ${className}`}>
      {title && <h3 className="admin-form-section-title">{title}</h3>}
      {children}
    </div>
  );
}
