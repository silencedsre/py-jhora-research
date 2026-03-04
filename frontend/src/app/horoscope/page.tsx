'use client';
import { useEffect, useState } from 'react';
import { useBirthData } from '@/lib/BirthDataContext';
import { getPlanets, getDivisionalChart } from '@/lib/api';
import SouthIndianChart from '@/components/SouthIndianChart';
import NorthIndianChart from '@/components/NorthIndianChart';

interface ArudhaPada {
    id: string;
    name: string;
    rasi: number;
    sign: string;
}

interface Planet {
    id: number; name: string; house: number; rasi: number; sign: string;
    longitude: number; retrograde: boolean; nakshatra: string; pada: number;
    chara_karaka?: string;
}

const DIVISIONAL_CHARTS = [
    { factor: 1, label: 'D1 Rāśi' },
    { factor: 2, label: 'D2 Horā' },
    { factor: 3, label: 'D3 Drekkāṇa' },
    { factor: 4, label: 'D4 Chaturthāṃśa' },
    { factor: 5, label: 'D5 Pañchamāṃśa' },
    { factor: 7, label: 'D7 Saptāṃśa' },
    { factor: 9, label: 'D9 Navāṃśa' },
    { factor: 10, label: 'D10 Daśāṃśa' },
    { factor: 12, label: 'D12 Dvādaśāṃśa' },
    { factor: 16, label: 'D16 Ṣoḍaśāṃśa' },
    { factor: 20, label: 'D20 Viṃśāṃśa' },
    { factor: 24, label: 'D24 Siddhāṃśa' },
    { factor: 27, label: 'D27 Nakṣatrāṃśa' },
    { factor: 30, label: 'D30 Triṃśāṃśa' },
    { factor: 40, label: 'D40 Khavedāṃśa' },
    { factor: 45, label: 'D45 Akṣavedāṃśa' },
    { factor: 60, label: 'D60 Ṣaṣṭyāṃśa' },
];

