'use client';

/**
 * South Indian Chart Grid Component
 * Renders a 4×4 grid with 12 peripheral cells (houses) + center label area.
 * 
 * South Indian chart layout (signs are FIXED, ascendant rotates):
 *   ┌────┬────┬────┬────┐
 *   │ Pi │ Ar │ Ta │ Ge │
 *   ├────┼────┴────┼────┤
 *   │ Aq │         │ Cn │
 *   ├────┤  LABEL  ├────┤
 *   │ Cp │         │ Le │
 *   ├────┼────┬────┼────┤
 *   │ Sg │ Sc │ Li │ Vi │
 *   └────┴────┴────┴────┘
 */

const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_SHORT = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

// South Indian grid positions: maps sign index (0=Aries..11=Pisces) to [row, col]
const SIGN_GRID: Record<number, [number, number]> = {
    11: [0, 0], // Pisces
    0: [0, 1],  // Aries
    1: [0, 2],  // Taurus
    2: [0, 3],  // Gemini
    10: [1, 0], // Aquarius
    3: [1, 3],  // Cancer
    9: [2, 0],  // Capricorn
    4: [2, 3],  // Leo
    8: [3, 0],  // Sagittarius
    7: [3, 1],  // Scorpio
    6: [3, 2],  // Libra
    5: [3, 3],  // Virgo
};

// Planet display abbreviations
const PLANET_ABBR: Record<string, string> = {
    'Ascendantℒ': 'As',
    'Sun☉': 'Su',
    'Moon☾': 'Mo',
    'Mars♂': 'Ma',
    'Mercury☿': 'Me',
    'Mercury☿℞': 'Me℞',
    'Jupiter♃': 'Ju',
    'Jupiter♃℞': 'Ju℞',
    'Venus♀': 'Ve',
    'Venus♀℞': 'Ve℞',
    'Saturn♄': 'Sa',
    'Saturn♄℞': 'Sa℞',
    'Raagu☊': 'Ra',
    'Kethu☋': 'Ke',
    'Uranus⛢': 'Ur',
    'Neptune♆': 'Ne',
    'Pluto♇': 'Pl',
};

interface SouthIndianChartProps {
    charts: string[];         // 12-element array, index = sign (0=Ar..11=Pi)
    ascendantHouse: number;   // sign index of ascendant (0-11)
    label?: string;           // e.g. "D1 Rāśi" or "D9 Navāṃśa"
}

function parsePlanets(cell: string): string[] {
    if (!cell || !cell.trim()) return [];
    return cell.split('\n').map(s => s.trim()).filter(Boolean);
}

function abbreviate(planet: string): string {
    // Try exact match first
    if (PLANET_ABBR[planet]) return PLANET_ABBR[planet];
    // Try without retrograde symbol
    const clean = planet.replace(/℞/g, '').trim();
    if (PLANET_ABBR[clean]) return PLANET_ABBR[clean] + (planet.includes('℞') ? '℞' : '');
    // Fallback: first 2 chars
    return planet.replace(/[☉☾♂☿♃♀♄☊☋⛢♆♇ℒ℞]/g, '').trim().slice(0, 2);
}

export default function SouthIndianChart({ charts, ascendantHouse, label }: SouthIndianChartProps) {
    // Build 4×4 grid
    const grid: (null | { signIdx: number; planets: string[]; isAsc: boolean })[][] = Array.from(
        { length: 4 }, () => Array(4).fill(null)
    );

    for (let signIdx = 0; signIdx < 12; signIdx++) {
        const [r, c] = SIGN_GRID[signIdx];
        const planets = parsePlanets(charts[signIdx] || '');
        grid[r][c] = { signIdx, planets, isAsc: signIdx === ascendantHouse };
    }

    // House number relative to ascendant
    const houseNum = (signIdx: number) => ((signIdx - ascendantHouse + 12) % 12) + 1;

    return (
        <div className="si-chart">
            <div className="si-grid">
                {grid.map((row, ri) =>
                    row.map((cell, ci) => {
                        // Center cells (1,1), (1,2), (2,1), (2,2)
                        if (cell === null) {
                            if (ri === 1 && ci === 1) {
                                return (
                                    <div key={`${ri}-${ci}`} className="si-center" style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}>
                                        <div className="si-center-label">{label || 'Chart'}</div>
                                        <div className="si-center-sub">
                                            Asc: {SIGN_NAMES[ascendantHouse]}
                                        </div>
                                    </div>
                                );
                            }
                            return null; // Skip other center cells
                        }

                        const hNum = houseNum(cell.signIdx);
                        return (
                            <div
                                key={`${ri}-${ci}`}
                                className={`si-cell ${cell.isAsc ? 'si-cell-asc' : ''}`}
                                style={{
                                    gridRow: ri + 1,
                                    gridColumn: ci + 1,
                                }}
                            >
                                <div className="si-cell-header">
                                    <span className="si-sign">{SIGN_SYMBOLS[cell.signIdx]} {SIGN_SHORT[cell.signIdx]}</span>
                                    <span className="si-house">H{hNum}</span>
                                </div>
                                <div className="si-planets">
                                    {cell.planets.map((p, i) => {
                                        const abbr = abbreviate(p).replace(/℞/g, ''); // strip inline symbol
                                        const isRetro = p.includes('℞');
                                        return (
                                            <span
                                                key={i}
                                                className={`si-planet ${isRetro ? 'si-retro' : ''} ${p.includes('Ascendant') ? 'si-asc-label' : ''}`}
                                                title={p}
                                            >
                                                {abbr}
                                                {isRetro && <sup style={{ fontSize: '0.7em', marginLeft: '1px' }}>(R)</sup>}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
