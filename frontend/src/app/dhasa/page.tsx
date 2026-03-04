'use client';
import { useState, useEffect } from 'react';
import { useBirthData } from '@/lib/BirthDataContext';
import { getDhasaSystems, getDhasa } from '@/lib/api';

interface DhasaPeriod {
    dasha: string;
    bhukti: string;
    pratyantar?: string;
    start_date: string;
    raw?: string;
}

interface DhasaResult {
    balance?: { nakshatra_index?: number; years_remaining?: number; months_remaining?: number };
    periods?: DhasaPeriod[];
    by_dasha?: Record<string, DhasaPeriod[]>;
    total_periods?: number;
}

export default function DhasaPage() {
    const { birthData, isSet } = useBirthData();
    const [systems, setSystems] = useState<{ graha_dhasas: string[]; raasi_dhasas: string[]; annual_dhasas: string[] } | null>(null);
    const [selectedSystem, setSelectedSystem] = useState('vimsottari');
    const [result, setResult] = useState<{ system: string; dhasa_bhukthi: DhasaResult } | null>(null);
    const [expandedDasha, setExpandedDasha] = useState<string | null>(null);
    const [expandedBhukti, setExpandedBhukti] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { getDhasaSystems().then(setSystems).catch(() => { }); }, []);

    const compute = async (sys: string) => {
        if (!birthData) return;
        setLoading(true); setError(''); setResult(null); setExpandedDasha(null);
        try {
            const res = await getDhasa(sys, {
                birth_data: birthData,
                system: sys,
                divisional_chart_factor: 1,
                depth: sys === 'vimsottari' ? 3 : 2
            });
            setResult(res as { system: string; dhasa_bhukthi: DhasaResult });
        } catch (e: unknown) { setError((e as Error).message); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (isSet && birthData) compute(selectedSystem);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [birthData, isSet]);

    const handleSystemChange = (sys: string) => {
        setSelectedSystem(sys);
        if (birthData) compute(sys);
    };

    const data = result?.dhasa_bhukthi;
    const byDasha = data?.by_dasha;

    const activePeriodIndex = data?.periods ? (() => {
        const now = new Date();
        for (let i = data.periods.length - 1; i >= 0; i--) {
            const p = data.periods[i];
            if (p.start_date) {
                const d = new Date(p.start_date.replace(/ (AM|PM)$/, ''));
                if (!isNaN(d.getTime()) && d <= now) return i;
            }
        }
        return -1;
    })() : -1;

    const activePeriod = activePeriodIndex >= 0 && data?.periods ? data.periods[activePeriodIndex] : null;
    const currentDasha = activePeriod?.dasha || null;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">📿 Dhasa-Bhukthi</h1>
                <p className="page-subtitle">40+ dhasa systems — Vimsottari, Ashtottari, Yogini, Narayana, and more</p>
            </div>
            {!isSet && <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Enter birth data above to see Dhasa</div>}

            {systems && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-title">Select Dhasa System</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {[
                            { label: 'Graha', list: systems.graha_dhasas },
                            { label: 'Raasi', list: systems.raasi_dhasas },
                            { label: 'Annual', list: systems.annual_dhasas },
                        ].map(group => group.list.map(s => (
                            <button
                                key={s}
                                className={`badge ${s === selectedSystem ? 'badge-gold' : 'badge-violet'}`}
                                style={{ cursor: 'pointer', border: 'none' }}
                                onClick={() => handleSystemChange(s)}
                            >
                                {s.replace(/_/g, ' ')}
                            </button>
                        )))}
                    </div>
                </div>
            )}

            {error && <div className="error-box">{error}</div>}
            {loading && <div className="loading-state"><div className="spinner" /> Computing {selectedSystem.replace(/_/g, ' ')} dhasa...</div>}

            {data && byDasha && (
                <div>
                    {/* Maha Dasha accordion */}
                    {Object.entries(byDasha).map(([lord, periods]) => {
                        const isActive = lord === currentDasha;
                        const isExpanded = expandedDasha === lord || (expandedDasha === null && isActive);
                        const firstDate = periods[0]?.start_date?.replace(/ (AM|PM)$/, '') || '';
                        const lastDate = periods[periods.length - 1]?.start_date?.replace(/ (AM|PM)$/, '') || '';

                        return (
                            <div key={lord} className="card" style={{ marginBottom: '0.75rem', padding: 0, overflow: 'hidden' }}>
                                <button
                                    onClick={() => {
                                        setExpandedDasha(isExpanded ? '__none__' : lord);
                                        setExpandedBhukti(null);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', width: '100%',
                                        padding: '1rem 1.25rem', background: 'none', border: 'none',
                                        color: 'var(--text-primary)', cursor: 'pointer', gap: '0.75rem',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span style={{
                                        fontSize: '1.1rem', fontWeight: 700,
                                        color: isActive ? 'var(--accent-gold)' : 'var(--accent-violet)',
                                        minWidth: '5rem',
                                    }}>
                                        {lord}
                                    </span>
                                    {isActive && <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>ACTIVE</span>}
                                    <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        {firstDate.split(' ')[0]} → {lastDate.split(' ')[0]}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        {periods.length} periods {isExpanded ? '▲' : '▼'}
                                    </span>
                                </button>

                                {isExpanded && (
                                    <div className="table-wrap" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Bhukti {selectedSystem === 'vimsottari' && '(Antardasha)'}</th>
                                                    {selectedSystem === 'vimsottari' && <th>Pratyantar</th>}
                                                    <th>Start Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const bhuktiGroups: { name: string; periods: DhasaPeriod[] }[] = [];
                                                    let lastBhukti = '';
                                                    periods.forEach(p => {
                                                        if (p.bhukti !== lastBhukti) {
                                                            bhuktiGroups.push({ name: p.bhukti, periods: [p] });
                                                            lastBhukti = p.bhukti;
                                                        } else {
                                                            bhuktiGroups[bhuktiGroups.length - 1].periods.push(p);
                                                        }
                                                    });

                                                    return bhuktiGroups.map((group, bgIdx) => {
                                                        const isBhuktiCurrent = activePeriod?.dasha === lord && activePeriod?.bhukti === group.name;
                                                        const bhuktiKey = `${lord}-${group.name}`;
                                                        const isBhuktiExpanded = expandedBhukti === bhuktiKey || (expandedBhukti === null && isBhuktiCurrent);
                                                        const hasPratyantar = selectedSystem === 'vimsottari' && group.periods.some(p => p.pratyantar);

                                                        const rows = [];

                                                        // Main Bhukti Row
                                                        rows.push(
                                                            <tr
                                                                key={`bhukti-${bgIdx}`}
                                                                style={{
                                                                    ...(isBhuktiCurrent ? { background: 'rgba(245, 200, 66, 0.08)' } : {}),
                                                                    cursor: hasPratyantar ? 'pointer' : 'default',
                                                                    transition: 'background 0.2s',
                                                                }}
                                                                onClick={() => {
                                                                    if (hasPratyantar) {
                                                                        setExpandedBhukti(isBhuktiExpanded ? '__none__' : bhuktiKey);
                                                                    }
                                                                }}
                                                            >
                                                                <td style={{ fontWeight: 600, color: isBhuktiCurrent ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                                                                    {hasPratyantar && (
                                                                        <span style={{
                                                                            display: 'inline-block',
                                                                            width: '1.2rem',
                                                                            color: 'var(--text-muted)',
                                                                            fontSize: '0.8rem',
                                                                            transform: isBhuktiExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                            transition: 'transform 0.2s',
                                                                        }}>
                                                                            ▶
                                                                        </span>
                                                                    )}
                                                                    {group.name}
                                                                    {isBhuktiCurrent && <span className="badge badge-gold" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>NOW</span>}
                                                                </td>
                                                                {selectedSystem === 'vimsottari' && (
                                                                    <td style={{ color: 'var(--text-secondary)' }}>
                                                                        {hasPratyantar ? (group.periods.length + ' periods') : '—'}
                                                                    </td>
                                                                )}
                                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                                    {group.periods[0].start_date?.split(' ')[0] || group.periods[0].raw || '—'}
                                                                </td>
                                                            </tr>
                                                        );

                                                        // Pratyantar Rows (if expanded)
                                                        if (isBhuktiExpanded && hasPratyantar) {
                                                            group.periods.forEach((p, idx) => {
                                                                const isPratyantarCurrent = isBhuktiCurrent && activePeriod === p;
                                                                rows.push(
                                                                    <tr key={`prat-${bgIdx}-${idx}`} style={{
                                                                        ...(isPratyantarCurrent ? { background: 'rgba(245, 200, 66, 0.15)' } : { background: 'var(--bg-card-hover, rgba(0,0,0,0.02))' }),
                                                                    }}>
                                                                        <td style={{ paddingLeft: '2.5rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--border-subtle)' }}>
                                                                            ↳ {group.name}
                                                                        </td>
                                                                        {selectedSystem === 'vimsottari' && (
                                                                            <td style={{ color: isPratyantarCurrent ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                                                                                {p.pratyantar || '—'}
                                                                                {isPratyantarCurrent && <span className="badge badge-gold" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>NOW</span>}
                                                                            </td>
                                                                        )}
                                                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                                            {p.start_date?.split(' ')[0] || '—'}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            });
                                                        }

                                                        return rows;
                                                    });
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Fallback for non-structured data */}
            {data && !byDasha && data.periods && (
                <div className="card">
                    <div className="card-title">{selectedSystem.replace(/_/g, ' ')} Dhasa</div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Dasha</th><th>Bhukti</th>{selectedSystem === 'vimsottari' && <th>Pratyantar</th>}<th>Start Date</th></tr></thead>
                            <tbody>
                                {data.periods.map((p, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{p.dasha}</td>
                                        <td>{p.bhukti || '—'}</td>
                                        {selectedSystem === 'vimsottari' && <td style={{ color: 'var(--text-secondary)' }}>{p.pratyantar || '—'}</td>}
                                        <td style={{ fontSize: '0.88rem' }}>{p.start_date?.split(' ')[0] || p.raw || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
