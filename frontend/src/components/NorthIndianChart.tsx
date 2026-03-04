'use client';

/**
 * North Indian Chart Component — SVG diamond layout
 * Houses are fixed positions, signs rotate based on ascendant.
 * H1 = top diamond, clockwise through H12.
 * Based on traditional 550×550 North Indian chart geometry.
 */

const SIGN_SHORT = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

const PLANET_ABBR: Record<string, string> = {
    'Ascendantℒ': 'As',
    'Sun☉': 'Su', 'Moon☾': 'Mo', 'Mars♂': 'Ma', 'Mercury☿': 'Me',
    'Mercury☿℞': 'Me℞', 'Jupiter♃': 'Ju', 'Jupiter♃℞': 'Ju℞',
    'Venus♀': 'Ve', 'Venus♀℞': 'Ve℞', 'Saturn♄': 'Sa', 'Saturn♄℞': 'Sa℞',
    'Raagu☊': 'Ra', 'Kethu☋': 'Ke',
    'Uranus⛢': 'Ur', 'Neptune♆': 'Ne', 'Pluto♇': 'Pl',
};

// House config: planet text center (px, py) and sign number position (sx, sy)
// 4 Diamonds: planets centered wide, sign numbers placed near inner central cross
// 8 Triangles: planets centered near wide base, sign numbers near inner vertex point
const HOUSE_CONFIG = [
    { px: 275, py: 130, sx: 275, sy: 250 },       // H1: Top Diamond
    { px: 137.5, py: 65, sx: 137.5, sy: 115 },    // H2: Top-Left Upper Tri (base at top)
    { px: 65, py: 137.5, sx: 115, sy: 137.5 },    // H3: Top-Left Lower Tri (base at left)
    { px: 130, py: 275, sx: 250, sy: 275 },       // H4: Left Diamond
    { px: 65, py: 412.5, sx: 115, sy: 412.5 },    // H5: Bot-Left Upper Tri (base at left)
    { px: 137.5, py: 485, sx: 137.5, sy: 435 },   // H6: Bot-Left Lower Tri (base at bottom)
    { px: 275, py: 420, sx: 275, sy: 300 },       // H7: Bottom Diamond
    { px: 412.5, py: 485, sx: 412.5, sy: 435 },   // H8: Bot-Right Lower Tri (base at bottom)
    { px: 485, py: 412.5, sx: 435, sy: 412.5 },   // H9: Bot-Right Upper Tri (base at right)
    { px: 420, py: 275, sx: 300, sy: 275 },       // H10: Right Diamond
    { px: 485, py: 137.5, sx: 435, sy: 137.5 },   // H11: Top-Right Lower Tri (base at right)
    { px: 412.5, py: 65, sx: 412.5, sy: 115 },    // H12: Top-Right Upper Tri (base at top)
];

interface NorthIndianChartProps {
    charts: string[];
    ascendantHouse: number;
    label?: string;
}

function parsePlanets(cell: string): string[] {
    if (!cell || !cell.trim()) return [];
    return cell.split('\n').map(s => s.trim()).filter(Boolean);
}

function abbreviate(planet: string): string {
    if (PLANET_ABBR[planet]) return PLANET_ABBR[planet];
    const clean = planet.replace(/℞/g, '').trim();
    if (PLANET_ABBR[clean]) return PLANET_ABBR[clean] + (planet.includes('℞') ? '℞' : '');
    return planet.replace(/[☉☾♂☿♃♀♄☊☋⛢♆♇ℒ℞]/g, '').trim().slice(0, 3);
}

export default function NorthIndianChart({ charts, ascendantHouse, label }: NorthIndianChartProps) {
    // Build houses: map house index (0=H1..11=H12) to planets from that sign
    const houses: string[][] = Array.from({ length: 12 }, (_, houseIdx) => {
        const signIdx = (ascendantHouse + houseIdx) % 12;
        return parsePlanets(charts[signIdx] || '');
    });

    return (
        <div className="ni-chart">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 550 550"
                className="ni-svg"
                role="img"
            >
                {/* Background */}
                <rect width="550" height="550" className="ni-bg" />

                {/* Outer box */}
                <rect width="550" height="550" fill="none" className="ni-outer-box" />

                {/* Diagonal lines */}
                <line x1="0" y1="0" x2="550" y2="550" className="ni-line" />
                <line x1="550" y1="0" x2="0" y2="550" className="ni-line" />

                {/* Inner diamond */}
                <polygon points="275,0 550,275 275,550 0,275" fill="none" className="ni-diamond" />

                {/* Houses */}
                {HOUSE_CONFIG.map((config, i) => {
                    const signNum = ((ascendantHouse + i) % 12) + 1; // 1-12 sign number
                    const planetList = houses[i];
                    const count = planetList.length;

                    const fontSize = count > 4 ? 10 : (count > 2 ? 11 : 12);
                    const lineHeight = count > 4 ? 12 : (count > 2 ? 15 : 18);
                    const startY = count ? config.py - ((count - 1) * lineHeight) / 2 : config.py;

                    return (
                        <g key={`house-${i}`}>
                            {/* Sign (House) number */}
                            <text
                                x={config.sx}
                                y={config.sy}
                                className="ni-sign-label"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {signNum}
                            </text>

                            {/* Planets */}
                            {planetList.map((planet, pIdx) => {
                                const currentY = startY + (pIdx * lineHeight);
                                const isRetro = planet.includes('℞');
                                const isAsc = planet.includes('Ascendant');
                                const abbr = abbreviate(planet).replace(/℞/g, ''); // strip inline symbol

                                return (
                                    <text
                                        key={`${planet}-${pIdx}`}
                                        x={config.px}
                                        y={currentY}
                                        fontSize={fontSize}
                                        fontWeight="600"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        className={`ni-planet ${isRetro ? 'ni-retro' : ''} ${isAsc ? 'ni-asc-planet' : ''}`}
                                    >
                                        {abbr}
                                        {isRetro && (
                                            <tspan fontSize="0.7em" baselineShift="super" dx="1">(R)</tspan>
                                        )}
                                    </text>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
