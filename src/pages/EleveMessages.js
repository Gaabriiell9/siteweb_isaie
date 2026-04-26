import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEleve } from './EleveLayout';
import {
  getConversations,
  getMessagesWithEleve,
  envoyerMessageEleve,
  marquerMessagesLus,
  supabase,
  IS_MOCK,
} from '../lib/supabase';
import './EleveMessages.css';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function EleveMessages() {
  const { eleve } = useEleve();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    if (!eleve) return;
    const data = await getConversations(eleve.id);
    setConversations(data);
  }, [eleve]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!eleve) return;
    const msgs = await getMessagesWithEleve(eleve.id);
    setMessages(msgs);
  }, [eleve]);

  const openConversation = async (conv) => {
    setSelected(conv);
    await loadMessages();
    await marquerMessagesLus(eleve.id);
    loadConversations();
  };

  // Auto-ouvrir la conversation admin au montage
  useEffect(() => {
    if (!eleve) return;
    const adminConv = { partner_id: 'admin', partner_name: 'Administration E·T·C' };
    setSelected(adminConv);
    loadMessages();
  }, [eleve, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription (best-effort)
  useEffect(() => {
    if (!eleve || IS_MOCK) return;
    const channel = supabase
      .channel(`messages_eleve_${eleve.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, (payload) => {
        const msg = payload.new;
        if (msg.destinataire_id !== eleve.id && msg.expediteur_id !== eleve.id) return;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eleve, loadConversations]);

  // Polling de secours toutes les 3s (couvre les envs où Realtime WebSocket ne passe pas)
  useEffect(() => {
    if (!eleve || IS_MOCK) return;
    const interval = setInterval(async () => {
      const msgs = await getMessagesWithEleve(eleve.id);
      setMessages(prev => {
        if (msgs.length === prev.length && msgs.every((m, i) => m.id === prev[i]?.id)) return prev;
        return msgs;
      });
      loadConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [eleve, loadConversations]);

  const handleSend = async () => {
    if (!texte.trim() || !eleve || sending) return;
    const content = texte.trim();
    const tempId = `temp-${Date.now()}`;
    const tempMsg = { id: tempId, contenu: content, expediteur_type: 'eleve', created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setTexte('');
    setSending(true);
    const { data: newMsg, error } = await envoyerMessageEleve(content);
    if (error) {
      console.error('Erreur envoi message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? (newMsg || tempMsg) : m));
    }
    await loadConversations();
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = conversations.filter(c =>
    !search || c.partner_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>messages</em></h1>

      <div className="em-layout">
        {/* Sidebar conversations */}
        <div className="em-sidebar">
          <div className="em-sidebar-header">
            <div className="em-sidebar-title">Conversations</div>
            <input
              className="em-search"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="em-convs">
            {filtered.length === 0 && (
              <div style={{ padding: '24px 14px', color: 'var(--texte-doux)', fontSize: '0.83rem', fontStyle: 'italic' }}>
                Aucune conversation.
              </div>
            )}
            {filtered.map(conv => (
              <div
                key={conv.partner_id}
                className={`em-conv-item${selected?.partner_id === conv.partner_id ? ' active' : ''}`}
                onClick={() => openConversation(conv)}
              >
                <div className="em-conv-avatar">
                  {conv.partner_name ? conv.partner_name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="em-conv-body">
                  <div className="em-conv-name">{conv.partner_name}</div>
                  <div className="em-conv-preview">{conv.last_message || 'Aucun message'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className="em-conv-time">{formatTime(conv.last_at)}</span>
                  {conv.unread_count > 0 && (
                    <span className="em-conv-badge">{conv.unread_count}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation panel */}
        {selected ? (
          <div className="em-conv">
            <div className="em-conv-header">
              <div className="em-conv-avatar" style={{ width: 36, height: 36, fontSize: '0.7rem' }}>
                {selected.partner_name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div>
                <div className="em-conv-header-name">{selected.partner_name || 'Administration'}</div>
                <div className="em-conv-header-sub">Équipe pastorale E·T·C</div>
              </div>
            </div>

            <div className="em-messages">
              {messages.length === 0 && (
                <div className="em-empty-conv">
                  Démarrez la conversation en envoyant un message ci-dessous.
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`em-msg em-msg--${msg.expediteur_type === 'admin' ? 'admin' : 'eleve'}`}
                >
                  <div className="em-msg-bubble">{msg.contenu}</div>
                  <div className="em-msg-meta">{formatTime(msg.created_at)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="em-input-area">
              <textarea
                className="em-textarea"
                placeholder="Votre message…"
                value={texte}
                onChange={e => setTexte(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button className="em-send-btn" onClick={handleSend} disabled={!texte.trim() || sending}>
                Envoyer
              </button>
            </div>
          </div>
        ) : (
          <div className="em-no-selection">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Sélectionnez une conversation<br />pour afficher les messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
