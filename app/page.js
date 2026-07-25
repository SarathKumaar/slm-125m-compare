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

// The four live-demo models. closed-book -> {message}; grounded -> {context, question}.
const PANELS = [
  { key: 'chat', api: '/api/chat', mode: 'closed', name: 'SLM 125M', tag: 'Closed-book' },
  { key: 'gqa', api: '/api/gemma_qa', mode: 'closed', name: 'Gemma 2B', tag: 'Closed-book' },
  { key: 'raft', api: '/api/raft', mode: 'grounded', name: 'SLM 125M', tag: 'Grounded' },
  { key: 'graft', api: '/api/gemma_raft', mode: 'grounded', name: 'Gemma 2B', tag: 'Grounded' },
];

// Info cards — the assignment's required facts for every model.
const INFO = [
  {
    name: 'SLM 125M · base', repo: 'Sarath569/slm-125m-legal-base',
    params: '125.8M (all trainable)',
    arch: 'Llama-style decoder · 12 layers · 768 hidden · 12 heads · 1024 ctx · 16K BPE vocab',
    tokens: 'Pretrain ~8.16B (4 epochs over a 2.04B-token corpus)',
    cost: '~$29.5 (8× H100)',
  },
  {
    name: 'SLM 125M · QA SFT', repo: 'Sarath569/slm-125m-legal-chat',
    params: '125.8M (full fine-tune)',
    arch: 'Same as base (125M Llama-style)',
    tokens: 'Instruction/QA SFT (see note below)',
    cost: '~$0.42',
  },
  {
    name: 'SLM 125M · RAFT', repo: 'Sarath569/slm-125m-legal-raft',
    params: '125.8M (full fine-tune)',
    arch: 'Same as base (125M Llama-style)',
    tokens: '16.9M (3 epochs, grounded)',
    cost: '$0.13',
  },
  {
    name: 'Gemma 2B · base', repo: 'google/gemma-2-2b',
    params: '2.6B (pretrained by Google — we do not pretrain)',
    arch: 'Gemma-2 · 26 layers · 2304 hidden · 8 heads / 4 KV (GQA) · 8192 ctx · 256K vocab',
    tokens: 'Pretrained by Google',
    cost: '$0 (not pretrained by us)',
  },
  {
    name: 'Gemma 2B · QLoRA QA SFT', repo: 'Sarath569/gemma-2b-legal-qa',
    params: '20.8M trainable LoRA (1.28% of 2.6B)',
    arch: 'Gemma-2 2B + LoRA (r=16) · 4-bit NF4 base',
    tokens: '1.63M (3 epochs, closed-book)',
    cost: '$1.32',
  },
  {
    name: 'Gemma 2B · QLoRA RAFT', repo: 'Sarath569/gemma-2b-legal-raft',
    params: '20.8M trainable LoRA (1.28% of 2.6B)',
    arch: 'Gemma-2 2B + LoRA (r=16) · 4-bit NF4 base',
    tokens: '16.87M (3 epochs, grounded)',
    cost: '$2.94',
  },
];

