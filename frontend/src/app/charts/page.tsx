'use client';
import { useEffect, useState } from 'react';
import { useBirthData } from '@/lib/BirthDataContext';
import { getYogas, getDoshas, getStrength, getAshtakavarga, type BirthData } from '@/lib/api';

type Tab = 'yoga' | 'dosha' | 'strength' | 'ashtakavarga';

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const SIGNS = ['Ar', 'Ta', 'Ge', 'Ca', 'Le', 'Vi', 'Li', 'Sc', 'Sa', 'Cp', 'Aq', 'Pi'];

export default function ChartsPage() {
    const { birthData, isSet } = useBirthData();
    const [tab, setTab] = useState<Tab>('yoga');
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchers: Record<Tab, (d: BirthData) => Promise<Record<string, unknown>>> = {
        yoga: getYogas, dosha: getDoshas, strength: getStrength, ashtakavarga: getAshtakavarga,
    };

    const compute = async (t: Tab) => {
        if (!birthData) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await fetchers[t](birthData);
            setResult(res);
        } catch (e: unknown) { setError((e as Error).message); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (isSet && birthData) compute(tab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [birthData, isSet]);

    const handleTabChange = (t: Tab) => {
        setTab(t);
        if (birthData) compute(t);
    };

    // Generic fallback renderer for Yogas/Doshas
    const renderData = (data: unknown, depth = 0): React.ReactNode => {
        if (data === null || data === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean')
            return <span>{String(data)}</span>;
        if (Array.isArray(data)) {
            if (data.length === 0) return <span style={{ color: 'var(--text-muted)' }}>None found</span>;
            if (typeof data[0] === 'string' || typeof data[0] === 'number')
                return <span>{data.join(', ')}</span>;
            return (
                <div style={{ marginTop: depth > 0 ? 0 : '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {data.map((item, i) => (
                        <div key={i} className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                            {renderData(item, depth + 1)}
                        </div>
                    ))}
                </div>
            );
        }
        if (typeof data === 'object') {
            return (
                <div style={{ paddingLeft: depth > 0 ? '0' : 0 }}>
                    {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="data-row" style={{ padding: '0.4rem 0' }}>
                            <span className="data-label" style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{k.replace(/_/g, ' ').toUpperCase()}</span>
                            <span className="data-value">{renderData(v, depth + 1)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span>{String(data)}</span>;
    };

    // Table view for Ashtakavarga
    const renderAshtakavarga = () => {
        if (!result || !result.ashtakavarga || !Array.isArray(result.ashtakavarga)) return null;

        // The API returns a tuple of 3 items from PyJHora:
        // [0] = binna_ashtaka_varga: 8x12 array (7 planets + Lagnam)
        // [1] = samudhaya_ashtaka_varga (Sarva): 1x12 array
        // [2] = prastara_ashtaka_varga: 3D array
        const avData = result.ashtakavarga as unknown[];
        if (avData.length < 2 || !Array.isArray(avData[0])) return renderData(result);

        const bhinna = avData[0] as number[][];
        const sarva = avData[1] as number[];

        return (
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Planet</th>
                            {SIGNS.map(s => <th key={s} style={{ textAlign: 'center' }}>{s}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {PLANETS.map((p, i) => (
                            <tr key={p}>
                                <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{p}</td>
                                {bhinna[i]?.map((score, j) => (
                                    <td key={j} style={{ textAlign: 'center', color: score >= 4 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>{score}</td>
                                ))}
                            </tr>
                        ))}
                        <tr style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                            <td style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>SARVA (Total)</td>
                            {sarva?.map((score, j) => (
                                <td key={`sarva-${j}`} style={{ textAlign: 'center', fontWeight: 700, color: score >= 28 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{score}</td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    // Table view for Shadbala
    const renderStrength = () => {
        if (!result || !result.shad_bala || !Array.isArray(result.shad_bala)) return renderData(result);
        const sb = result.shad_bala as number[][];
        // Shadbala array structure:
        // [0] Sthana Bala (Positional)
        // [1] Dik Bala (Directional)
        // [2] Kaala Bala (Temporal)
        // [3] Cheshta Bala (Motional)
        // [4] Naisargika Bala (Natural)
        // [5] Drik Bala (Aspectual)
        // [6] Total Shadbala (In Rupas or Virupas)
        // [7] Minimum Required Strength
        // [8] Ratio (Total / Required) -> Is it strong?

        const labels = [
            "Sthana (Positional)", "Dik (Directional)", "Kaala (Temporal)",
            "Cheshta (Motional)", "Naisargika (Natural)", "Drik (Aspectual)",
            "Total Shadbala", "Required Strength", "Strength Ratio"
        ];

        return (
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Bala Type</th>
                            {PLANETS.map(p => <th key={p} style={{ textAlign: 'center' }}>{p}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {sb.slice(0, 6).map((row, i) => (
                            <tr key={i}>
                                <td style={{ color: 'var(--text-muted)' }}>{labels[i]}</td>
                                {row.map((val, j) => <td key={j} style={{ textAlign: 'center' }}>{val.toFixed(2)}</td>)}
                            </tr>
                        ))}
                        <tr style={{ background: 'rgba(245, 200, 66, 0.05)' }}>
                            <td style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>Total Shadbala</td>
                            {sb[6]?.map((val, j) => <td key={j} style={{ textAlign: 'center', fontWeight: 600 }}>{val.toFixed(2)}</td>)}
                        </tr>
                        <tr>
                            <td style={{ color: 'var(--text-muted)' }}>Required Strength</td>
                            {sb[7]?.map((val, j) => <td key={j} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{val.toFixed(2)}</td>)}
                        </tr>
                        <tr style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                            <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>Strength Ratio (% Strong)</td>
                            {sb[8]?.map((val, j) => (
                                <td key={j} style={{ textAlign: 'center', fontWeight: 700, color: val >= 1 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                                    {(val * 100).toFixed(0)}%
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    // Card view for Yogas
    const renderYogas = () => {
        if (!result || !result.yogas) return renderData(result);

        // The API actually returns an array of objects e.g. [{"vosi_yoga": [...]}, {"amala_yoga": [...]}]
        const yogasList = Array.isArray(result.yogas) ? result.yogas : [result.yogas];
        const yogas = Object.assign({}, ...yogasList) as Record<string, string[]>;
        const keys = Object.keys(yogas);

        if (keys.length === 0) return <div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>No yogas found for this chart.</div>;

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {keys.map(k => {
                    const data = yogas[k];
                    if (!Array.isArray(data) || data.length < 3) return null;
                    const chart = data[0]; // e.g., "D1"
                    const name = data[1];  // e.g., "Ruchaka Yoga"
                    const condition = data[2]; // e.g., "Mars in Kendra..."
                    const outcome = data[3] || ''; // effect of yoga

                    return (
                        <div key={k} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-gold)', fontWeight: 600 }}>{name}</h3>
                                {chart && <span className="badge badge-violet">{chart}</span>}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Condition:</strong> {condition}
                            </div>
                            {outcome && (
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                    ✨ {outcome}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Card view for Doshas
    const renderDoshas = () => {
        if (!result) return null;
        const keys = Object.keys(result);
        if (keys.length === 0) return <div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>No doshas found.</div>;

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {keys.map(k => {
                    const val = result[k];
                    const name = k.replace(/_/g, ' ').toUpperCase();
                    let content: React.ReactNode = null;
                    let hasDosha = false;

                    // Some doshas like kuja_dosha return a boolean, others return details.
                    if (typeof val === 'boolean') {
                        hasDosha = val;
                        content = val ? <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>Present</span> : <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Not Present</span>;
                    } else if (typeof val === 'string') {
                        hasDosha = val.toLowerCase().includes('yes') || val.toLowerCase().includes('present');
                        content = <span>{val}</span>;
                    } else if (val === null) {
                        content = <span style={{ color: 'var(--text-muted)' }}>Could not compute</span>;
                    } else {
                        hasDosha = true; // Assume present if there's detailed data returned
                        content = renderData(val, 1);
                    }

                    return (
                        <div key={k} className="card" style={{ padding: '1.25rem', borderLeft: hasDosha ? '4px solid var(--accent-rose)' : '4px solid var(--accent-emerald)' }}>
                            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{name}</h3>
                            <div style={{ fontSize: '0.95rem' }}>{content}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'yoga', label: 'Yogas', icon: '🧘' },
        { key: 'dosha', label: 'Doshas', icon: '⚠️' },
        { key: 'strength', label: 'Strength (Shadbala)', icon: '💪' },
        { key: 'ashtakavarga', label: 'Ashtakavarga', icon: '📊' },
    ];

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">📜 Chart Analysis</h1>
                <p className="page-subtitle">Yogas, Doshas, Shad Bala, and Ashtakavarga</p>
            </div>
            {!isSet && <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Enter birth data above to see charts</div>}

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`badge ${tab === t.key ? 'badge-gold' : 'badge-violet'}`}
                        style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem', fontSize: '0.88rem' }}
                        onClick={() => handleTabChange(t.key)}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {error && <div className="error-box">{error}</div>}
            {loading && <div className="loading-state"><div className="spinner" /> Computing {tab}...</div>}
            {result && (
                <div className="card" style={{ overflowX: 'auto', background: (tab === 'yoga' || tab === 'dosha') ? 'transparent' : 'var(--gradient-card)', border: (tab === 'yoga' || tab === 'dosha') ? 'none' : '1px solid var(--border-subtle)', boxShadow: (tab === 'yoga' || tab === 'dosha') ? 'none' : 'var(--shadow-card)', padding: (tab === 'yoga' || tab === 'dosha') ? 0 : '1.5rem' }}>
                    {(tab !== 'yoga' && tab !== 'dosha') && <div className="card-title">{tabs.find(t => t.key === tab)?.icon} {tabs.find(t => t.key === tab)?.label}</div>}
                    {tab === 'ashtakavarga' ? renderAshtakavarga() :
                        tab === 'strength' ? renderStrength() :
                            tab === 'yoga' ? renderYogas() :
                                tab === 'dosha' ? renderDoshas() :
                                    renderData(result)}
                </div>
            )}
        </>
    );
}
