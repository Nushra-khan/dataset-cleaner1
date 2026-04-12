import React, { useState, useRef, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ICON_MAP = {
  columns: '⌗',
  copy: '⊘',
  scissors: '✂',
  toggle: '◈',
  hash: '#',
  calendar: '◷',
  tag: '◉',
  droplet: '◦',
  activity: '⌒',
};

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black: #0a0a0a;
    --off-black: #111111;
    --dark: #1a1a1a;
    --beige: #f0ebe0;
    --beige-dim: #e8e2d4;
    --beige-dimmer: #d4cfc4;
    --accent: #c8b89a;
    --accent-bright: #d4a96a;
    --white: #faf8f5;
    --error: #c0392b;
    --success: #2d6a4f;
    --text-muted: #888;
    --border: rgba(200, 184, 154, 0.2);
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  body {
    background: var(--black);
    color: var(--beige);
    font-family: var(--font-mono);
    min-height: 100vh;
    line-height: 1.6;
  }

  .app {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px 80px;
  }

  /* HEADER */
  .header {
    padding: 48px 0 40px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 56px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .header-left h1 {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3.4rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--white);
    line-height: 1;
    margin-bottom: 8px;
  }

  .header-left h1 span {
    color: var(--accent-bright);
  }

  .header-left p {
    font-size: 0.78rem;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .header-badge {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    border: 1px solid var(--border);
    padding: 6px 12px;
    background: rgba(200,184,154,0.05);
  }

  /* PIPELINE */
  .pipeline {
    display: flex;
    gap: 0;
    margin-bottom: 56px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .pipe-step {
    flex: 1;
    min-width: 100px;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-right: none;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: var(--off-black);
    transition: all 0.2s;
    position: relative;
  }

  .pipe-step:last-child { border-right: 1px solid var(--border); }

  .pipe-step.active {
    color: var(--accent-bright);
    background: rgba(212, 169, 106, 0.08);
    border-color: rgba(212, 169, 106, 0.4);
  }

  .pipe-step.done {
    color: var(--accent);
    background: rgba(200, 184, 154, 0.05);
  }

  .pipe-step-num {
    display: block;
    font-size: 1.4rem;
    font-weight: 800;
    font-family: var(--font-display);
    margin-bottom: 2px;
    opacity: 0.4;
  }

  .pipe-step.active .pipe-step-num,
  .pipe-step.done .pipe-step-num { opacity: 1; }

  /* GRID */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }

  @media (max-width: 700px) {
    .grid-2 { grid-template-columns: 1fr; }
  }

  /* CARD */
  .card {
    background: var(--off-black);
    border: 1px solid var(--border);
    padding: 28px;
  }

  .card-title {
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-title::before {
    content: '';
    display: inline-block;
    width: 16px;
    height: 1px;
    background: var(--accent);
  }

  /* UPLOAD ZONE */
  .upload-zone {
    border: 1px dashed rgba(200,184,154,0.35);
    padding: 48px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(200,184,154,0.02);
    position: relative;
    min-height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .upload-zone:hover,
  .upload-zone.dragging {
    border-color: var(--accent-bright);
    background: rgba(212,169,106,0.06);
  }

  .upload-zone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .upload-icon {
    font-size: 2.5rem;
    opacity: 0.5;
    line-height: 1;
  }

  .upload-label {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--white);
  }

  .upload-sub {
    font-size: 0.7rem;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .upload-file-name {
    font-size: 0.78rem;
    color: var(--accent-bright);
    margin-top: 8px;
    padding: 6px 12px;
    background: rgba(212,169,106,0.1);
    border: 1px solid rgba(212,169,106,0.3);
  }

  /* STATS ROW */
  .stats-row {
    display: flex;
    gap: 1px;
    background: var(--border);
    margin-bottom: 24px;
  }

  .stat-box {
    flex: 1;
    padding: 16px 20px;
    background: var(--off-black);
    text-align: center;
  }

  .stat-val {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--white);
    line-height: 1;
  }

  .stat-val.accent { color: var(--accent-bright); }
  .stat-val.success { color: #52b788; }
  .stat-val.warn { color: #e9c46a; }

  .stat-label {
    font-size: 0.62rem;
    color: var(--text-muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* TABLE */
  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.72rem;
  }

  th {
    background: var(--dark);
    color: var(--accent);
    padding: 10px 14px;
    text-align: left;
    font-weight: 500;
    letter-spacing: 0.06em;
    white-space: nowrap;
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 8px 14px;
    color: var(--beige-dim);
    border-bottom: 1px solid rgba(200,184,154,0.07);
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(200,184,154,0.04); }

  /* PROFILE TABLE */
  .type-badge {
    padding: 2px 8px;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid;
  }

  .type-numeric { color: #74c0fc; border-color: rgba(116,192,252,0.3); background: rgba(116,192,252,0.08); }
  .type-categorical { color: #b2f2bb; border-color: rgba(178,242,187,0.3); background: rgba(178,242,187,0.08); }
  .type-datetime { color: #fcc419; border-color: rgba(252,196,25,0.3); background: rgba(252,196,25,0.08); }
  .type-boolean { color: #f783ac; border-color: rgba(247,131,172,0.3); background: rgba(247,131,172,0.08); }
  .type-text { color: #d9d9d9; border-color: rgba(217,217,217,0.3); background: rgba(217,217,217,0.08); }
  .type-unknown { color: var(--text-muted); border-color: var(--border); }

  /* BUTTONS */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    font-weight: 500;
  }

  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--beige);
    color: var(--black);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--white);
    transform: translateY(-1px);
  }

  .btn-outline {
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
  }

  .btn-outline:hover:not(:disabled) {
    background: rgba(200,184,154,0.1);
  }

  .btn-success {
    background: #2d6a4f;
    color: var(--white);
  }

  .btn-success:hover:not(:disabled) {
    background: #40916c;
  }

  .btn-row {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  /* LOADING */
  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(10,10,10,0.3);
    border-top-color: var(--black);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .spinner-light {
    border-color: rgba(200,184,154,0.2);
    border-top-color: var(--accent);
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* PROGRESS BAR */
  .progress-bar {
    height: 3px;
    background: var(--dark);
    margin-bottom: 24px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent-bright);
    transition: width 0.5s ease;
  }

  /* ERROR */
  .error-box {
    background: rgba(192, 57, 43, 0.1);
    border: 1px solid rgba(192, 57, 43, 0.4);
    color: #e88c84;
    padding: 14px 18px;
    font-size: 0.78rem;
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* REPORT */
  .report-step {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }

  .report-step:last-child { border-bottom: none; }

  .report-icon {
    font-size: 1rem;
    min-width: 24px;
    text-align: center;
    margin-top: 1px;
    color: var(--accent-bright);
  }

  .report-action {
    font-weight: 500;
    color: var(--white);
    font-size: 0.78rem;
    margin-bottom: 2px;
    font-family: var(--font-display);
  }

  .report-detail {
    font-size: 0.68rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* MISSING BAR */
  .missing-bar-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.68rem;
  }

  .missing-bar {
    flex: 1;
    height: 4px;
    background: var(--dark);
    overflow: hidden;
    min-width: 40px;
  }

  .missing-fill {
    height: 100%;
    background: var(--accent-bright);
    opacity: 0.7;
  }

  .missing-fill.high { background: #e07a5f; opacity: 1; }

  /* SECTION TITLE */
  .section-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 20px;
    letter-spacing: -0.01em;
  }

  /* DIVIDER */
  .divider {
    height: 1px;
    background: var(--border);
    margin: 48px 0;
  }

  /* TABS */
  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px;
  }

  .tab {
    padding: 10px 20px;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    color: var(--text-muted);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: var(--font-mono);
    transition: all 0.15s;
  }

  .tab.active {
    color: var(--accent-bright);
    border-bottom-color: var(--accent-bright);
  }

  .tab:hover:not(.active) { color: var(--accent); }

  /* FOOTER */
  .footer {
    border-top: 1px solid var(--border);
    padding: 24px 0;
    margin-top: 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .empty-state {
    padding: 40px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
  }
`;

function TypeBadge({ type }) {
  return <span className={`type-badge type-${type}`}>{type}</span>;
}

function MissingBar({ pct }) {
  return (
    <div className="missing-bar-wrap">
      <div className="missing-bar">
        <div
          className={`missing-fill${pct > 30 ? ' high' : ''}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span style={{ minWidth: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

function DataTable({ rows, columns }) {
  if (!rows || rows.length === 0) return <div className="empty-state">No data to display</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c} title={String(row[c] ?? '')}>
                  {row[c] === null || row[c] === undefined ? <span style={{ color: 'var(--text-muted)' }}>—</span> : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfileTable({ profile }) {
  const cols = Object.entries(profile.columns || {});
  if (!cols.length) return null;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Column</th>
            <th>Type</th>
            <th>Missing</th>
            <th>Unique</th>
          </tr>
        </thead>
        <tbody>
          {cols.map(([col, info]) => (
            <tr key={col}>
              <td style={{ color: 'var(--white)', fontWeight: 500 }}>{col}</td>
              <td><TypeBadge type={info.inferred_type} /></td>
              <td><MissingBar pct={info.missing_pct} /></td>
              <td>{info.unique_values}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportStep({ step }) {
  return (
    <div className="report-step">
      <div className="report-icon">{ICON_MAP[step.icon] || '◆'}</div>
      <div>
        <div className="report-action">{step.action}</div>
        <div className="report-detail">{step.detail}</div>
      </div>
    </div>
  );
}

const STEPS = ['Upload', 'Profile', 'Clean', 'Results'];

export default function App() {
  const [phase, setPhase] = useState(0); // 0=upload,1=profiled,2=cleaning,3=done
  const [uploadData, setUploadData] = useState(null);
  const [cleanData, setCleanData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState('preview');
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError('');
    setUploadData(null);
    setCleanData(null);
    setProgress(20);

    const form = new FormData();
    form.append('file', file);
    setLoading(true);

    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setUploadData(data);
      setPhase(1);
      setProgress(40);
      setTab('preview');
    } catch (e) {
      setError(e.message);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClean = async () => {
    if (!uploadData) return;
    setError('');
    setLoading(true);
    setPhase(2);
    setProgress(60);

    try {
      const res = await fetch(`${API}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: uploadData.session_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Cleaning failed');
      setCleanData(data);
      setPhase(3);
      setProgress(100);
      setTab('preview');
    } catch (e) {
      setError(e.message);
      setPhase(1);
      setProgress(40);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!uploadData) return;
    window.open(`${API}/download/${uploadData.session_id}`, '_blank');
  };

  const reset = () => {
    setPhase(0);
    setUploadData(null);
    setCleanData(null);
    setError('');
    setProgress(0);
    setTab('preview');
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* HEADER */}
        <header className="header">
          <div className="header-left">
            <h1>Data<span>Clean</span></h1>
            <p>Automated CSV Dataset Preprocessing</p>
          </div>
          <span className="header-badge">ML-Ready Output</span>
        </header>

        {/* PIPELINE STEPS */}
        <div className="pipeline">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`pipe-step${phase === i ? ' active' : ''}${phase > i ? ' done' : ''}`}
            >
              <span className="pipe-step-num">{String(i + 1).padStart(2, '0')}</span>
              {s}
            </div>
          ))}
        </div>

        {/* PROGRESS BAR */}
        {progress > 0 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* UPLOAD PHASE */}
        {phase === 0 && (
          <div className="card">
            <div className="card-title">Upload Dataset</div>
            <div
              className={`upload-zone${dragging ? ' dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={(e) => handleFile(e.target.files[0])}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="upload-icon">{loading ? <span className="spinner spinner-light" /> : '◫'}</div>
              <div className="upload-label">
                {loading ? 'Analyzing...' : 'Drop CSV here or click to browse'}
              </div>
              <div className="upload-sub">Max 5MB · CSV files only</div>
            </div>
            {error && <div className="error-box">⚠ {error}</div>}
          </div>
        )}

        {/* PROFILED PHASE */}
        {phase >= 1 && uploadData && (
          <>
            {/* Stats */}
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-val accent">{uploadData.rows.toLocaleString()}</div>
                <div className="stat-label">Rows</div>
              </div>
              <div className="stat-box">
                <div className="stat-val">{uploadData.columns}</div>
                <div className="stat-label">Columns</div>
              </div>
              <div className="stat-box">
                <div className="stat-val warn">{uploadData.profile?.total_missing || 0}</div>
                <div className="stat-label">Missing</div>
              </div>
              <div className="stat-box">
                <div className="stat-val warn">{uploadData.profile?.total_duplicates || 0}</div>
                <div className="stat-label">Duplicates</div>
              </div>
            </div>

            {/* Raw Data Section */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title">Raw Dataset — {uploadData.filename}</div>

              <div className="tabs">
                <button className={`tab${tab === 'preview' ? ' active' : ''}`} onClick={() => setTab('preview')}>Preview</button>
                <button className={`tab${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>Column Profile</button>
              </div>

              {tab === 'preview' && (
                <DataTable rows={uploadData.preview} columns={uploadData.column_names} />
              )}
              {tab === 'profile' && (
                <ProfileTable profile={uploadData.profile} />
              )}
            </div>

            {error && <div className="error-box">⚠ {error}</div>}

            {phase < 3 && (
              <div className="btn-row">
                <button className="btn btn-primary" onClick={handleClean} disabled={loading || phase === 2}>
                  {loading ? <><span className="spinner" /> Processing...</> : '▶ Clean Dataset'}
                </button>
                <button className="btn btn-outline" onClick={reset}>↺ Upload New</button>
              </div>
            )}
          </>
        )}

        {/* RESULTS PHASE */}
        {phase === 3 && cleanData && (
          <>
            <div className="divider" />
            <div className="section-title">✓ Cleaning Complete</div>

            {/* Delta Stats */}
            <div className="stats-row" style={{ marginBottom: 24 }}>
              <div className="stat-box">
                <div className="stat-val">{cleanData.rows_before.toLocaleString()}</div>
                <div className="stat-label">Rows Before</div>
              </div>
              <div className="stat-box">
                <div className="stat-val success">{cleanData.rows_after.toLocaleString()}</div>
                <div className="stat-label">Rows After</div>
              </div>
              <div className="stat-box">
                <div className="stat-val warn">{cleanData.report?.rows_removed || 0}</div>
                <div className="stat-label">Removed</div>
              </div>
              <div className="stat-box">
                <div className="stat-val accent">{cleanData.report?.steps?.length || 0}</div>
                <div className="stat-label">Steps Applied</div>
              </div>
            </div>

            <div className="grid-2">
              {/* Cleaned Preview */}
              <div className="card">
                <div className="card-title">Cleaned Dataset Preview</div>
                <DataTable rows={cleanData.preview} columns={cleanData.column_names} />
              </div>

              {/* Report */}
              <div className="card">
                <div className="card-title">Cleaning Report</div>
                {cleanData.report?.steps?.length > 0
                  ? cleanData.report.steps.map((step, i) => <ReportStep key={i} step={step} />)
                  : <div className="empty-state">No cleaning steps applied — data looks clean!</div>
                }
              </div>
            </div>

            <div className="btn-row">
              <button className="btn btn-success" onClick={handleDownload}>
                ↓ Download Cleaned CSV
              </button>
              <button className="btn btn-outline" onClick={reset}>↺ Start Over</button>
            </div>
          </>
        )}

        <footer className="footer">
          <span>DataClean Platform</span>
          <span>Pandas · FastAPI · React</span>
        </footer>
      </div>
    </>
  );
}