export default function Home() {
  const [context, setContext] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState({});

  useEffect(() => {
    fetch('/api/warm').catch(() => {});
  }, []);

  async function ask() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setOut(Object.fromEntries(PANELS.map((p) => [p.key, { pending: true }])));
    const hasCtx = context.trim().length > 0;

    await Promise.all(
      PANELS.map(async (p) => {
        let result;
        if (p.mode === 'grounded' && !hasCtx) {
          result = { error: 'Add a context passage above to query the grounded models.' };
        } else {
          const body =
            p.mode === 'closed' ? { message: q } : { context, question: q };
          result = await fetch(p.api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
            .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
            .then(({ ok, data }) => (ok ? { text: data.reply } : { error: data.error }))
            .catch(() => ({ error: 'Network error.' }));
        }
        setOut((prev) => ({ ...prev, [p.key]: result }));
      })
    );
    setLoading(false);
  }

  function loadExample() {
    setContext(EXAMPLE.context);
    setQuestion(EXAMPLE.question);
    setOut({});
  }

  const renderPanel = (p) => {
    const r = out[p.key];
    return (
      <div key={p.key} className={`panel ${p.mode}`}>
        <div className="panelhead">
          <span className="badge">{p.name}</span>
          <a className="hf" href={`https://huggingface.co/${panelRepo(p.key)}`} target="_blank" rel="noreferrer">
            HF ↗
          </a>
        </div>
        <div className="answer">
          {!r && <span className="muted">—</span>}
          {r?.pending && (
            <span className="typing"><span></span><span></span><span></span></span>
          )}
          {r && !r.pending && r.error && <span className="err">{r.error}</span>}
          {r && !r.pending && r.text && <span>{r.text}</span>}
          {r && !r.pending && !r.error && !r.text && <span className="muted">(empty)</span>}
        </div>
      </div>
    );
  };

  return (
    <main className="wrap">
      <header className="header">
        <div className="titles">
          <h1>125M vs Gemma 2B · Closed-book vs Grounded</h1>
          <p className="sub">
            Four fine-tunes of two from-scratch/base models on the same legal-and-financial QA
            data. Ask a question (with a source passage) and compare <strong>closed-book</strong>{' '}
            (answer from memory) vs <strong>grounded / RAFT</strong> (answer from the passage),
            across a tiny <strong>125M</strong> model and <strong>Gemma 2B</strong>.
          </p>
        </div>
      </header>

      <div className="banner">
        ⚠️ Research demo. Not legal or financial advice. Gemma panels use a GPU server that
        cold-starts (~60s on first ask after idle).
      </div>

      <section className="inputs">
        <div className="field">
          <label>
            Context{' '}
            <span className="hint">— the grounded models read this; closed-book models never see it</span>
          </label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="Paste a passage (a court excerpt, an SEC filing paragraph, …)" rows={5} />
        </div>
        <div className="field">
          <label>Question</label>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the passage…" rows={2} />
        </div>
        <div className="actions">
          <button className="ghost" onClick={loadExample} disabled={loading}>Load example</button>
          <button className="primary" onClick={ask} disabled={loading || !question.trim()}>
            {loading ? 'Asking all models…' : 'Ask all models'}
          </button>
        </div>
      </section>

      <h2 className="rowlabel closed">Closed-book — answer from memory</h2>
      <section className="grid">{PANELS.filter((p) => p.mode === 'closed').map(renderPanel)}</section>

      <h2 className="rowlabel grounded">Grounded / RAFT — answer from the passage</h2>
      <section className="grid">{PANELS.filter((p) => p.mode === 'grounded').map(renderPanel)}</section>

      <h2 className="infotitle">The models</h2>
      <p className="infonote">
        Note: the SLM 125M QA-SFT was instruction-tuned on a general blend; the other three
        fine-tunes share the same corpus-derived QA dataset.
      </p>
      <section className="cards">
        {INFO.map((m) => (
          <div key={m.repo} className="card">
            <div className="cardhead">
              <span className="cardname">{m.name}</span>
              <a className="hf" href={`https://huggingface.co/${m.repo}`} target="_blank" rel="noreferrer">HF ↗</a>
            </div>
            <dl>
              <dt>Trainable params</dt><dd>{m.params}</dd>
              <dt>Architecture</dt><dd>{m.arch}</dd>
              <dt>Training tokens</dt><dd>{m.tokens}</dd>
              <dt>Training cost</dt><dd>{m.cost}</dd>
            </dl>
          </div>
        ))}
      </section>

      <footer className="foot">
        Six models: SLM-125M {'{'}base, QA-SFT, RAFT{'}'} + Gemma-2B {'{'}base, QLoRA QA-SFT, QLoRA RAFT{'}'}.
        Built from scratch (125M) / QLoRA-tuned (Gemma) on US case law + SEC filings.
      </footer>
    </main>
  );
}

function panelRepo(key) {
  return {
    chat: 'Sarath569/slm-125m-legal-chat',
    gqa: 'Sarath569/gemma-2b-legal-qa',
    raft: 'Sarath569/slm-125m-legal-raft',
    graft: 'Sarath569/gemma-2b-legal-raft',
  }[key];
}
