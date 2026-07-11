'use client';

import { useEffect, useRef, useState } from 'react';

const SUGGESTIONS = [
  'What is the difference between a contract and a tort?',
  'Explain in simple terms what a 10-K filing is.',
  'Give me three tips for saving money.',
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Warm the model container on load so the first reply isn't a full cold start.
  useEffect(() => {
    fetch('/api/warm').catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'error', text: data.error || 'Something went wrong.' }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: data.reply || '(empty reply)' }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'error', text: 'Network error. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <main className="wrap">
      <header className="header">
        <div className="titles">
          <h1>SLM-125M · Legal / Financial Chat</h1>
          <p className="sub">
            A 125M-parameter model trained from scratch on US case law, SEC filings &amp; web text,
            then instruction-tuned.
          </p>
        </div>
        <a
          className="hf"
          href="https://huggingface.co/Sarath569/slm-125m-legal-chat"
          target="_blank"
          rel="noreferrer"
        >
          Model ↗
        </a>
      </header>

      <div className="banner">
        ⚠️ Research demo. This is a tiny (~126M) model — it is fluent but often factually wrong.
        Not legal or financial advice.
      </div>

      <div className="chat" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty">
            <p>Ask it something to get started:</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`row ${m.role}`}>
            <div className={`bubble ${m.role}`}>{m.text}</div>
          </div>
        ))}

        {loading && (
          <div className="row assistant">
            <div className="bubble assistant typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about law, finance, or anything…"
          rows={1}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}>
          {loading ? '…' : 'Send'}
        </button>
      </div>
      <footer className="foot">
        First message after idle can take ~20–40s (the model server cold-starts). Later replies are
        faster.
      </footer>
    </main>
  );
}
