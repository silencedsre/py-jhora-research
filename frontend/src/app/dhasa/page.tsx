'use client';
import { useState, useEffect } from 'react';
import { useBirthData } from '@/lib/BirthDataContext';
import { getDhasaSystems, getDhasa } from '@/lib/api';

interface DhasaPeriod {
    dasha: string;
    bhukti: string;
    pratyantar?: string;
    sookshma?: string;
    prana?: string;
    deha?: string;
    start_date: string;
    duration?: number;
    raw?: string;
}

interface DhasaResult {
    balance?: { years_remaining?: number; months_remaining?: number; days_remaining?: number };
    periods?: DhasaPeriod[];
    by_dasha?: Record<string, DhasaPeriod[]>;
    total_periods?: number;
}

export default function DhasaPage() {
    const { birthData, isSet } = useBirthData();
    const [systems, setSystems] = useState<{ graha_dhasas: string[]; raasi_dhasas: string[]; annual_dhasas: string[] } | null>(null);
    const [selectedSystem, setSelectedSystem] = useState('vimsottari');
    const [result, setResult] = useState<{ system: string; dhasa_bhukthi: DhasaResult } | null>(null);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [selectedDepth, setSelectedDepth] = useState(2);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { getDhasaSystems().then(setSystems).catch(() => { }); }, []);

    const compute = async (sys: string, depth: number) => {
        if (!birthData) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await getDhasa(sys, {
                birth_data: birthData,
                system: sys,
                divisional_chart_factor: 1,
                depth: depth
            });
            setResult(res as { system: string; dhasa_bhukthi: DhasaResult });
        } catch (e: unknown) { setError((e as Error).message); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (isSet && birthData) compute(selectedSystem, selectedDepth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [birthData, isSet, selectedDepth]);

    const handleSystemChange = (sys: string) => {
        setSelectedSystem(sys);
        setExpandedPaths(new Set());
        if (birthData) compute(sys, selectedDepth);
    };

    const handleDepthChange = (depth: number) => {
        setSelectedDepth(depth);
        setExpandedPaths(new Set());
    };

    const togglePath = (path: string) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                // Also close all children of this path
                for (const p of next) {
                    if (p.startsWith(path + '/')) next.delete(p);
                }
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const data = result?.dhasa_bhukthi;
    const byDasha = data?.by_dasha;

    const parseDashaDate = (s: string): Date => {
        // Format: "YYYY-MM-DD HH:MM:SS AM/PM" → strip AM/PM suffix, keep rest
        const cleaned = s.replace(/ ?(AM|PM)$/i, '').trim();
        return new Date(cleaned.replace(' ', 'T'));
    };

    const activePeriodIndex = data?.periods ? (() => {
        const now = new Date();
        for (let i = data.periods.length - 1; i >= 0; i--) {
            const p = data.periods[i];
            if (p.start_date) {
                const d = parseDashaDate(p.start_date);
                if (!isNaN(d.getTime()) && d <= now) return i;
            }
        }
        return -1;
    })() : -1;

    const activePeriod = activePeriodIndex >= 0 && data?.periods ? data.periods[activePeriodIndex] : null;
    const currentDasha = activePeriod?.dasha || null;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">📿 Dhasa-Bhukthi</h1>
                <p className="page-subtitle">40+ dhasa systems — Vimsottari, Ashtottari, Yogini, Narayana, and more</p>
            </div>
            {!isSet && <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Enter birth data above to see Dhasa</div>}

            {systems && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ marginBottom: 0, padding: '1.25rem' }}>
                        <div className="card-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>💠</span> Dhasa System
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'Graha (Planetary)', list: systems.graha_dhasas, icon: '🪐' },
                                { label: 'Raasi (Sign)', list: systems.raasi_dhasas, icon: '♈' },
                                { label: 'Annual (Tajik/Others)', list: systems.annual_dhasas, icon: '📅' },
                            ].map(group => (
                                <div key={group.label}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>
                                        {group.icon} {group.label}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {group.list.map(s => (
                                            <button
                                                key={s}
                                                className={`badge ${s === selectedSystem ? 'badge-gold' : 'badge-violet'}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: 'none',
                                                    fontSize: '0.72rem',
                                                    padding: '0.3rem 0.6rem',
                                                    transition: 'transform 0.1s, background 0.2s',
                                                    ...(s === selectedSystem ? { transform: 'scale(1.05)', fontWeight: 600 } : {})
                                                }}
                                                onClick={() => handleSystemChange(s)}
                                            >
                                                {s.replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: 0, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.8rem', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1rem' }}>🔍</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Calculation Depth:</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', width: '100%' }}>
                            {[
                                { val: 1, label: 'Maha' },
                                { val: 2, label: 'Bhukti' },
                                { val: 3, label: 'Antara' },
                                { val: 4, label: 'Sookshma' },
                                { val: 5, label: 'Prana' }
                            ].map(d => (
                                <button
                                    key={d.val}
                                    className={`badge ${d.val === selectedDepth ? 'badge-gold' : 'badge-violet'}`}
                                    style={{
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'all 0.2s',
                                        padding: '0.3rem 0.6rem',
                                        fontSize: '0.75rem',
                                        minWidth: '70px',
                                        textAlign: 'center'
                                    }}
                                    onClick={() => handleDepthChange(d.val)}
                                >
                                    <span style={{ fontSize: '0.65rem', opacity: 0.7, marginRight: '0.2rem' }}>L{d.val}</span>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.8, fontStyle: 'italic', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
                            Level 3 (Antara) is standard for analysis.
                        </div>
                    </div>
                </div>
            )}

            {data?.balance && (
                <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.1rem' }}>⏳</span>
                        <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>Balance at birth:</span>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
                                {data.balance.years_remaining} Years, {data.balance.months_remaining} Months, {data.balance.days_remaining} Days
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="error-box">{error}</div>}
            {loading && <div className="loading-state"><div className="spinner" /> Computing {selectedSystem.replace(/_/g, ' ')} dhasa...</div>}

            {data && byDasha && (
                <div>
                    {/* Maha Dasha accordion */}
                    {Object.entries(byDasha as Record<string, DhasaPeriod[]>).map(([lord, periods]) => {
                        const isActive = lord === currentDasha;
                        const firstDate = periods[0]?.start_date?.replace(/ (AM|PM)$/, '') || '';
                        const lastDate = periods[periods.length - 1]?.start_date?.replace(/ (AM|PM)$/, '') || '';

                        const mahaPath = `${lord}_${firstDate.split(' ')[0]}`;
                        const isExpanded = expandedPaths.has(mahaPath);

                        return (
                            <div key={mahaPath} className="card" style={{ marginBottom: '0.75rem', padding: 0, overflow: 'hidden' }}>
                                <button
                                    onClick={() => togglePath(mahaPath)}
                                    style={{
                                        display: 'flex', alignItems: 'center', width: '100%',
                                        padding: '1rem', background: 'none', border: 'none',
                                        color: 'var(--text-primary)', cursor: 'pointer', gap: '0.5rem',
                                        textAlign: 'left', flexWrap: 'wrap'
                                    }}
                                >
                                    <span style={{
                                        fontSize: '1.2rem', fontWeight: 700,
                                        color: isActive ? 'var(--accent-gold)' : 'var(--accent-violet)',
                                        minWidth: '4.5rem',
                                    }}>
                                        {lord}
                                    </span>
                                    {isActive && <span className="badge badge-gold" style={{ fontSize: '0.7rem', marginRight: 'auto' }}>ACTIVE</span>}

                                    {/* Push the remaining items to the right on desktop, or wrap on mobile */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: isActive ? '0' : 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                            Starts: {firstDate.split(' ')[0]}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                            {periods.length} periods {isExpanded ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="table-wrap" style={{ borderTop: '1px solid var(--border-subtle)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                        <table style={{ minWidth: '100%' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                                                    <th style={{ padding: '0.8rem 1.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Bhukti</th>
                                                    {selectedDepth >= 3 && <th style={{ padding: '0.8rem 1.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Sub-periods</th>}
                                                    <th style={{ padding: '0.8rem 1.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', textAlign: 'right' }}>Start Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const levels = ['bhukti', 'pratyantar', 'sookshma', 'prana', 'deha'] as const;

                                                    const renderLevel = (currentPeriods: DhasaPeriod[], levelIdx: number, parentPath: string): React.ReactNode[] => {
                                                        const currentLevelKey = levels[levelIdx];
                                                        const groups: { name: string; periods: DhasaPeriod[] }[] = [];
                                                        let lastVal = '';

                                                        currentPeriods.forEach(p => {
                                                            const val = p[currentLevelKey] || '—';
                                                            if (val !== lastVal) {
                                                                groups.push({ name: val, periods: [p] });
                                                                lastVal = val;
                                                            } else {
                                                                groups[groups.length - 1].periods.push(p);
                                                            }
                                                        });

                                                        const rows: React.ReactNode[] = [];

                                                        groups.forEach((group, gIdx) => {
                                                            const firstP = group.periods[0];
                                                            // Include start date in path to ensure uniqueness across different cycles
                                                            const fullPath = `${parentPath}/${group.name}_${firstP.start_date?.replace(/\s/g, '_')}`;
                                                            const isExpanded = expandedPaths.has(fullPath);
                                                            const hasChildren = levelIdx < levels.length - 1 &&
                                                                group.periods.some(p => !!p[levels[levelIdx + 1]]);

                                                            const isCurrent = group.periods.some(p => p === activePeriod);
                                                            // Stronger indentation for deeper levels
                                                            const paddingLeft = levelIdx === 0 ? '1.25rem' : `${1.25 + levelIdx * 1.75}rem`;

                                                            rows.push(
                                                                <tr
                                                                    key={fullPath}
                                                                    style={{
                                                                        ...(isCurrent ? { background: 'rgba(245, 200, 66, 0.06)' } :
                                                                            gIdx % 2 === 0 && levelIdx === 0 ? { background: 'rgba(255, 255, 255, 0.01)' } : {}),
                                                                        cursor: hasChildren ? 'pointer' : 'default',
                                                                        transition: 'background 0.2s',
                                                                        borderBottom: isExpanded ? 'none' : '1px solid var(--border-subtle)'
                                                                    }}
                                                                    onClick={() => { if (hasChildren) togglePath(fullPath); }}
                                                                >
                                                                    <td style={{
                                                                        padding: `0.75rem 1.25rem 0.75rem ${paddingLeft}`,
                                                                        fontWeight: levelIdx === 0 ? 600 : 500,
                                                                        color: isCurrent ? 'var(--accent-gold)' : 'var(--text-primary)',
                                                                        borderLeft: levelIdx > 0 ? `3px solid var(--accent-violet)` : 'none',
                                                                        // Subtly fade deeper levels to focus on parent
                                                                        opacity: levelIdx > 0 ? Math.max(0.6, 1 - (levelIdx * 0.12)) : 1
                                                                    }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                                            {levelIdx > 0 && <span style={{ marginRight: '0.1rem', fontSize: '0.9rem', opacity: 0.4 }}>↳</span>}
                                                                            {hasChildren && (
                                                                                <span style={{
                                                                                    color: 'var(--text-muted)',
                                                                                    fontSize: '0.65rem',
                                                                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                                    transition: 'transform 0.2s',
                                                                                    opacity: 0.6,
                                                                                    width: '12px'
                                                                                }}>
                                                                                    ▶
                                                                                </span>
                                                                            )}
                                                                            <span style={{ whiteSpace: 'nowrap' }}>{group.name}</span>
                                                                            {isCurrent && <span className="badge badge-gold" style={{ padding: '0.1rem 0.4rem', fontSize: '0.55rem', height: 'auto', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>}
                                                                        </div>
                                                                    </td>
                                                                    {selectedDepth >= 3 && (
                                                                        <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.78rem', opacity: 0.6 }}>
                                                                            {hasChildren ? `${group.periods.length} sub-periods` : '—'}
                                                                        </td>
                                                                    )}
                                                                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'right', fontFamily: 'monospace', opacity: 0.8 }}>
                                                                        {firstP.start_date?.split(' ')[0] || '—'}
                                                                    </td>
                                                                </tr>
                                                            );

                                                            if (isExpanded && hasChildren) {
                                                                rows.push(...renderLevel(group.periods, levelIdx + 1, fullPath));
                                                            }
                                                        });

                                                        return rows;
                                                    };

                                                    return renderLevel(periods, 0, mahaPath);
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
                            <thead><tr><th>Dasha</th><th>Bhukti</th>{selectedDepth >= 3 && <th>Sub-periods</th>}<th>Start Date</th></tr></thead>
                            <tbody>
                                {data.periods.map((p: DhasaPeriod, i: number) => {
                                    const labels: string[] = [];
                                    if (p.pratyantar) labels.push(p.pratyantar);
                                    if (p.sookshma) labels.push(p.sookshma);
                                    if (p.prana) labels.push(p.prana);

                                    return (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{p.dasha}</td>
                                            <td>{p.bhukti || '—'}</td>
                                            {selectedDepth >= 3 && <td style={{ color: 'var(--text-secondary)' }}>{labels.join(' › ') || '—'}</td>}
                                            <td style={{ fontSize: '0.88rem' }}>{p.start_date?.split(' ')[0] || p.raw || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
