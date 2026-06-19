import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  ExternalLink,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import './styles.css';

const toPercent = (value) => Math.round((Number(value) || 0) * 100);

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function scoreTone(value) {
  if (value >= 0.7) return 'green';
  if (value >= 0.45) return 'amber';
  return 'red';
}

function confidenceTone(confidence) {
  if (confidence === 'high') return 'green';
  if (confidence === 'medium') return 'amber';
  return 'red';
}

function coverageTone(status) {
  if (status === 'absent') return 'green';
  if (status === 'partially_covered') return 'amber';
  if (status === 'covered') return 'amber';
  return 'red';
}

function ScoreBar({ label, value, hint }) {
  return (
    <div className="score-row">
      <div>
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <div className="score-track">
        <i className={scoreTone(value)} style={{ width: `${toPercent(value)}%` }} />
      </div>
      <b>{toPercent(value)}</b>
    </div>
  );
}

function OpportunityCard({ item, selected, onClick }) {
  const risks = asArray(item.risks);
  return (
    <button className={`opp-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="opp-top">
        <div>
          <h3>{item.name || 'Unnamed opportunity'}</h3>
          <p>{item.subtitle || item.buy_recommendation || 'Retail opportunity'}</p>
        </div>
        <div className={`score-pill ${scoreTone(item.composite_score)}`}>{toPercent(item.composite_score)}</div>
      </div>

      <div className="opp-badges">
        <Badge tone={item.action === 'WATCH' ? 'amber' : 'green'}>{item.action || 'REVIEW'}</Badge>
        <Badge tone={confidenceTone(item.confidence)}>{item.confidence || 'unknown'}</Badge>
        <Badge tone={coverageTone(item.coverage_status)}>
          {(item.coverage_status || 'unknown').replaceAll('_', ' ')}
        </Badge>
      </div>

      <div className="mini-risk">
        {risks.slice(0, 2).map((risk) => (
          <span key={risk.name || risk}>⚠ {risk.name || risk}</span>
        ))}
      </div>
    </button>
  );
}

function ContextPanel({ context, activeContext, setActiveContext }) {
  const comparisonMarkets = asArray(context.comparisonMarkets);
  return (
    <aside className="context-card">
      <div className="section-title">
        <SlidersHorizontal size={17} /> Retailer Context
      </div>

      <label>Demo context</label>
      <div className="segmented">
        <button className={activeContext === 'outdoor' ? 'active' : ''} onClick={() => setActiveContext('outdoor')}>
          Outdoor
        </button>
        <button className={activeContext === 'cycling' ? 'active' : ''} onClick={() => setActiveContext('cycling')}>
          Cycling
        </button>
      </div>

      <div className="context-list">
        <div><span>Target</span><b>{context.targetMarket}</b></div>
        <div><span>Category</span><b>{context.category}</b></div>
        <div><span>Persona</span><b>{context.persona}</b></div>
        <div><span>Early markets</span><b>{comparisonMarkets.join(' · ')}</b></div>
      </div>

      <div className="weights">
        <span>Scoring weights</span>
        <div><i /><i /><i /><i /></div>
        <small>Breadth · Momentum · Transferability · Coverage Gap</small>
      </div>
    </aside>
  );
}

function Detail({ item }) {
  if (!item) {
    return <section className="detail empty">Select an opportunity.</section>;
  }

  const risks = asArray(item.risks);
  const signals = asArray(item.signals);
  const triggers = asArray(item.monitor_triggers);
  const scores = item.scores || {};

  return (
    <section className="detail">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Opportunity detail</p>
          <h2>{item.name}</h2>
          <p className="detail-sub">
            First observed: <b>{item.first_observed_market || 'unknown'}</b> · Stage:{' '}
            <b>{item.trend_stage || 'unknown'}</b>
          </p>
        </div>
        <Badge tone={item.urgency === 'act_now' ? 'green' : 'amber'}>
          {item.urgency === 'act_now' ? 'ACT NOW' : 'WATCH'}
        </Badge>
      </div>

      <div className="why-grid">
        <article>
          <Search size={18} />
          <h4>Why trending</h4>
          <p>{item.explainability?.why_trending || 'No explanation available.'}</p>
        </article>
        <article>
          <Layers size={18} />
          <h4>Why Switzerland</h4>
          <p>{item.explainability?.why_fits_switzerland || 'No explanation available.'}</p>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <h4>Why now</h4>
          <p>{item.explainability?.why_opportunity_now || 'No explanation available.'}</p>
        </article>
      </div>

      <div className="detail-grid">
        <article className="panel">
          <div className="section-title">
            <BarChart3 size={18} /> Score breakdown
          </div>
          <ScoreBar label="Trend" hint="momentum + spread" value={scores.trend ?? scores?.trend?.total ?? 0} />
          <ScoreBar label="Transferability" hint="Swiss fit" value={scores.transferability ?? scores?.transferability?.total ?? 0} />
          <ScoreBar label="Opportunity" hint="shelf gap + access" value={scores.opportunity ?? scores?.opportunity?.total ?? 0} />
          <ScoreBar label="Coverage gap" hint="assortment gap" value={scores.coverage_gap ?? 0} />
          <ScoreBar label="Composite" hint="weighted average" value={item.composite_score ?? 0} />
        </article>

        <article className="panel">
          <div className="section-title">
            <ShieldAlert size={18} /> Risk register
          </div>
          {risks.length === 0 && <p className="muted">No risks specified.</p>}
          {risks.map((risk) => (
            <div className="risk" key={risk.name || risk}>
              <div className="risk-head">
                <strong>{risk.name || risk}</strong>
                {risk.impact && <span>{risk.impact} impact · {risk.probability || 'unknown'} probability</span>}
              </div>
              <p>{risk.mitigation || 'Monitor before scaling.'}</p>
            </div>
          ))}
        </article>
      </div>

      <article className="panel">
        <div className="section-title">
          <AlertTriangle size={18} /> What would change our mind?
        </div>
        <div className="triggers">
          {triggers.length === 0 && <span>No trigger defined yet</span>}
          {triggers.map((trigger) => <span key={trigger}>{trigger}</span>)}
        </div>
      </article>

      <article className="panel evidence-panel">
        <div className="section-title">
          <ExternalLink size={18} /> Evidence trail
        </div>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Market</th>
              <th>Type</th>
              <th>Keyword</th>
              <th>Date</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal, index) => (
              <tr key={`${signal.source || 'source'}-${index}`}>
                <td>{signal.source || 'unknown'}</td>
                <td>{signal.market || 'unknown'}</td>
                <td>{signal.signal_type || signal.source_type || 'unknown'}</td>
                <td>{signal.keyword || 'unknown'}</td>
                <td>{signal.observed_at || 'unknown'}</td>
                <td>
                  {signal.url ? <a href={signal.url} target="_blank" rel="noreferrer">open</a> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [activeContext, setActiveContext] = useState('outdoor');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch('/recommendations.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load recommendations.json (${response.status})`);
        return response.json();
      })
      .then((json) => {
        setData(json);
        setLoadError(null);
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  const opportunities = useMemo(() => {
    if (!data?.opportunities) return [];

    return data.opportunities
      .filter((opportunity) => {
        const contexts = asArray(opportunity.context);
        if (contexts.length === 0) return true;
        return contexts.includes(activeContext);
      })
      .sort((a, b) => (Number(b.composite_score) || 0) - (Number(a.composite_score) || 0));
  }, [data, activeContext]);

  useEffect(() => {
    if (opportunities.length) setSelectedId(opportunities[0].id);
  }, [activeContext, data]);

  if (loadError) {
    return (
      <main className="app">
        <div className="error">
          <h1>Retail Radar</h1>
          <p>{loadError}</p>
          <small>Make sure public/recommendations.json exists and restart Vite.</small>
        </div>
      </main>
    );
  }

  if (!data) return <div className="loading">Loading Retail Radar…</div>;

  const context = data.contexts?.[activeContext] || data.contexts?.outdoor || {};
  const selected = opportunities.find((item) => item.id === selectedId) || opportunities[0];
  const actNow = opportunities.filter((item) => item.urgency === 'act_now');
  const watch = opportunities.filter((item) => item.urgency !== 'act_now');
  const evidenceCount = opportunities.reduce((sum, item) => sum + asArray(item.signals).length, 0);

  return (
    <main className="app">
      <header className="hero">
        <div className="brand">
          <div className="logo"><Layers size={24} /></div>
          <div>
            <strong>Retail Radar</strong>
            <span>Swiss shelf-gap intelligence</span>
          </div>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">HerCode × Zenline Hackathon</p>
          <h1>From weak signals to buying decisions.</h1>
          <p>
            Rank emerging product opportunities by momentum, transferability,
            evidence quality and Swiss assortment gaps.
          </p>
        </div>
      </header>

      <div className="layout">
        <ContextPanel context={context} activeContext={activeContext} setActiveContext={setActiveContext} />

        <section className="main-view">
          <div className="kpis">
            <article><b>{actNow.length}</b><span>Act now</span></article>
            <article><b>{watch.length}</b><span>Watch</span></article>
            <article><b>{opportunities.filter((item) => item.confidence === 'low').length}</b><span>Low-confidence</span></article>
            <article><b>{evidenceCount}</b><span>Evidence sources</span></article>
          </div>

          <div className="workspace">
            <section className="list-panel">
              <div className="list-head">
                <h2>Act Now</h2>
                <span>commercial proof + shelf gap</span>
              </div>
              {actNow.map((item) => (
                <OpportunityCard
                  key={item.id}
                  item={item}
                  selected={selected?.id === item.id}
                  onClick={() => setSelectedId(item.id)}
                />
              ))}

              <div className="list-head watch-title">
                <h2>Watch</h2>
                <span>directional, not stock decisions</span>
              </div>
              {watch.map((item) => (
                <OpportunityCard
                  key={item.id}
                  item={item}
                  selected={selected?.id === item.id}
                  onClick={() => setSelectedId(item.id)}
                />
              ))}

              <div className="export">
                <a href="/recommendations.json" download><Download size={16} /> recommendations.json</a>
                <a href="/signals.csv" download><Download size={16} /> signals.csv</a>
              </div>
            </section>

            <Detail item={selected} />
          </div>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