const PLANET_SYMBOLS: Record<string, string> = {
    Sun: '☉', Moon: '☾', Mars: '♂', Mercury: '☿', Jupiter: '♃',
    Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

export default function HoroscopePage() {
    const { birthData, isSet } = useBirthData();
    const [result, setResult] = useState<{ ascendant: Record<string, unknown>; planets: Planet[]; arudhas?: ArudhaPada[] } | null>(null);
    const [chartResult, setChartResult] = useState<Record<string, unknown> | null>(null);
    const [selectedChart, setSelectedChart] = useState(1);
    const [loading, setLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState('');
    const [chartStyle, setChartStyle] = useState<'south' | 'north'>('south');
    const [showOuterPlanets, setShowOuterPlanets] = useState(false);

    useEffect(() => {
        if (!isSet || !birthData) return;
        setLoading(true); setError(''); setResult(null);
        getPlanets(birthData)
            .then(res => setResult(res as { ascendant: Record<string, unknown>; planets: Planet[]; arudhas?: ArudhaPada[] }))
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, [birthData, isSet]);

    useEffect(() => {
        if (!isSet || !birthData) { setChartResult(null); return; }
        setChartLoading(true); setChartResult(null);
        getDivisionalChart({ birth_data: birthData, chart_type: selectedChart })
            .then(setChartResult)
            .catch((e: Error) => setError(e.message))
            .finally(() => setChartLoading(false));
    }, [birthData, isSet, selectedChart]);

    // Build D1 chart from planet positions
    const buildD1Chart = (): string[] => {
        if (!result) return Array(12).fill('');
        const houses: string[][] = Array.from({ length: 12 }, () => []);
        const ascRasi = result.ascendant.rasi as number ?? result.ascendant.house as number ?? 0;
        houses[ascRasi].push('Ascendantℒ');
        for (const p of result.planets) {
            if (!showOuterPlanets && ['Uranus', 'Neptune', 'Pluto'].includes(p.name)) continue;
            const rasi = p.rasi ?? p.house ?? 0;
            const sym = PLANET_SYMBOLS[p.name] || '';
            let label = `${p.name}${sym}${p.retrograde ? '℞' : ''}`;
            // Optional: Show AK/AmK on the chart itself for D1
            // if (selectedChart === 1 && p.chara_karaka) label += `(${p.chara_karaka})`;
            houses[rasi].push(label);
        }

        // Also add Arudha Padas to D1 chart if available
        if (selectedChart === 1 && result.arudhas) {
            for (const a of result.arudhas) {
                if (a.rasi >= 0 && a.rasi < 12) {
                    houses[a.rasi].push(a.id);
                }
            }
        }
        return houses.map(h => h.join('\n'));
    };

    const ascendantRasi = result ? (result.ascendant.rasi as number ?? result.ascendant.house as number ?? 0) : 0;
    const chartLabel = DIVISIONAL_CHARTS.find(c => c.factor === selectedChart)?.label || `D${selectedChart}`;

    // Chart data: use API charts array if available, else build from D1
    const chartsArray: string[] | null = chartResult
        ? ((chartResult.charts as string[] | undefined) ?? []).map(h =>
            h.split('\n').filter(p => showOuterPlanets || !/Uranus|Neptune|Pluto/.test(p)).join('\n')
        )
        : (selectedChart === 1 && result ? buildD1Chart() : null);
    const chartAscHouse: number = chartResult
        ? (chartResult.ascendant_house as number ?? ascendantRasi)
        : ascendantRasi;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">🪐 Horoscope & Divisional Charts</h1>
                <p className="page-subtitle">Planet positions, Divisional charts, Jaimini Karakas and Arudhas</p>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <input type="checkbox" checked={showOuterPlanets} onChange={e => setShowOuterPlanets(e.target.checked)} style={{ accentColor: 'var(--accent-gold)' }} />
                        <span>Include Outer Planets (Ur, Ne, Pl)</span>
                    </label>
                </div>
            </div>
            {!isSet && <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Enter birth data above to see Horoscope</div>}
            {error && <div className="error-box">{error}</div>}
            {loading && <div className="loading-state"><div className="spinner" /> Computing chart...</div>}

            {result && (
                <>
                    {/* Chart selector + style toggle */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div className="card-title" style={{ marginBottom: 0 }}>Select Chart</div>
                            <div className="chart-style-toggle">
                                <button className={`chart-style-btn ${chartStyle === 'south' ? 'active' : ''}`} onClick={() => setChartStyle('south')}>South Indian</button>
                                <button className={`chart-style-btn ${chartStyle === 'north' ? 'active' : ''}`} onClick={() => setChartStyle('north')}>North Indian</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {DIVISIONAL_CHARTS.map(c => (
                                <button
                                    key={c.factor}
                                    className={`badge ${selectedChart === c.factor ? 'badge-gold' : 'badge-violet'}`}
                                    style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 0.8rem' }}
                                    onClick={() => setSelectedChart(c.factor)}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Grid */}
                    {chartLoading && <div className="loading-state"><div className="spinner" /> Computing {chartLabel}...</div>}

                    {chartsArray && (
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-title">{chartLabel} Chart {selectedChart === 1 && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(with Arudhas)</span>}</div>
                            {chartStyle === 'south' ? (
                                <SouthIndianChart charts={chartsArray} ascendantHouse={chartAscHouse} label={chartLabel} />
                            ) : (
                                <NorthIndianChart charts={chartsArray} ascendantHouse={chartAscHouse} label={chartLabel} />
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                        {/* Planet Details Table */}
                        <div className="card" style={{ flex: '2 1 500px', minWidth: 0, overflowX: 'auto' }}>
                            <div className="card-title">🪐 Planet Positions {selectedChart === 1 ? '(D1 Rāśi)' : `(${chartLabel})`}</div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Planet</th>
                                            <th>Sign</th>
                                            <th>House</th>
                                            <th>Longitude</th>
                                            <th>Nakshatra</th>
                                            {selectedChart === 1 && <th>Karaka</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ background: 'rgba(245, 200, 66, 0.04)' }}>
                                            <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>Ascendant ℒ</td>
                                            <td style={{ color: 'var(--accent-gold)' }}>{result.ascendant.sign as string}</td>
                                            <td>1</td>
                                            <td>{(result.ascendant.longitude as number).toFixed(4)}°</td>
                                            <td>—</td>
                                            {selectedChart === 1 && <td>—</td>}
                                        </tr>
                                        {result.planets.filter(p => showOuterPlanets || !['Uranus', 'Neptune', 'Pluto'].includes(p.name)).map(p => (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {PLANET_SYMBOLS[p.name] || ''} {p.name}
                                                    {p.retrograde && <span style={{ color: 'var(--accent-rose)', marginLeft: '0.3rem', fontSize: '0.78rem' }}>℞</span>}
                                                </td>
                                                <td style={{ color: 'var(--accent-gold)' }}>{p.sign}</td>
                                                <td>{p.house}</td>
                                                <td>{p.longitude.toFixed(4)}°</td>
                                                <td>{p.nakshatra} <span style={{ color: 'var(--text-muted)' }}>({p.pada})</span></td>
                                                {selectedChart === 1 && (
                                                    <td>
                                                        {p.chara_karaka && <span className="badge badge-gold" title="Jaimini Chara Karaka">{p.chara_karaka}</span>}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Jaimini Arudha Padas Table */}
                        {selectedChart === 1 && result.arudhas && result.arudhas.length > 0 && (
                            <div className="card" style={{ flex: '1 1 300px', minWidth: 0, overflowX: 'auto' }}>
                                <div className="card-title">✨ Jaimini Arudha Padas (D1)</div>
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Pada</th>
                                                <th>Sign</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.arudhas.map(a => (
                                                <tr key={a.id}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>{a.id}</span>
                                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{a.name.replace(`(${a.id})`, '').trim()}</span>
                                                    </td>
                                                    <td style={{ color: 'var(--accent-violet)' }}>{a.sign}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
