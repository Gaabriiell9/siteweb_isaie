import React from 'react';
import Icon from './Icon';
import './AdminActionButtons.css';

export default function AdminActionButtons({
  item,
  onToggleVisible,
  onEdit,
  onDelete,
  deleteLabel = 'Supprimer',
}) {
  return (
    <div className="admin-actions">
      <button
        className="admin-action-btn"
        onClick={() => onToggleVisible(item)}
        title={item.visible ? 'Masquer' : 'Afficher'}
        aria-label={item.visible ? 'Masquer' : 'Afficher'}
      >
        <Icon name={item.visible ? 'eye' : 'eye-off'} size={16} />
      </button>
      <button
        className="admin-action-btn"
        onClick={() => onEdit(item)}
        title="Modifier"
        aria-label="Modifier"
      >
        <Icon name="pencil" size={16} />
      </button>
      <button
        className="admin-action-btn admin-action-btn--delete"
        onClick={() => {
          if (window.confirm(`${deleteLabel} ?`)) {
            onDelete(item.id);
          }
        }}
        title="Supprimer"
        aria-label="Supprimer"
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}
