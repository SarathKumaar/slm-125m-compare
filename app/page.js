'use client';

import { useEffect, useState } from 'react';

const EXAMPLE = {
  context:
    'The Company reported net revenue of $4.2 billion for fiscal 2023, an increase of 12% over ' +
    'the prior year, driven primarily by growth in its cloud services segment. Operating margin ' +
    'was 18%, and the Board of Directors declared a quarterly dividend of $0.25 per share payable ' +
    'in March 2024. The Company also disclosed that substantially all of its assets were pledged ' +
    'as collateral under its senior secured credit facility.',
  question: 'What was the Company’s net revenue for fiscal 2023 and how did it change?',
};

const MODELS = {
  chat: {
    name: 'Closed-book',
    repo: 'Sarath569/slm-125m-legal-chat',
    blurb: 'Answers from memory only — never sees the context.',
  },
  raft: {
    name: 'Grounded (RAFT)',
    repo: 'Sarath569/slm-125m-legal-raft',
    blurb: 'Reads the context and answers from it (or declines).',
  },
};

export default function Home() {
  const [context, setContext] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState({ chat: null, raft: null });

  // Warm the container on load (/health loads both models) so the first ask isn't a full cold start.
  useEffect(() => {
    fetch('/api/warm').catch(() => {});
  }, []);

  async function ask() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setOut({ chat: { pending: true }, raft: { pending: true } });

    const chatP = fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q }),
    })
      .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
      .then(({ ok, data }) => ({ text: ok ? data.reply : null, error: ok ? null : data.error }))
      .catch(() => ({ text: null, error: 'Network error.' }));

    const hasContext = context.trim().length > 0;
    const raftP = hasContext
      ? fetch('/api/raft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, question: q }),
        })
          .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
          .then(({ ok, data }) => ({ text: ok ? data.reply : null, error: ok ? null : data.error }))
          .catch(() => ({ text: null, error: 'Network error.' }))
      : Promise.resolve({
          text: null,
          error: 'Add a context passage above to query the grounded model.',
        });

    const [chat, raft] = await Promise.all([chatP, raftP]);
    setOut({ chat, raft });
    setLoading(false);
  }

  function loadExample() {
    setContext(EXAMPLE.context);
    setQuestion(EXAMPLE.question);
    setOut({ chat: null, raft: null });
  }

  return (
    <main className="wrap">
      <header className="header">
        <div className="titles">
          <h1>SLM-125M · Closed-book vs Grounded</h1>
          <p className="sub">
            Two 125M-parameter models trained from scratch on US case law, SEC filings &amp; web
            text. Ask the same question and compare a <strong>closed-book</strong> model (answers
            from memory) against a <strong>grounded / RAFT</strong> model (answers from a passage
            you provide).
          </p>
        </div>
      </header>

      <div className="banner">
        ⚠️ Research demo. These are tiny (~126M) models — fluent but often wrong. Not legal or
        financial advice.
      </div>

      <section className="inputs">
        <div className="field">
          <label>
            Context{' '}
            <span className="hint">
              — the grounded model reads this; the closed-book one never sees it
            </span>
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Paste a passage (a court excerpt, an SEC filing paragraph, …)"
            rows={5}
          />
        </div>
        <div className="field">
          <label>Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the passage…"
            rows={2}
          />
        </div>
        <div className="actions">
          <button className="ghost" onClick={loadExample} disabled={loading}>
            Load example
          </button>
          <button className="primary" onClick={ask} disabled={loading || !question.trim()}>
            {loading ? 'Asking both…' : 'Ask both models'}
          </button>
        </div>
      </section>

      <section className="grid">
        {['chat', 'raft'].map((key) => {
          const m = MODELS[key];
          const r = out[key];
          return (
            <div key={key} className={`panel ${key}`}>
              <div className="panelhead">
                <div>
                  <span className="badge">{m.name}</span>
                  <p className="blurb">{m.blurb}</p>
                </div>
                <a
                  className="hf"
                  href={`https://huggingface.co/${m.repo}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Model ↗
                </a>
              </div>
              <div className="answer">
                {!r && <span className="muted">Answer will appear here.</span>}
                {r?.pending && (
                  <span className="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                )}
                {r && !r.pending && r.error && <span className="err">{r.error}</span>}
                {r && !r.pending && r.text && <span>{r.text}</span>}
                {r && !r.pending && !r.error && !r.text && (
                  <span className="muted">(empty reply)</span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="foot">
        First ask after idle can take ~20–40s (the model server cold-starts, loading both models).
        Later replies are faster.
      </footer>
    </main>
  );
}
