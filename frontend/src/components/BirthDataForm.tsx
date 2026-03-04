'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { searchCities, getAyanamsas, type BirthData } from '@/lib/api';
import { useBirthData } from '@/lib/BirthDataContext';

interface City {
    name: string;
    country_code: string;
    latitude: number;
    longitude: number;
    timezone: string;
    timezone_offset: number;
}

const KATHMANDU: City = {
    name: 'Kathmandu', country_code: 'NP',
    latitude: 27.7172, longitude: 85.324,
    timezone: 'Asia/Kathmandu', timezone_offset: 5.75,
};

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function nowTimeStr() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function BirthDataForm() {
    const { birthData, setBirthData, isSet } = useBirthData();
    const [place, setPlace] = useState(`${KATHMANDU.name}, ${KATHMANDU.country_code}`);
    const [date, setDate] = useState(todayStr());
    const [time, setTime] = useState(nowTimeStr());
    const [language, setLanguage] = useState('en');
    const [ayanamsa, setAyanamsa] = useState('TRUE_PUSHYA');
    const [trueNodes, setTrueNodes] = useState(true);
    const [sunriseDiscCenter, setSunriseDiscCenter] = useState(true);
    const [sunriseRefraction, setSunriseRefraction] = useState(false);
    const [ayanamsaList, setAyanamsaList] = useState<string[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(KATHMANDU);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isCustomLoc, setIsCustomLoc] = useState(false);
    const [customLat, setCustomLat] = useState<string>('');
    const [customLon, setCustomLon] = useState<string>('');
    const [customTz, setCustomTz] = useState<string>('');
    const dropRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        getAyanamsas().then(res => setAyanamsaList(res.ayanamsas)).catch(() => { });
    }, []);

    const handlePlaceChange = useCallback((val: string) => {
        setPlace(val);
        setSelectedCity(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.length >= 2) {
            debounceRef.current = setTimeout(async () => {
                try {
                    const res = await searchCities(val);
                    setCities(res.cities);
                    setShowDropdown(true);
                } catch (_e) { setCities([]); }
            }, 300);
        } else {
            setCities([]);
            setShowDropdown(false);
        }
    }, []);

    const handleCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const offset = -new Date().getTimezoneOffset() / 60;
                const locCity: City = {
                    name: "Current Location",
                    country_code: "Local",
                    latitude,
                    longitude,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    timezone_offset: offset
                };
                selectCity(locCity);
                setIsLocating(false);
            },
            (err) => {
                console.error("Geolocation Error:", err);
                let errorMessage = "Could not get current location.";
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = "Location permission denied. Please allow location access in your browser settings.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable. This may happen on local networks without HTTPS or GPS access.";
                        break;
                    case err.TIMEOUT:
                        errorMessage = "The location request timed out. Please try again or enter custom coordinates.";
                        break;
                }
                alert(errorMessage);
                setIsLocating(false);
            },
            { timeout: 10000 }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectCity = (city: City) => {
        setPlace(`${city.name}, ${city.country_code}`);
        setSelectedCity(city);
        setShowDropdown(false);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: BirthData = { date, time, language, ayanamsa, true_nodes: trueNodes, sunrise_disc_center: sunriseDiscCenter, sunrise_refraction: sunriseRefraction };

        if (isCustomLoc) {
            data.place = place || 'Custom Location';
            data.latitude = parseFloat(customLat);
            data.longitude = parseFloat(customLon);
            data.timezone_offset = parseFloat(customTz);
            if (isNaN(data.latitude) || isNaN(data.longitude) || isNaN(data.timezone_offset)) {
                alert("Please enter valid numbers for Latitude, Longitude, and Timezone.");
                return;
            }
        } else if (selectedCity) {
            data.place = `${selectedCity.name},${selectedCity.country_code}`;
            data.latitude = selectedCity.latitude;
            data.longitude = selectedCity.longitude;
            data.timezone_offset = selectedCity.timezone_offset;
        } else {
            data.place = place;
        }
        setBirthData(data);
        setIsCollapsed(true);
    };

    // Show compact summary when collapsed and data is set
    if (isCollapsed && isSet && birthData) {
        return (
            <div className="birth-bar">
                <div className="birth-bar-inner">
                    <span className="birth-bar-icon">🪷</span>
                    <span className="birth-bar-info">
                        <strong>{birthData.place}</strong>
                        <span className="birth-bar-sep">•</span>
                        {birthData.date}
                        <span className="birth-bar-sep">•</span>
                        {birthData.time}
                        <span className="birth-bar-sep">•</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {birthData.ayanamsa || 'LAHIRI'} · ☊{birthData.true_nodes !== false ? 'True' : 'Mean'} · ☀{birthData.sunrise_disc_center !== false ? 'Mid' : 'Edge'}{birthData.sunrise_refraction ? '+R' : ''}
                        </span>
                    </span>
                    <button className="birth-bar-edit" onClick={() => setIsCollapsed(false)}>
                        ✏️ Edit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="birth-form-card">
            <div className="form-row">
                <div className="form-group" ref={dropRef}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Place</span>
                        <span
                            style={{ cursor: 'pointer', color: 'var(--accent-violet)', fontSize: '0.75rem', textTransform: 'none' }}
                            onClick={() => setIsCustomLoc(!isCustomLoc)}
                        >
                            {isCustomLoc ? 'Use Search' : 'Enter Custom'}
                        </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="form-input"
                            style={!isCustomLoc ? { paddingRight: '2.5rem' } : undefined}
                            placeholder={isCustomLoc ? "City Name (Optional)" : "Search city..."}
                            value={place}
                            onChange={e => handlePlaceChange(e.target.value)}
                            required={!isCustomLoc}
                        />
                        {!isCustomLoc && (
                            <>
                                <button
                                    type="button"
                                    className="location-btn"
                                    onClick={handleCurrentLocation}
                                    disabled={isLocating}
                                    title="Use Current Location"
                                >
                                    {isLocating ? '⏳' : '📍'}
                                </button>
                                {showDropdown && cities.length > 0 && (
                                    <div className="city-dropdown">
                                        {cities.map((c, i) => (
                                            <div key={i} className="city-option" onClick={() => selectCity(c)}>
                                                <span>{c.name}</span>
                                                <span className="cc">{c.country_code} • {c.timezone_offset >= 0 ? '+' : ''}{c.timezone_offset}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {selectedCity && !isCustomLoc && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', marginLeft: '0.2rem' }}>
                            {selectedCity.latitude.toFixed(4)}°, {selectedCity.longitude.toFixed(4)}° • TZ: {selectedCity.timezone_offset >= 0 ? '+' : ''}{selectedCity.timezone_offset}h
                        </div>
                    )}
                </div>
                {isCustomLoc && (
                    <>
                        <div className="form-group">
                            <label className="form-label">Latitude</label>
                            <input className="form-input" type="number" step="any" placeholder="e.g. 27.7172" value={customLat} onChange={e => setCustomLat(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Longitude</label>
                            <input className="form-input" type="number" step="any" placeholder="e.g. 85.3240" value={customLon} onChange={e => setCustomLon(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Timezone (hrs)</label>
                            <input className="form-input" type="number" step="any" placeholder="e.g. 5.75" value={customTz} onChange={e => setCustomTz(e.target.value)} required />
                        </div>
                    </>
                )}
                <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Time</label>
                    <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label">Language</label>
                    <select className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
                        <option value="en">English</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                        <option value="hi">Hindi</option>
                        <option value="ka">Kannada</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Ayanāṃśa</label>
                    <select className="form-select" value={ayanamsa} onChange={e => setAyanamsa(e.target.value)}>
                        {ayanamsaList.length > 0 ? ayanamsaList.map(a => (
                            <option key={a} value={a}>{a}</option>
                        )) : (
                            <>
                                <option value="LAHIRI">LAHIRI</option>
                                <option value="KP">KP</option>
                                <option value="RAMAN">RAMAN</option>
                                <option value="TRUE_CITRA">TRUE_CITRA</option>
                            </>
                        )}
                    </select>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <span>☊ Rahu/Ketu:</span>
                    <button
                        type="button"
                        onClick={() => setTrueNodes(!trueNodes)}
                        style={{
                            padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-xs)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            background: trueNodes ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 200, 66, 0.15)',
                            color: trueNodes ? 'var(--accent-violet)' : 'var(--accent-gold)',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        }}
                    >
                        {trueNodes ? 'True Nodes' : 'Mean Nodes'}
                    </button>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <span>☀ Sunrise:</span>
                    <button
                        type="button"
                        onClick={() => setSunriseDiscCenter(!sunriseDiscCenter)}
                        style={{
                            padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-xs)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            background: sunriseDiscCenter ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 200, 66, 0.15)',
                            color: sunriseDiscCenter ? 'var(--accent-violet)' : 'var(--accent-gold)',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        }}
                    >
                        {sunriseDiscCenter ? 'Disc Centre' : 'Disc Bottom'}
                    </button>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <span>Refraction:</span>
                    <button
                        type="button"
                        onClick={() => setSunriseRefraction(!sunriseRefraction)}
                        style={{
                            padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-xs)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            background: sunriseRefraction ? 'rgba(245, 200, 66, 0.15)' : 'rgba(139, 92, 246, 0.2)',
                            color: sunriseRefraction ? 'var(--accent-gold)' : 'var(--accent-violet)',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        }}
                    >
                        {sunriseRefraction ? 'On' : 'Off'}
                    </button>
                </label>
            </div>
            <button className="btn btn-primary" type="submit" disabled={!date}>
                🪷 Set Birth Data
            </button>
        </form >
    );
}
