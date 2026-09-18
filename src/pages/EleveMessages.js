import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEleve } from './EleveLayout';
import {
  getConversationResume,
  getMessagesEleve,
  envoyerMessageEleve,
  marquerMessagesLusEleve,
  supabase,
  IS_MOCK,
} from '../lib/supabase';
import './EleveMessages.css';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'A l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function EleveMessages() {
  const { eleve, refreshBadges } = useEleve();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const eleveIdRef = useRef(null);

  const loadConversation = useCallback(async () => {
    if (!eleve || !eleve.id) return;
    const data = await getConversationResume(eleve.id);
    setConversation(data);
  }, [eleve]);

  const loadMessages = useCallback(async () => {
    if (!eleve || !eleve.id) return;
    const msgs = await getMessagesEleve(eleve.id);
    setMessages(msgs);
  }, [eleve]);

  useEffect(() => {
    if (eleve?.id) {
      eleveIdRef.current = eleve.id;
    }
  }, [eleve]);

  useEffect(() => {
    if (!eleve || !eleve.id) return;
    loadConversation();
    loadMessages().then(() => {
      marquerMessagesLusEleve(eleve.id).then(() => {
        if (refreshBadges) refreshBadges();
      });
    });
  }, [eleve, loadConversation, loadMessages, refreshBadges]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!eleve || IS_MOCK) return;

    const channel = supabase
      .channel(`messages_eleve_${eleve.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `eleve_id=eq.${eleve.id}`,
      }, (payload) => {
        const msg = payload.new;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        loadConversation();
        if (msg.sender_role === 'admin') {
          marquerMessagesLusEleve(eleveIdRef.current);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eleve, loadConversation]);

  useEffect(() => {
    if (!eleve || IS_MOCK) return;
    const interval = setInterval(async () => {
      const msgs = await getMessagesEleve(eleve.id);
      setMessages(prev => {
        if (msgs.length === prev.length && msgs.every((m, i) => m.id === prev[i]?.id)) return prev;
        return msgs;
      });
      loadConversation();
    }, 30000);
    return () => clearInterval(interval);
  }, [eleve, loadConversation]);

  const handleSend = async () => {
    if (!texte.trim() || !eleve || sending) return;
    const content = texte.trim();
    const tempId = `temp-${Date.now()}`;
    const tempMsg = { id: tempId, contenu: content, sender_role: 'eleve', created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setTexte('');
    setSending(true);
    const { data: newMsg, error } = await envoyerMessageEleve(eleve.id, content);
    if (error) {
      console.error('Erreur envoi message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? (newMsg || tempMsg) : m));
    }
    await loadConversation();
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>messages</em></h1>

      <div className="em-layout">
        <div className="em-sidebar">
          <div className="em-sidebar-header">
            <div className="em-sidebar-title">Conversations</div>
          </div>
          <div className="em-convs">
            {conversation && (
              <div className="em-conv-item active">
                <div className="em-conv-avatar">AD</div>
                <div className="em-conv-body">
                  <div className="em-conv-name">{conversation.partner_name}</div>
                  <div className="em-conv-preview">{conversation.last_message || 'Aucun message'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className="em-conv-time">{formatTime(conversation.last_at)}</span>
                  {conversation.unread_count > 0 && (
                    <span className="em-conv-badge">{conversation.unread_count}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="em-conv">
          <div className="em-conv-header">
            <div className="em-conv-avatar" style={{ width: 36, height: 36, fontSize: '0.7rem' }}>AD</div>
            <div>
              <div className="em-conv-header-name">Administration E.T.C</div>
              <div className="em-conv-header-sub">Equipe pastorale</div>
            </div>
          </div>

          <div className="em-messages">
            {messages.length === 0 && (
              <div className="em-empty-conv">
                Demarrez la conversation en envoyant un message ci-dessous.
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`em-msg em-msg--${msg.sender_role === 'admin' ? 'admin' : 'eleve'}`}
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
              placeholder="Votre message..."
              value={texte}
              onChange={e => setTexte(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={5000}
            />
            <button
              className="em-send-btn"
              onClick={handleSend}
              disabled={!texte.trim() || sending}
              aria-label="Envoyer le message"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
