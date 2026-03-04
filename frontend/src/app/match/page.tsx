'use client';
import { useState } from 'react';
import { MiniForm } from '@/components/MiniForm';
import { getMatchFromBirth, type BirthData } from '@/lib/api';

export default function MatchPage() {
    const [boyData, setBoyData] = useState<BirthData | null>(null);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'boy' | 'girl' | 'result'>('boy');

    const handleBoy = (data: BirthData) => { setBoyData(data); setStep('girl'); };

    const handleGirl = async (data: BirthData) => {
        if (!boyData) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await getMatchFromBirth({ boy: boyData, girl: data, method: 'north' });
            setResult(res);
            setStep('result');
        } catch (e: unknown) { setError((e as Error).message); }
        finally { setLoading(false); }
    };

    const scores = result?.scores as Record<string, number> | undefined;
    const total = result?.total_score as number;
    const max = result?.max_score as number;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">💑 Marriage Compatibility</h1>
                <p className="page-subtitle">Ashtakoota matching — 8 compatibility factors scored out of 36</p>
            </div>

            {step === 'boy' && <MiniForm label="Step 1: Boy's Birth Data" onSubmit={handleBoy} buttonLabel="Next → Girl's Data" />}

            {step === 'girl' && (
                <>
                    <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center' }}>
                        <span className="badge badge-emerald">✓ Boy</span>
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', flex: 1 }}>{boyData?.place} • {boyData?.date}</span>
                        <button onClick={() => setStep('boy')} style={{ background: 'none', border: 'none', color: 'var(--accent-violet)', cursor: 'pointer' }}>Edit</button>
                    </div>
                    <MiniForm label="Step 2: Girl's Birth Data" onSubmit={handleGirl} loading={loading} buttonLabel="Calculate Compatibility" />
                </>
            )}

            {error && <div className="error-box">{error}</div>}
            {loading && <div className="loading-state"><div className="spinner" /> Computing compatibility...</div>}

            {step === 'result' && result && scores && (
                <>
                    <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                        <div className="card-title">Compatibility Score</div>
                        <div className="score-value">{total} / {max}</div>
                        <div className="score-bar-wrap">
                            <div className="score-bar-bg">
                                <div className="score-bar-fill" style={{ width: `${(total / max) * 100}%` }} />
                            </div>
                            <div className="score-label">
                                <span>0</span>
                                <span>{total >= 18 ? '✅ Good Match' : total >= 12 ? '⚠️ Average' : '❌ Below Average'}</span>
                                <span>{max}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid-2">
                        {Object.entries(scores).map(([k, v]) => (
                            <div key={k} className="card" style={{ padding: '1rem' }}>
                                <div className="data-row">
                                    <span className="data-label" style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                                    <span className="data-value highlight">{typeof v === 'number' ? v : String(v)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => { setStep('boy'); setResult(null); }}>
                        New Comparison
                    </button>
                </>
            )}
        </>
    );
}
