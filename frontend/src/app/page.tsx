'use client';
import { useEffect, useState } from 'react';
import { useBirthData } from '@/lib/BirthDataContext';
import { getPanchanga, getEclipse } from '@/lib/api';

export default function PanchangaPage() {
  const { birthData, isSet } = useBirthData();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [eclipseResult, setEclipseResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEclipses, setShowEclipses] = useState(false);

  useEffect(() => {
    if (!isSet || !birthData) return;
    setLoading(true); setError(''); setResult(null); setEclipseResult(null);
    Promise.all([
      getPanchanga(birthData).then(setResult),
      getEclipse(birthData).then(setEclipseResult).catch(e => console.warn('Eclipse fetch failed', e))
    ])
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [birthData, isSet]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = result as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eclipse = eclipseResult as any;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">पंचाङ्ग Panchāṅga</h1>
        <p className="page-subtitle">Daily astronomical almanac — Tithi, Nakshatra, Yoga, Karana, and timings</p>
      </div>
      {!isSet && <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Enter birth data above to see Panchanga</div>}
      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading-state"><div className="spinner" /> Computing Panchanga...</div>}
      {r && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">☀️ Day & Timings</div>
            <div className="data-row"><span className="data-label">Vaara</span><span className="data-value highlight">{(r.vaara as Record<string, unknown>)?.name as string}</span></div>
            <div className="data-row"><span className="data-label">Sunrise</span><span className="data-value">{r.sunrise as string}</span></div>
            <div className="data-row"><span className="data-label">Sunset</span><span className="data-value">{r.sunset as string}</span></div>
            <div className="data-row"><span className="data-label">Moonrise</span><span className="data-value">{r.moonrise as string}</span></div>
            <div className="data-row"><span className="data-label">Moonset</span><span className="data-value">{r.moonset as string}</span></div>
          </div>
          <div className="card">
            <div className="card-title">🌙 Tithi</div>
            <div className="data-row"><span className="data-label">Name</span><span className="data-value highlight">{(r.tithi as Record<string, unknown>)?.name as string}</span></div>
            <div className="data-row"><span className="data-label">Paksha</span><span className="data-value">{(r.tithi as Record<string, unknown>)?.paksha as string}</span></div>
            <div className="data-row"><span className="data-label">Start</span><span className="data-value">{(r.tithi as Record<string, unknown>)?.start as string}</span></div>
            <div className="data-row"><span className="data-label">End</span><span className="data-value">{(r.tithi as Record<string, unknown>)?.end as string}</span></div>
            <div className="data-row"><span className="data-label">Balance</span><span className="data-value">{(r.tithi as Record<string, unknown>)?.balance_percent as number}%</span></div>
          </div>
          <div className="card">
            <div className="card-title">⭐ Nakshatra</div>
            <div className="data-row"><span className="data-label">Name</span><span className="data-value highlight">{(r.nakshatra as Record<string, unknown>)?.name as string}</span></div>
            <div className="data-row"><span className="data-label">Pada</span><span className="data-value">{(r.nakshatra as Record<string, unknown>)?.pada as number}</span></div>
            <div className="data-row"><span className="data-label">Start</span><span className="data-value">{(r.nakshatra as Record<string, unknown>)?.start as string}</span></div>
            <div className="data-row"><span className="data-label">End</span><span className="data-value">{(r.nakshatra as Record<string, unknown>)?.end as string}</span></div>
            <div className="data-row"><span className="data-label">Balance</span><span className="data-value">{(r.nakshatra as Record<string, unknown>)?.balance_percent as number}%</span></div>
          </div>
          <div className="card">
            <div className="card-title">🕉️ Yoga & Karana</div>
            <div className="data-row"><span className="data-label">Yoga</span><span className="data-value highlight">{(r.yoga as Record<string, unknown>)?.name as string}</span></div>
            <div className="data-row"><span className="data-label">Karana</span><span className="data-value highlight">{(r.karana as Record<string, unknown>)?.name as string}</span></div>
            <div className="data-row"><span className="data-label">Raasi</span><span className="data-value">{(r.raasi as Record<string, unknown>)?.name as string}</span></div>
          </div>
          <div className="card">
            <div className="card-title">⏰ Muhurtas & Kaalam</div>
            {r.rahu_kalam && <div className="data-row"><span className="data-label">Rahu Kalam</span><span className="data-value">{(r.rahu_kalam as Record<string, unknown>)?.start as string} – {(r.rahu_kalam as Record<string, unknown>)?.end as string}</span></div>}
            {r.yamagandam && <div className="data-row"><span className="data-label">Yamagandam</span><span className="data-value">{(r.yamagandam as Record<string, unknown>)?.start as string} – {(r.yamagandam as Record<string, unknown>)?.end as string}</span></div>}
            {r.gulikai_kalam && <div className="data-row"><span className="data-label">Gulikai</span><span className="data-value">{(r.gulikai_kalam as Record<string, unknown>)?.start as string} – {(r.gulikai_kalam as Record<string, unknown>)?.end as string}</span></div>}
            {r.abhijit_muhurta && <div className="data-row"><span className="data-label">Abhijit Muhurta</span><span className="data-value">{(r.abhijit_muhurta as Record<string, unknown>)?.start as string} – {(r.abhijit_muhurta as Record<string, unknown>)?.end as string}</span></div>}
            {r.durmuhurtam && <div className="data-row"><span className="data-label">Durmuhurtam</span><span className="data-value">{(r.durmuhurtam as Record<string, unknown>)?.start as string} – {(r.durmuhurtam as Record<string, unknown>)?.end as string}</span></div>}
          </div>
          <div className="card">
            <div className="card-title">📅 Calendar</div>
            {r.lunar_month && <div className="data-row"><span className="data-label">Lunar Month</span><span className="data-value highlight">{(r.lunar_month as Record<string, unknown>)?.name as string}</span></div>}
            {r.samvatsara && <div className="data-row"><span className="data-label">Samvatsara</span><span className="data-value">{(r.samvatsara as Record<string, unknown>)?.name as string}</span></div>}
            {r.place && <div className="data-row"><span className="data-label">Place</span><span className="data-value">{(r.place as Record<string, unknown>)?.name as string}</span></div>}
            {r.place && <div className="data-row"><span className="data-label">Timezone</span><span className="data-value">UTC{((r.place as Record<string, unknown>)?.timezone as number) >= 0 ? '+' : ''}{(r.place as Record<string, unknown>)?.timezone as number}</span></div>}
          </div>
        </div>
      )}

      {eclipse && (
        <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem', transition: 'all 0.3s' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={() => setShowEclipses(!showEclipses)}
          >
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🌒 Upcoming Solar & Lunar Eclipses
            </span>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', transition: 'transform 0.3s', transform: showEclipses ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </div>

          {showEclipses && (
            <div className="grid-2" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              {eclipse.solar_eclipse && (() => {
                const s = eclipse.solar_eclipse as Record<string, unknown>;
                return (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>🌑 Solar Eclipse</h3>
                    <div className="data-row"><span className="data-label">Type</span><span className="data-value highlight">{s.type as string}</span></div>
                    {Boolean(s.start) && <div className="data-row"><span className="data-label">Start</span><span className="data-value">{(s.start as Record<string, string>).date} {(s.start as Record<string, string>).time}</span></div>}
                    {Boolean(s.peak) && <div className="data-row"><span className="data-label">Peak</span><span className="data-value highlight">{(s.peak as Record<string, string>).date} {(s.peak as Record<string, string>).time}</span></div>}
                    {Boolean(s.end) && <div className="data-row"><span className="data-label">End</span><span className="data-value">{(s.end as Record<string, string>).date} {(s.end as Record<string, string>).time}</span></div>}
                    {Boolean(s.note) && <div className="data-row" style={{ marginTop: '0.5rem', borderBottom: 'none' }}><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ℹ️ {s.note as string}</span></div>}
                  </div>
                );
              })()}
              {eclipse.lunar_eclipse && (() => {
                const l = eclipse.lunar_eclipse as Record<string, unknown>;
                const timeLabels: Record<string, string> = {
                  penumbral_start: 'Penumbral Start',
                  partial_start: 'Partial Start',
                  total_start: 'Total Start',
                  peak: 'Peak',
                  total_end: 'Total End',
                  partial_end: 'Partial End',
                  penumbral_end: 'Penumbral End',
                };
                return (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>🌕 Lunar Eclipse</h3>
                    <div className="data-row"><span className="data-label">Type</span><span className="data-value highlight">{l.type as string}</span></div>
                    {Object.entries(timeLabels).map(([key, label]) => {
                      const t = l[key] as Record<string, string> | undefined;
                      if (!t) return null;
                      return (
                        <div key={key} className="data-row">
                          <span className="data-label">{label}</span>
                          <span className="data-value" style={{ fontWeight: key === 'peak' ? 700 : 400, color: key === 'peak' ? 'var(--accent-gold)' : undefined }}>
                            {t.date} {t.time}
                          </span>
                        </div>
                      );
                    })}
                    {Boolean(l.note) && <div className="data-row" style={{ marginTop: '0.5rem', borderBottom: 'none' }}><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ℹ️ {l.note as string}</span></div>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </>
  );
}
