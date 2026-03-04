'use client';
import { useState } from 'react';
import { type BirthData, getTajaka } from '@/lib/api';
import { MiniForm } from './MiniForm';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

interface TajikProps {
    birthData: BirthData;
    isSet: boolean;
}

export function TajikView({ birthData, isSet }: TajikProps) {
    const [years, setYears] = useState<number>(1);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chartStyle, setChartStyle] = useState<'north' | 'south'>('south');

    const handleCompute = async () => {
        if (!isSet || !birthData) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await getTajaka({ birth_data: birthData, years });
            setResult(res);
        } catch (e: any) {
            setError(e.message || 'Error computing Tajaka charts');
        } finally {
            setLoading(false);
        }
    };

    if (!isSet) {
        return <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Enter birth data first to compute Varshaphala (Tajaka) charts</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
                <div className="card-title">☀️ Varshaphala (Solar Return)</div>
                <div className="form-row" style={{ alignItems: 'flex-end', maxWidth: '300px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Years from Birth</label>
                        <input
                            className="form-input"
                            type="number"
                            min="1"
                            max="120"
                            value={years}
                            onChange={(e) => setYears(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleCompute} disabled={loading}>
                        {loading ? 'Computing...' : 'Compute'}
                    </button>
                </div>
                {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}
            </div>

            {result && Array.isArray(result.charts) && (
                <>
                    <h2 className="page-title" style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Tajik Annual Chart</h2>

                    <div className="card" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
                        <button className={`btn ${chartStyle === 'south' ? 'btn-primary' : ''}`} onClick={() => setChartStyle('south')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>South Indian</button>
                        <button className={`btn ${chartStyle === 'north' ? 'btn-primary' : ''}`} onClick={() => setChartStyle('north')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>North Indian</button>
                    </div>

                    <div className="grid-2">
                        {/* Rasi Chart */}
                        {Array.isArray(result.charts) && result.charts.length === 12 && (
                            <div className="card">
                                <div className="card-title">Rasi (D-1)</div>
                                {chartStyle === 'south' ? (
                                    <SouthIndianChart
                                        charts={result.charts as string[]}
                                        ascendantHouse={result.ascendant_house as number}
                                    />
                                ) : (
                                    <NorthIndianChart
                                        charts={result.charts as string[]}
                                        ascendantHouse={result.ascendant_house as number}
                                    />
                                )}
                            </div>
                        )}

                        <div className="card">
                            <div className="card-title">Information</div>
                            <div className="data-row">
                                <span className="data-label">Target Year</span>
                                <span className="data-value highlight">{result.years as React.ReactNode}</span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">Ascendant House</span>
                                <span className="data-value">{result.ascendant_house as React.ReactNode}</span>
                            </div>
                            {!!result.horoscope && typeof result.horoscope === 'object' && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(15, 15, 40, 0.5)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-violet)', fontSize: '1rem' }}>Key Placements</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                        {Object.entries(result.horoscope as Record<string, string>).map(([k, v]) => (
                                            <div key={k} style={{ display: 'flex', flexDirection: 'column', padding: '0.4rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xs)' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{k}</span>
                                                <span style={{ fontWeight: 500 }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
